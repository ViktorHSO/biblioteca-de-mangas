from sqlalchemy import and_, func, or_, update
from sqlalchemy.orm import Session, aliased

from app.core.generos import chave_do_genero, nomes_equivalentes, normalizar, separar, traduzir_genero
from app.core.idiomas import idioma_atual
from app.core.uploads import remover_imagens
from app.crud.utils import padrao_like
from app.models.capitulo import Capitulo
from app.models.manga import Manga
from app.models.manga_traducao import MangaTraducao
from app.schemas.manga import MangaCreate

ORDENACOES = {
    "recentes": (Manga.atualizado_em.desc(), Manga.id.desc()),
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
        # Acha o mangá pelo título original ou por qualquer uma das traduções.
        padrao = padrao_like(titulo)
        query = query.filter(
            or_(
                Manga.titulo.ilike(padrao, escape="\\"),
                Manga.traducoes.any(MangaTraducao.titulo.ilike(padrao, escape="\\")),
            )
        )
    if genero:
        # "Action" também acha os cadastrados como "Ação" ou "Acción".
        query = query.filter(
            or_(*(Manga.genero.ilike(padrao_like(nome), escape="\\") for nome in nomes_equivalentes(genero)))
        )
    if autor:
        query = query.filter(Manga.autor.ilike(padrao_like(autor), escape="\\"))
    if status:
        query = query.filter(Manga.status == status)
    if tipo:
        query = query.filter(Manga.tipo == tipo)

    total = query.count()
    if ordenar == "titulo":
        # Ordem alfabética pelo título no idioma pedido (ou o original, se não houver tradução).
        idioma = idioma_atual()
        traducao = aliased(MangaTraducao)
        query = query.outerjoin(
            traducao,
            and_(traducao.manga_id == Manga.id, traducao.idioma == idioma, Manga.idioma_original != idioma),
        ).order_by(func.coalesce(traducao.titulo, Manga.titulo).asc(), Manga.id.asc())
    else:
        query = query.order_by(*ORDENACOES[ordenar])
    mangas = query.offset(skip).limit(limit).all()
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


def get_atualizados(db: Session, limit: int = 12):
    """Mangás ordenados pelo capítulo cadastrado mais recentemente (só os que têm capítulos)."""
    ultimo = (
        db.query(
            Capitulo.manga_id,
            func.max(Capitulo.criado_em).label("ultimo_em"),
            func.max(Capitulo.id).label("ultimo_id"),
        )
        .group_by(Capitulo.manga_id)
        .subquery()
    )
    return (
        db.query(Manga)
        .join(ultimo, ultimo.c.manga_id == Manga.id)
        .order_by(ultimo.c.ultimo_em.desc(), ultimo.c.ultimo_id.desc())
        .limit(limit)
        .all()
    )


def get_generos(db: Session) -> list[str]:
    """Lista única de gêneros no idioma pedido, separando os cadastrados juntos ("Ação, Aventura").

    "Acción" e "Ação" são o mesmo gênero e aparecem uma vez só, já traduzidos.
    """
    idioma = idioma_atual()
    generos: dict[str, str] = {}
    for (valor,) in db.query(Manga.genero).filter(Manga.genero.is_not(None)).distinct():
        for genero in separar(valor):
            chave = chave_do_genero(genero) or normalizar(genero)
            generos.setdefault(chave, traduzir_genero(genero, idioma))
    # Ordena ignorando acentos e maiúsculas ("Ação" fica antes de "Aventura").
    return sorted(generos.values(), key=normalizar)


def get_manga_by_id(db: Session, manga_id: int):
    return db.get(Manga, manga_id)


def _aplicar_traducoes(manga: Manga, traducoes: dict | None):
    """Atualiza as traduções no lugar (sem apagar e recriar, por causa da chave única).

    Traduções vazias e a do próprio idioma original são descartadas.
    """
    if traducoes is None:
        return
    atuais = {t.idioma: t for t in manga.traducoes}
    for idioma, dados in traducoes.items():
        titulo, sinopse = dados.titulo, dados.sinopse
        existente = atuais.pop(idioma, None)
        if idioma == manga.idioma_original or not (titulo or sinopse):
            if existente:
                manga.traducoes.remove(existente)
        elif existente:
            existente.titulo, existente.sinopse = titulo, sinopse
        else:
            manga.traducoes.append(MangaTraducao(idioma=idioma, titulo=titulo, sinopse=sinopse))
    # Idiomas que não vieram no envio deixam de ter tradução.
    for sobrando in atuais.values():
        manga.traducoes.remove(sobrando)


def _campos_do_manga(dados: MangaCreate) -> dict:
    return dados.model_dump(exclude={"traducoes"})


def create_manga(db: Session, manga: MangaCreate):
    novo_manga = Manga(**_campos_do_manga(manga))
    _aplicar_traducoes(novo_manga, manga.traducoes)
    db.add(novo_manga)
    db.commit()
    db.refresh(novo_manga)
    return novo_manga


def update_manga(db: Session, manga_id: int, dados: MangaCreate):
    manga = get_manga_by_id(db, manga_id)
    if not manga:
        return None

    capa_anterior = manga.capa_url
    for campo, valor in _campos_do_manga(dados).items():
        setattr(manga, campo, valor)
    if dados.traducoes is not None:
        _aplicar_traducoes(manga, dados.traducoes)
    else:
        # Sem traduções no envio, as atuais ficam; só sai a que coincidir com o novo idioma original.
        for traducao in [t for t in manga.traducoes if t.idioma == manga.idioma_original]:
            manga.traducoes.remove(traducao)

    db.commit()
    db.refresh(manga)
    if capa_anterior != manga.capa_url:
        remover_imagens(capa_anterior)
    return manga


def trocar_capa(db: Session, manga: Manga, caminho: str):
    capa_anterior = manga.capa_url
    manga.capa_url = caminho
    db.commit()
    db.refresh(manga)
    if capa_anterior != caminho:
        remover_imagens(capa_anterior)
    return manga


def delete_manga(db: Session, manga_id: int):
    manga = get_manga_by_id(db, manga_id)
    if not manga:
        return None

    # Os arquivos só são apagados depois do commit: se o banco falhar, nada se perde.
    imagens = [manga.capa_url] + [p.imagem_url for c in manga.capitulos for p in c.paginas]
    db.delete(manga)
    db.commit()
    remover_imagens(*imagens)
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
