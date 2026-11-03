from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core import capas
from app.core.dependencias import exigir_admin
from app.core.limitador import limitador
from app.crud import capitulo as crud_capitulo
from app.crud import manga as crud_manga
from app.database import get_db
from app.schemas.comum import StatusLeitura, TipoObra
from app.schemas.manga import (
    MangaAtualizado,
    MangaCreate,
    MangaDetalhe,
    MangaPaginado,
    MangaRanking,
    MangaResponse,
    Visualizacoes,
)

router = APIRouter(prefix="/mangas", tags=["Mangás"])

TAMANHO_MAXIMO_BUSCA = 100


def _buscar_ou_404(db: Session, manga_id: int):
    manga = crud_manga.get_manga_by_id(db, manga_id)
    if not manga:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return manga


# As rotas fixas (/ranking, /destaques, /atualizados, /generos) vêm antes de /{manga_id}.

@router.get("/", response_model=MangaPaginado)
def listar_mangas(
    titulo: str | None = Query(default=None, max_length=TAMANHO_MAXIMO_BUSCA),
    genero: str | None = Query(default=None, max_length=TAMANHO_MAXIMO_BUSCA),
    autor: str | None = Query(default=None, max_length=TAMANHO_MAXIMO_BUSCA),
    status: StatusLeitura | None = None,
    tipo: TipoObra | None = None,
    ordenar: Literal["recentes", "titulo", "populares"] = "recentes",
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    mangas, total = crud_manga.get_mangas(db, titulo, genero, status, autor, tipo, ordenar, skip, limit)
    return {"total": total, "itens": mangas}


@router.get("/ranking", response_model=list[MangaRanking])
def ranking(limit: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)):
    mangas = crud_manga.get_ranking(db, limit)
    return [
        MangaRanking(**MangaResponse.model_validate(manga).model_dump(), posicao=posicao)
        for posicao, manga in enumerate(mangas, start=1)
    ]


@router.get("/destaques", response_model=list[MangaResponse])
def destaques(limit: int = Query(default=5, ge=1, le=20), db: Session = Depends(get_db)):
    return crud_manga.get_destaques(db, limit)


@router.get("/atualizados", response_model=list[MangaAtualizado])
def atualizados(limit: int = Query(default=12, ge=1, le=24), db: Session = Depends(get_db)):
    """Mangás com capítulo novo, cada um com os 2 últimos capítulos (seção "Novos capítulos" da Home)."""
    return [
        MangaAtualizado(
            **MangaResponse.model_validate(manga).model_dump(),
            ultimos_capitulos=crud_capitulo.get_ultimos_do_manga(db, manga.id),
        )
        for manga in crud_manga.get_atualizados(db, limit)
    ]


@router.get("/generos", response_model=list[str])
def generos(db: Session = Depends(get_db)):
    return crud_manga.get_generos(db)


@router.get("/{manga_id}", response_model=MangaDetalhe)
def buscar_manga(manga_id: int, db: Session = Depends(get_db)):
    return _buscar_ou_404(db, manga_id)


@router.post("/", response_model=MangaResponse, status_code=status.HTTP_201_CREATED)
def criar_manga(manga: MangaCreate, db: Session = Depends(get_db), _admin=Depends(exigir_admin)):
    return crud_manga.create_manga(db, manga)


@router.put("/{manga_id}", response_model=MangaResponse)
def atualizar_manga(
    manga_id: int, manga: MangaCreate, db: Session = Depends(get_db), _admin=Depends(exigir_admin)
):
    manga_atualizado = crud_manga.update_manga(db, manga_id, manga)
    if not manga_atualizado:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return manga_atualizado


@router.post("/{manga_id}/capa", response_model=MangaResponse)
async def enviar_capa(
    manga_id: int,
    arquivo: UploadFile = File(description="Imagem JPG, PNG ou WEBP de até 5 MB"),
    db: Session = Depends(get_db),
    _admin=Depends(exigir_admin),
):
    """Troca a capa do mangá por uma imagem enviada do computador."""
    manga = _buscar_ou_404(db, manga_id)
    # Lê no máximo 1 byte além do limite: basta para saber que passou, sem carregar o resto.
    conteudo = await arquivo.read(capas.TAMANHO_MAXIMO_BYTES + 1)
    try:
        caminho = capas.salvar_capa(conteudo)
    except capas.CapaInvalida as erro:
        raise HTTPException(status_code=422, detail=str(erro)) from None
    return crud_manga.trocar_capa(db, manga, caminho)


@router.delete("/{manga_id}")
def deletar_manga(manga_id: int, db: Session = Depends(get_db), _admin=Depends(exigir_admin)):
    manga = crud_manga.delete_manga(db, manga_id)
    if not manga:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return {"mensagem": f"Mangá '{manga.titulo}' deletado com sucesso"}


@router.post("/{manga_id}/visualizar", response_model=Visualizacoes)
@limitador.limit("30/minute")
def visualizar_manga(request: Request, manga_id: int, db: Session = Depends(get_db)):
    """Conta uma visualização da página do mangá (limitado por IP para evitar abuso)."""
    total = crud_manga.registrar_visualizacao(db, manga_id)
    if total is None:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return {"visualizacoes": total}
