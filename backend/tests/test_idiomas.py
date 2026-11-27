"""Títulos, sinopses e gêneros em português, inglês e espanhol."""
import pytest

from app.core.generos import nomes_equivalentes, traduzir_lista
from app.core.idiomas import idioma_do_cabecalho

EN = {"Accept-Language": "en"}
ES = {"Accept-Language": "es"}
PT = {"Accept-Language": "pt-BR"}


@pytest.fixture
def manga_espanhol(criar_manga):
    return criar_manga(
        titulo="El Sentido Absoluto de las Espadas",
        genero="Acción, Fantasía, Artes Marciales",
        sinopse="Un espadachín sin talento...",
        destaque=True,
        idioma_original="es",
        traducoes={
            "pt": {"titulo": "O Sentido Absoluto das Espadas", "sinopse": "Um espadachim sem talento..."},
            "en": {"titulo": "The Absolute Sense of Swords"},
        },
    )


@pytest.mark.parametrize(
    ("cabecalho", "esperado"),
    [
        (None, "pt"),
        ("", "pt"),
        ("en", "en"),
        ("es-MX,es;q=0.9", "es"),
        ("fr-FR,fr;q=0.9,en;q=0.8", "en"),
        ("de, ja", "pt"),
        ("pt;q=0.5, es;q=0.9", "es"),
        ("en;q=0, es", "es"),
    ],
)
def test_idioma_do_cabecalho(cabecalho, esperado):
    assert idioma_do_cabecalho(cabecalho) == esperado


def test_titulo_e_sinopse_no_idioma_pedido(client, manga_espanhol):
    url = f"/mangas/{manga_espanhol['id']}"

    pt = client.get(url, headers=PT).json()
    assert pt["titulo"] == "O Sentido Absoluto das Espadas"
    assert pt["sinopse"] == "Um espadachim sem talento..."
    assert pt["genero"] == "Ação, Fantasia, Artes marciais"
    assert pt["titulo_original"] == "El Sentido Absoluto de las Espadas"
    assert pt["idioma_original"] == "es"

    es = client.get(url, headers=ES).json()
    assert es["titulo"] == "El Sentido Absoluto de las Espadas"
    assert es["genero"] == "Acción, Fantasía, Artes marciales"

    # Sem sinopse em inglês: usa a original.
    en = client.get(url, headers=EN).json()
    assert en["titulo"] == "The Absolute Sense of Swords"
    assert en["sinopse"] == "Un espadachín sin talento..."
    assert en["genero"] == "Action, Fantasy, Martial arts"


def test_sem_cabecalho_usa_portugues(client, manga_espanhol):
    assert client.get(f"/mangas/{manga_espanhol['id']}").json()["titulo"] == "O Sentido Absoluto das Espadas"


def test_resposta_avisa_que_varia_pelo_idioma(client, manga_espanhol):
    resposta = client.get("/mangas/", headers={**EN, "Origin": "http://localhost:5173"})
    assert "accept-language" in resposta.headers["vary"].lower()


def test_traducao_vale_nas_listagens_e_no_leitor(client, manga_espanhol, criar_capitulo):
    capitulo = criar_capitulo(manga_espanhol["id"], 1)
    titulo_en = "The Absolute Sense of Swords"

    assert client.get("/mangas/", headers=EN).json()["itens"][0]["titulo"] == titulo_en
    assert client.get("/mangas/ranking", headers=EN).json()[0]["titulo"] == titulo_en
    assert client.get("/mangas/destaques", headers=EN).json()[0]["titulo"] == titulo_en
    assert client.get("/mangas/atualizados", headers=EN).json()[0]["titulo"] == titulo_en
    assert client.get(f"/capitulos/{capitulo['id']}", headers=EN).json()["manga"]["titulo"] == titulo_en
    assert client.get("/capitulos/recentes", headers=EN).json()["itens"][0]["manga"]["titulo"] == titulo_en


def test_busca_acha_pelo_titulo_em_qualquer_idioma(client, manga_espanhol, criar_manga):
    criar_manga(titulo="Outro")
    for termo in ("Espadas", "Absolute Sense", "Sentido Absoluto das"):
        corpo = client.get("/mangas/", params={"titulo": termo}).json()
        assert [m["id"] for m in corpo["itens"]] == [manga_espanhol["id"]], termo


def test_ordem_alfabetica_usa_o_titulo_traduzido(client, criar_manga):
    criar_manga(titulo="Zorro", idioma_original="es", traducoes={"en": {"titulo": "Aardvark"}})
    criar_manga(titulo="Mango")
    titulos = lambda h: [m["titulo"] for m in client.get("/mangas/", params={"ordenar": "titulo"}, headers=h).json()["itens"]]  # noqa: E731
    assert titulos(EN) == ["Aardvark", "Mango"]
    assert titulos(ES) == ["Mango", "Zorro"]


def test_generos_unicos_e_traduzidos(client, criar_manga):
    criar_manga(titulo="A", genero="Acción, Aventura")
    criar_manga(titulo="B", genero="Ação, Seinen")
    criar_manga(titulo="C", genero="Action, Gênero Inventado")
    assert client.get("/mangas/generos", headers=PT).json() == ["Ação", "Aventura", "Gênero Inventado", "Seinen"]
    assert client.get("/mangas/generos", headers=EN).json() == ["Action", "Adventure", "Gênero Inventado", "Seinen"]
    assert client.get("/mangas/generos", headers=ES).json() == ["Acción", "Aventura", "Gênero Inventado", "Seinen"]


def test_filtro_de_genero_aceita_qualquer_idioma(client, criar_manga):
    criar_manga(titulo="A", genero="Acción")
    criar_manga(titulo="B", genero="Ação")
    criar_manga(titulo="C", genero="Romance")
    for nome in ("Action", "Ação", "acción"):
        assert client.get("/mangas/", params={"genero": nome}).json()["total"] == 2, nome


def test_dados_para_edicao_trazem_original_e_traducoes(client, auth, manga_espanhol):
    url = f"/mangas/{manga_espanhol['id']}/edicao"
    assert client.get(url).status_code == 401

    dados = client.get(url, headers={**auth, **EN}).json()
    assert dados["titulo"] == "El Sentido Absoluto de las Espadas"
    assert dados["genero"] == "Acción, Fantasía, Artes Marciales"
    assert dados["idioma_original"] == "es"
    assert dados["traducoes"] == {
        "pt": {"titulo": "O Sentido Absoluto das Espadas", "sinopse": "Um espadachim sem talento..."},
        "en": {"titulo": "The Absolute Sense of Swords", "sinopse": None},
    }


def test_edicao_atualiza_remove_e_mantem_traducoes(client, auth, manga_espanhol):
    url = f"/mangas/{manga_espanhol['id']}"
    base = {"titulo": "El Sentido Absoluto de las Espadas", "idioma_original": "es"}

    # Sem "traducoes" no envio: continuam as mesmas.
    assert client.put(url, json=base, headers=auth).status_code == 200
    assert client.get(url, headers=EN).json()["titulo"] == "The Absolute Sense of Swords"

    # Com "traducoes": substitui; inglês vazio = sem tradução.
    corpo = {**base, "traducoes": {"pt": {"titulo": "Novo título"}, "en": {"titulo": "  ", "sinopse": ""}}}
    assert client.put(url, json=corpo, headers=auth).status_code == 200
    assert client.get(url, headers=PT).json()["titulo"] == "Novo título"
    assert client.get(url, headers=EN).json()["titulo"] == "El Sentido Absoluto de las Espadas"
    assert client.get(f"{url}/edicao", headers=auth).json()["traducoes"] == {
        "pt": {"titulo": "Novo título", "sinopse": None}
    }


def test_traducao_no_idioma_original_e_ignorada(client, criar_manga, auth):
    manga = criar_manga(titulo="Original", idioma_original="pt", traducoes={"pt": {"titulo": "Ignorado"}})
    assert client.get(f"/mangas/{manga['id']}/edicao", headers=auth).json()["traducoes"] == {}


def test_idioma_invalido_e_recusado(client, auth):
    for corpo in (
        {"titulo": "X", "idioma_original": "fr"},
        {"titulo": "X", "traducoes": {"fr": {"titulo": "Y"}}},
        {"titulo": "X", "traducoes": {"en": {"titulo": "Y", "extra": 1}}},
    ):
        assert client.post("/mangas/", json=corpo, headers=auth).status_code == 422, corpo


def test_excluir_manga_apaga_as_traducoes(client, auth, manga_espanhol):
    from app.database import SessionLocal
    from app.models.manga_traducao import MangaTraducao

    assert client.delete(f"/mangas/{manga_espanhol['id']}", headers=auth).status_code == 200
    with SessionLocal() as db:
        assert db.query(MangaTraducao).count() == 0


def test_funcoes_de_genero():
    assert traduzir_lista("  acción ,Ciencia Ficción", "pt") == "Ação, Ficção científica"
    assert traduzir_lista(None, "en") is None
    assert "Acción" in nomes_equivalentes("Action")
    assert nomes_equivalentes("Desconhecido") == ["Desconhecido"]


def test_banco_antigo_ganha_a_coluna_idioma_original():
    from sqlalchemy import text

    from app.core.migracoes import aplicar_migracoes
    from app.database import Base, engine

    Base.metadata.drop_all(bind=engine)
    with engine.begin() as conexao:
        conexao.execute(text("CREATE TABLE mangas (id INTEGER PRIMARY KEY, titulo VARCHAR(255) NOT NULL)"))
        conexao.execute(text("INSERT INTO mangas (id, titulo) VALUES (1, 'Antiguo')"))
    aplicar_migracoes(engine)
    aplicar_migracoes(engine)  # rodar de novo não faz nada
    with engine.connect() as conexao:
        assert conexao.execute(text("SELECT idioma_original FROM mangas")).scalar() == "es"
    with engine.begin() as conexao:
        conexao.execute(text("DROP TABLE mangas"))


def test_banco_antigo_ganha_as_colunas_do_credito():
    from sqlalchemy import inspect, text

    from app.core.migracoes import aplicar_migracoes
    from app.database import Base, engine

    Base.metadata.drop_all(bind=engine)
    with engine.begin() as conexao:
        conexao.execute(text("CREATE TABLE mangas (id INTEGER PRIMARY KEY, titulo VARCHAR(255) NOT NULL)"))
        conexao.execute(text("CREATE TABLE capitulos (id INTEGER PRIMARY KEY, numero INTEGER NOT NULL)"))
    aplicar_migracoes(engine)
    aplicar_migracoes(engine)
    colunas = {c["name"] for c in inspect(engine).get_columns("capitulos")}
    assert {"traducao_por", "traducao_url"} <= colunas
    with engine.begin() as conexao:
        conexao.execute(text("DROP TABLE capitulos"))
        conexao.execute(text("DROP TABLE mangas"))
