from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.dependencias import exigir_admin
from app.core.limitador import limitador
from app.crud import manga as crud_manga
from app.database import get_db
from app.schemas.comum import StatusLeitura, TipoObra
from app.schemas.manga import (
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


# As rotas fixas (/ranking, /destaques, /generos) vêm antes de /{manga_id}.

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
