import unicodedata

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.crud.utils import padrao_like
from app.models.manga import Manga
from app.schemas.manga import MangaCreate

ORDENACOES = {
    "recentes": (Manga.atualizado_em.desc(), Manga.id.desc()),
    "titulo": (Manga.titulo.asc(), Manga.id.asc()),
    "populares": (Manga.visualizacoes.desc(), Manga.id.desc()),
}


def get_mangas(
    db: Session,
    titulo: str | None = None,
    genero: str | None = None,
    status: str | None = None,
    autor: str | None = None,
    tipo: str | None = None,
    ordenar: str = "recentes",
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(Manga)

    if titulo:
        query = query.filter(Manga.titulo.ilike(padrao_like(titulo), escape="\\"))
    if genero:
        query = query.filter(Manga.genero.ilike(padrao_like(genero), escape="\\"))
    if autor:
        query = query.filter(Manga.autor.ilike(padrao_like(autor), escape="\\"))
    if status:
        query = query.filter(Manga.status == status)
    if tipo:
        query = query.filter(Manga.tipo == tipo)

    total = query.count()
    mangas = query.order_by(*ORDENACOES[ordenar]).offset(skip).limit(limit).all()
    return mangas, total


def get_ranking(db: Session, limit: int = 10):
    return (
        db.query(Manga)
        .order_by(Manga.visualizacoes.desc(), Manga.atualizado_em.desc())
        .limit(limit)
        .all()
    )


def get_destaques(db: Session, limit: int = 5):
    """Mangás marcados como destaque; se nenhum foi marcado, usa os mais vistos com capa."""
    destaques = (
        db.query(Manga)
        .filter(Manga.destaque.is_(True))
        .order_by(Manga.atualizado_em.desc())
        .limit(limit)
        .all()
    )
    if destaques:
        return destaques
    return (
        db.query(Manga)
        .filter(Manga.capa_url.is_not(None))
        .order_by(Manga.visualizacoes.desc(), Manga.atualizado_em.desc())
        .limit(limit)
        .all()
    )


def get_generos(db: Session) -> list[str]:
    """Lista única de gêneros, separando os que foram cadastrados juntos ("Ação, Aventura")."""
    generos: dict[str, str] = {}
    for (valor,) in db.query(Manga.genero).filter(Manga.genero.is_not(None)).distinct():
        for genero in valor.split(","):
            genero = genero.strip()
            if genero:
                generos.setdefault(genero.casefold(), genero)
    return sorted(generos.values(), key=_chave_ordenacao)


def _chave_ordenacao(texto: str) -> str:
    """Ordena ignorando acentos e maiúsculas ("Ação" fica antes de "Aventura")."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sem_acento.casefold()


def get_manga_by_id(db: Session, manga_id: int):
    return db.get(Manga, manga_id)


def create_manga(db: Session, manga: MangaCreate):
    novo_manga = Manga(**manga.model_dump())
    db.add(novo_manga)
    db.commit()
    db.refresh(novo_manga)
    return novo_manga


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


def registrar_visualizacao(db: Session, manga_id: int) -> int | None:
    # UPDATE direto no banco (visualizacoes = visualizacoes + 1) evita perder
    # contagens quando duas pessoas acessam ao mesmo tempo. Não mexe em atualizado_em.
    resultado = db.execute(
        update(Manga)
        .where(Manga.id == manga_id)
        .values(visualizacoes=Manga.visualizacoes + 1, atualizado_em=Manga.atualizado_em)
    )
    if resultado.rowcount == 0:
        db.rollback()
        return None
    db.commit()
    return db.query(Manga.visualizacoes).filter(Manga.id == manga_id).scalar()
