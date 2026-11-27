"""Tradução dos gêneros entre português, inglês e espanhol.

O gênero é cadastrado como texto livre ("Acción, Aventura"), em qualquer um dos
três idiomas. Os gêneros conhecidos abaixo são reconhecidos em qualquer idioma
(sem diferenciar acentos e maiúsculas) e exibidos no idioma escolhido no site.
Um gênero que não está na lista aparece do jeito que foi cadastrado.

Para adicionar um gênero, inclua uma linha em GENEROS com os nomes em pt, en e es
e, se quiser, outros nomes pelos quais ele também deve ser reconhecido.
"""
import unicodedata

# chave: (português, inglês, espanhol, [outros nomes aceitos])
GENEROS: dict[str, tuple[str, str, str, tuple[str, ...]]] = {
    "acao": ("Ação", "Action", "Acción", ()),
    "aventura": ("Aventura", "Adventure", "Aventura", ()),
    "comedia": ("Comédia", "Comedy", "Comedia", ()),
    "drama": ("Drama", "Drama", "Drama", ()),
    "fantasia": ("Fantasia", "Fantasy", "Fantasía", ()),
    "romance": ("Romance", "Romance", "Romance", ()),
    "terror": ("Terror", "Horror", "Terror", ()),
    "misterio": ("Mistério", "Mystery", "Misterio", ()),
    "suspense": ("Suspense", "Thriller", "Suspenso", ()),
    "ficcao_cientifica": (
        "Ficção científica", "Sci-fi", "Ciencia ficción",
        ("Science fiction", "Ficcion cientifica", "Ficção", "Scifi"),
    ),
    "cotidiano": ("Slice of life", "Slice of life", "Recuentos de la vida", ("Cotidiano", "Vida cotidiana")),
    "sobrenatural": ("Sobrenatural", "Supernatural", "Sobrenatural", ()),
    "artes_marciais": ("Artes marciais", "Martial arts", "Artes marciales", ()),
    "historico": ("Histórico", "Historical", "Histórico", ("Historia", "History")),
    "esportes": ("Esportes", "Sports", "Deportes", ("Esporte", "Deporte")),
    "psicologico": ("Psicológico", "Psychological", "Psicológico", ()),
    "escolar": ("Escolar", "School life", "Vida escolar", ("School", "Vida escolar")),
    "magia": ("Magia", "Magic", "Magia", ()),
    "reencarnacao": ("Reencarnação", "Reincarnation", "Reencarnación", ()),
    "regressao": ("Regressão", "Regression", "Regresión", ()),
    "vinganca": ("Vingança", "Revenge", "Venganza", ()),
    "tragedia": ("Tragédia", "Tragedy", "Tragedia", ()),
    "militar": ("Militar", "Military", "Militar", ()),
    "musica": ("Música", "Music", "Música", ()),
    "medico": ("Médico", "Medical", "Médico", ()),
    "culinaria": ("Culinária", "Cooking", "Cocina", ("Gastronomia", "Gastronomía")),
    "crime": ("Crime", "Crime", "Crimen", ()),
    "sobrevivencia": ("Sobrevivência", "Survival", "Supervivencia", ()),
    "pos_apocaliptico": ("Pós-apocalíptico", "Post-apocalyptic", "Postapocalíptico", ("Apocalíptico", "Apocalyptic")),
    "jogos": ("Jogos", "Games", "Videojuegos", ("Game", "Juegos", "Videogame")),
    "cultivo": ("Cultivo", "Cultivation", "Cultivo", ()),
    "demonios": ("Demônios", "Demons", "Demonios", ()),
    "monstros": ("Monstros", "Monsters", "Monstruos", ()),
    "vampiros": ("Vampiros", "Vampires", "Vampiros", ()),
    "zumbis": ("Zumbis", "Zombies", "Zombis", ()),
    "superpoderes": ("Superpoderes", "Superpowers", "Superpoderes", ()),
    "harem": ("Harém", "Harem", "Harem", ()),
    "isekai": ("Isekai", "Isekai", "Isekai", ()),
    "mecha": ("Mecha", "Mecha", "Mecha", ()),
    "murim": ("Murim", "Murim", "Murim", ()),
    "ecchi": ("Ecchi", "Ecchi", "Ecchi", ()),
    "gore": ("Gore", "Gore", "Gore", ()),
    "shounen": ("Shounen", "Shounen", "Shounen", ("Shonen",)),
    "shoujo": ("Shoujo", "Shoujo", "Shoujo", ("Shojo",)),
    "seinen": ("Seinen", "Seinen", "Seinen", ()),
    "josei": ("Josei", "Josei", "Josei", ()),
}

_POSICAO = {"pt": 0, "en": 1, "es": 2}


def normalizar(texto: str) -> str:
    """"Ciencia-Ficción " -> "ciencia ficcion": sem acentos, minúsculas, espaços únicos."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return " ".join(sem_acento.replace("-", " ").casefold().split())


_CHAVE_POR_NOME: dict[str, str] = {}
for _chave, (_pt, _en, _es, _outros) in GENEROS.items():
    for _nome in (_pt, _en, _es, *_outros):
        _CHAVE_POR_NOME.setdefault(normalizar(_nome), _chave)


def chave_do_genero(nome: str) -> str | None:
    return _CHAVE_POR_NOME.get(normalizar(nome))


def traduzir_genero(nome: str, idioma: str) -> str:
    chave = chave_do_genero(nome)
    if chave is None:
        return nome.strip()
    return GENEROS[chave][_POSICAO.get(idioma, 0)]


def separar(generos: str | None) -> list[str]:
    return [g.strip() for g in (generos or "").split(",") if g.strip()]


def traduzir_lista(generos: str | None, idioma: str) -> str | None:
    """"Acción, Aventura" em português -> "Ação, Aventura"."""
    if generos is None:
        return None
    return ", ".join(traduzir_genero(g, idioma) for g in separar(generos))


def nomes_equivalentes(nome: str) -> list[str]:
    """Todos os nomes de um gênero, para o filtro achar "Acción" ao buscar por "Action"."""
    chave = chave_do_genero(nome)
    if chave is None:
        return [nome]
    pt, en, es, outros = GENEROS[chave]
    return list(dict.fromkeys((pt, en, es, *outros)))
