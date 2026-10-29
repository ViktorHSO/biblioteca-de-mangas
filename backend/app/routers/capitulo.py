from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.dependencias import exigir_admin
from app.core.limitador import limitador
from app.crud import capitulo as crud_capitulo
from app.crud import manga as crud_manga
from app.database import get_db
from app.schemas.capitulo import (
    CapituloCreate,
    CapituloLeitura,
    CapituloRecente,
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


@router.get("/recentes", response_model=list[CapituloRecente])
def capitulos_recentes(limit: int = Query(default=20, ge=1, le=50), db: Session = Depends(get_db)):
    """Últimos capítulos cadastrados, com os dados do mangá (seção "Novos capítulos")."""
    return crud_capitulo.get_capitulos_recentes(db, limit)


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
