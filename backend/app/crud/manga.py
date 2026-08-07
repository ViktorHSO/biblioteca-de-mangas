from sqlalchemy.orm import Session
from app.models.manga import Manga
from app.schemas.manga import MangaCreate


def get_mangas(
    db: Session,
    titulo: str = None,
    genero: str = None,
    status: str = None,
    autor: str = None,
    skip: int = 0,
    limit: int = 10,
):
    query = db.query(Manga)

    if titulo:
        query = query.filter(Manga.titulo.ilike(f"%{titulo}%"))
    if genero:
        query = query.filter(Manga.genero.ilike(f"%{genero}%"))
    if status:
        query = query.filter(Manga.status == status)
    if autor:
        query = query.filter(Manga.autor.ilike(f"%{autor}%"))

    total = query.count()
    mangas = query.offset(skip).limit(limit).all()

    return mangas, total


def create_manga(db: Session, manga: MangaCreate):
    novo_manga = Manga(**manga.model_dump())
    db.add(novo_manga)
    db.commit()
    db.refresh(novo_manga)
    return novo_manga


def get_manga_by_id(db: Session, manga_id: int):
    return db.query(Manga).filter(Manga.id == manga_id).first()


def update_manga(db: Session, manga_id: int, dados: MangaCreate):
    manga = get_manga_by_id(db, manga_id)
    if not manga:
        return None

    for campo, valor in dados.model_dump().items():
        setattr(manga, campo, valor)

    db.commit()
    db.refresh(manga)
    return manga


def delete_manga(db: Session, manga_id: int):
    manga = get_manga_by_id(db, manga_id)
    if not manga:
        return None

    db.delete(manga)
    db.commit()
    return manga


def create_manga(db: Session, manga: MangaCreate):
    novo_manga = Manga(**manga.model_dump())
    db.add(novo_manga)
    db.commit()
    db.refresh(novo_manga)
    return novo_manga


def get_manga_by_id(db: Session, manga_id: int):
    return db.query(Manga).filter(Manga.id == manga_id).first()


def update_manga(db: Session, manga_id: int, dados: MangaCreate):
    manga = get_manga_by_id(db, manga_id)
    if not manga:
        return None

    for campo, valor in dados.model_dump().items():
        setattr(manga, campo, valor)

    db.commit()
    db.refresh(manga)
    return manga


def delete_manga(db: Session, manga_id: int):
    manga = get_manga_by_id(db, manga_id)
    if not manga:
        return None

    db.delete(manga)
    db.commit()
    return manga