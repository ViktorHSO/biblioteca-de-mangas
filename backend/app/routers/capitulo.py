from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core import uploads
from app.core.dependencias import exigir_admin
from app.core.limitador import limitador
from app.crud import capitulo as crud_capitulo
from app.crud import manga as crud_manga
from app.database import get_db
from app.schemas.capitulo import (
    MAXIMO_PAGINAS_POR_CAPITULO,
    CapituloCreate,
    CapituloLeitura,
    CapituloRecentePaginado,
    CapituloResponse,
    CapituloUpdate,
    PaginaResponse,
    PaginasUpdate,
)
from app.schemas.manga import Visualizacoes

router = APIRouter(prefix="/capitulos", tags=["Capítulos"])


def _capitulo_ou_404(db: Session, capitulo_id: int):
    capitulo = crud_capitulo.get_capitulo(db, capitulo_id)
    if not capitulo:
        raise HTTPException(status_code=404, detail="Capítulo não encontrado")
    return capitulo


def _garantir_numero_livre(db: Session, manga_id: int, numero: int, ignorar_id: int | None = None):
    if crud_capitulo.numero_ja_existe(db, manga_id, numero, ignorar_id):
        raise HTTPException(status_code=409, detail=f"Já existe o capítulo {numero} neste mangá")


@router.get("/recentes", response_model=CapituloRecentePaginado)
def capitulos_recentes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Últimos capítulos cadastrados, com os dados do mangá (página de lançamentos)."""
    capitulos, total = crud_capitulo.get_capitulos_recentes(db, skip, limit)
    return {"total": total, "itens": capitulos}


@router.get("/manga/{manga_id}", response_model=list[CapituloResponse])
def listar_capitulos_do_manga(manga_id: int, db: Session = Depends(get_db)):
    if not crud_manga.get_manga_by_id(db, manga_id):
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return crud_capitulo.get_capitulos_by_manga(db, manga_id)


@router.get("/{capitulo_id}", response_model=CapituloLeitura)
def ler_capitulo(capitulo_id: int, db: Session = Depends(get_db)):
    capitulo = _capitulo_ou_404(db, capitulo_id)
    anterior_id, proximo_id = crud_capitulo.get_vizinhos(db, capitulo)
    dados = CapituloResponse.model_validate(capitulo).model_dump()
    return {
        **dados,
        "manga": capitulo.manga,
        "paginas": capitulo.paginas,
        "anterior_id": anterior_id,
        "proximo_id": proximo_id,
    }


@router.post("/", response_model=CapituloResponse, status_code=status.HTTP_201_CREATED)
def criar_capitulo(capitulo: CapituloCreate, db: Session = Depends(get_db), _admin=Depends(exigir_admin)):
    if not crud_manga.get_manga_by_id(db, capitulo.manga_id):
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    _garantir_numero_livre(db, capitulo.manga_id, capitulo.numero)
    return crud_capitulo.create_capitulo(db, capitulo)


@router.put("/{capitulo_id}", response_model=CapituloResponse)
def atualizar_capitulo(
    capitulo_id: int, dados: CapituloUpdate, db: Session = Depends(get_db), _admin=Depends(exigir_admin)
):
    capitulo = _capitulo_ou_404(db, capitulo_id)
    _garantir_numero_livre(db, capitulo.manga_id, dados.numero, ignorar_id=capitulo.id)
    return crud_capitulo.update_capitulo(db, capitulo, dados)


@router.put("/{capitulo_id}/paginas", response_model=list[PaginaResponse])
def definir_paginas(
    capitulo_id: int, dados: PaginasUpdate, db: Session = Depends(get_db), _admin=Depends(exigir_admin)
):
    """Substitui todas as páginas do capítulo pelas URLs enviadas, na ordem recebida."""
    capitulo = _capitulo_ou_404(db, capitulo_id)
    return crud_capitulo.substituir_paginas(db, capitulo, dados.urls)


@router.post("/{capitulo_id}/paginas/arquivos", response_model=list[PaginaResponse])
async def enviar_paginas(
    capitulo_id: int,
    arquivos: list[UploadFile] = File(description="Imagens JPG, PNG ou WEBP de até 10 MB cada, na ordem de leitura"),
    db: Session = Depends(get_db),
    _admin=Depends(exigir_admin),
):
    """Acrescenta imagens enviadas do computador no fim do capítulo, na ordem recebida.

    Ou entram todas, ou nenhuma: se um arquivo for recusado, nada é gravado.
    """
    capitulo = _capitulo_ou_404(db, capitulo_id)
    if len(arquivos) > uploads.MAXIMO_ARQUIVOS_POR_ENVIO:
        raise HTTPException(422, f"Envie no máximo {uploads.MAXIMO_ARQUIVOS_POR_ENVIO} imagens por vez.")
    if len(capitulo.paginas) + len(arquivos) > MAXIMO_PAGINAS_POR_CAPITULO:
        raise HTTPException(422, f"Um capítulo pode ter no máximo {MAXIMO_PAGINAS_POR_CAPITULO} páginas.")

    conteudos = []
    for arquivo in arquivos:
        conteudo = await arquivo.read(uploads.PAGINA.tamanho_maximo + 1)
        try:
            uploads.validar_imagem(conteudo, uploads.PAGINA)
        except uploads.ImagemInvalida as erro:
            raise HTTPException(422, f"{(arquivo.filename or 'arquivo')[:100]}: {erro}") from None
        conteudos.append(conteudo)

    caminhos = [uploads.salvar_imagem(conteudo, uploads.PAGINA) for conteudo in conteudos]
    try:
        return crud_capitulo.adicionar_paginas(db, capitulo, caminhos)
    except Exception:
        uploads.remover_imagens(*caminhos)  # o banco falhou: não deixa arquivos soltos
        raise


@router.delete("/{capitulo_id}")
def deletar_capitulo(capitulo_id: int, db: Session = Depends(get_db), _admin=Depends(exigir_admin)):
    capitulo = _capitulo_ou_404(db, capitulo_id)
    crud_capitulo.delete_capitulo(db, capitulo)
    return {"mensagem": f"Capítulo {capitulo.numero} deletado com sucesso"}


@router.post("/{capitulo_id}/visualizar", response_model=Visualizacoes)
@limitador.limit("30/minute")
def visualizar_capitulo(request: Request, capitulo_id: int, db: Session = Depends(get_db)):
    """Conta uma leitura do capítulo (e do mangá). Limitado por IP para evitar abuso."""
    capitulo = _capitulo_ou_404(db, capitulo_id)
    return {"visualizacoes": crud_capitulo.registrar_visualizacao(db, capitulo)}
