from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.capitulo import CapituloCreate, CapituloResponse
from app.crud import capitulo as crud_capitulo

router = APIRouter(prefix="/capitulos", tags=["Capítulos"])


@router.get("/manga/{manga_id}", response_model=list[CapituloResponse])
def listar_capitulos_do_manga(manga_id: int, db: Session = Depends(get_db)):
    return crud_capitulo.get_capitulos_by_manga(db, manga_id)


@router.post("/", response_model=CapituloResponse)
def criar_capitulo(capitulo: CapituloCreate, db: Session = Depends(get_db)):
    return crud_capitulo.create_capitulo(db, capitulo)


@router.delete("/{capitulo_id}")
def deletar_capitulo(capitulo_id: int, db: Session = Depends(get_db)):
    capitulo = crud_capitulo.delete_capitulo(db, capitulo_id)
    if not capitulo:
        raise HTTPException(status_code=404, detail="Capítulo não encontrado")
    return {"mensagem": f"Capítulo {capitulo.numero} deletado com sucesso"}