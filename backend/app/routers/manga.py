from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.manga import MangaCreate, MangaResponse, MangaPaginado
from app.crud import manga as crud_manga

router = APIRouter(prefix="/mangas", tags=["Mangás"])


@router.get("/", response_model=MangaPaginado)
def listar_mangas(
    titulo: str = None,
    genero: str = None,
    status: str = None,
    autor: str = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    mangas, total = crud_manga.get_mangas(db, titulo, genero, status, autor, skip, limit)
    return {"total": total, "itens": mangas}


@router.get("/{manga_id}", response_model=MangaResponse)
def buscar_manga(manga_id: int, db: Session = Depends(get_db)):
    manga = crud_manga.get_manga_by_id(db, manga_id)
    if not manga:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return manga


@router.post("/", response_model=MangaResponse)
def criar_manga(manga: MangaCreate, db: Session = Depends(get_db)):
    return crud_manga.create_manga(db, manga)


@router.put("/{manga_id}", response_model=MangaResponse)
def atualizar_manga(manga_id: int, manga: MangaCreate, db: Session = Depends(get_db)):
    manga_atualizado = crud_manga.update_manga(db, manga_id, manga)
    if not manga_atualizado:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return manga_atualizado


@router.delete("/{manga_id}")
def deletar_manga(manga_id: int, db: Session = Depends(get_db)):
    manga = crud_manga.delete_manga(db, manga_id)
    if not manga:
        raise HTTPException(status_code=404, detail="Mangá não encontrado")
    return {"mensagem": f"Mangá '{manga.titulo}' deletado com sucesso"}