from sqlalchemy.orm import Session
from app.models.capitulo import Capitulo
from app.schemas.capitulo import CapituloCreate


def get_capitulos_by_manga(db: Session, manga_id: int):
    return db.query(Capitulo).filter(Capitulo.manga_id == manga_id).order_by(Capitulo.numero).all()


def create_capitulo(db: Session, capitulo: CapituloCreate):
    novo_capitulo = Capitulo(**capitulo.model_dump())
    db.add(novo_capitulo)
    db.commit()
    db.refresh(novo_capitulo)
    return novo_capitulo


def delete_capitulo(db: Session, capitulo_id: int):
    capitulo = db.query(Capitulo).filter(Capitulo.id == capitulo_id).first()
    if not capitulo:
        return None
    db.delete(capitulo)
    db.commit()
    return capitulo