from sqlalchemy import func, update
from sqlalchemy.orm import Session, joinedload

from app.models.capitulo import Capitulo
from app.models.manga import Manga
from app.models.pagina import Pagina
from app.schemas.capitulo import CapituloCreate, CapituloUpdate


def get_capitulos_by_manga(db: Session, manga_id: int):
    return db.query(Capitulo).filter(Capitulo.manga_id == manga_id).order_by(Capitulo.numero.desc()).all()


def get_capitulo(db: Session, capitulo_id: int):
    return db.get(Capitulo, capitulo_id)


def get_capitulos_recentes(db: Session, limit: int = 20):
    return (
        db.query(Capitulo)
        .options(joinedload(Capitulo.manga))
        .order_by(Capitulo.criado_em.desc(), Capitulo.id.desc())
        .limit(limit)
        .all()
    )


def numero_ja_existe(db: Session, manga_id: int, numero: int, ignorar_id: int | None = None) -> bool:
    query = db.query(Capitulo.id).filter(Capitulo.manga_id == manga_id, Capitulo.numero == numero)
    if ignorar_id is not None:
        query = query.filter(Capitulo.id != ignorar_id)
    return query.first() is not None


def get_vizinhos(db: Session, capitulo: Capitulo) -> tuple[int | None, int | None]:
    """Ids do capítulo anterior e do próximo, pelo número, dentro do mesmo mangá."""
    anterior = (
        db.query(Capitulo.id)
        .filter(Capitulo.manga_id == capitulo.manga_id, Capitulo.numero < capitulo.numero)
        .order_by(Capitulo.numero.desc())
        .first()
    )
    proximo = (
        db.query(Capitulo.id)
        .filter(Capitulo.manga_id == capitulo.manga_id, Capitulo.numero > capitulo.numero)
        .order_by(Capitulo.numero.asc())
        .first()
    )
    return (anterior[0] if anterior else None, proximo[0] if proximo else None)


def _marcar_manga_atualizado(db: Session, manga_id: int):
    """Faz o mangá subir em "atualizados recentemente" quando seus capítulos mudam."""
    db.execute(update(Manga).where(Manga.id == manga_id).values(atualizado_em=func.now()))


def create_capitulo(db: Session, capitulo: CapituloCreate):
    novo_capitulo = Capitulo(**capitulo.model_dump())
    db.add(novo_capitulo)
    db.flush()
    _marcar_manga_atualizado(db, capitulo.manga_id)
    db.commit()
    db.refresh(novo_capitulo)
    return novo_capitulo


def update_capitulo(db: Session, capitulo: Capitulo, dados: CapituloUpdate):
    for campo, valor in dados.model_dump().items():
        setattr(capitulo, campo, valor)
    db.commit()
    db.refresh(capitulo)
    return capitulo


def substituir_paginas(db: Session, capitulo: Capitulo, urls: list[str]):
    capitulo.paginas.clear()
    db.flush()  # remove as antigas antes de inserir as novas (ordem é única por capítulo)
    capitulo.paginas.extend(Pagina(ordem=i, imagem_url=url) for i, url in enumerate(urls, start=1))
    _marcar_manga_atualizado(db, capitulo.manga_id)
    db.commit()
    db.refresh(capitulo)
    return capitulo.paginas


def delete_capitulo(db: Session, capitulo: Capitulo):
    db.delete(capitulo)
    db.commit()
    return capitulo


def registrar_visualizacao(db: Session, capitulo: Capitulo) -> int:
    """Conta a leitura no capítulo e no mangá (usado pelo ranking)."""
    db.execute(
        update(Capitulo)
        .where(Capitulo.id == capitulo.id)
        .values(visualizacoes=Capitulo.visualizacoes + 1)
    )
    db.execute(
        update(Manga)
        .where(Manga.id == capitulo.manga_id)
        .values(visualizacoes=Manga.visualizacoes + 1, atualizado_em=Manga.atualizado_em)
    )
    db.commit()
    return db.query(Capitulo.visualizacoes).filter(Capitulo.id == capitulo.id).scalar()
