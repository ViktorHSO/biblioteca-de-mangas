"""Configuração dos testes: banco SQLite temporário e chave de teste.

As variáveis de ambiente são definidas ANTES de importar a aplicação, porque
app.core.config lê o ambiente no momento da importação.
"""
import os
import tempfile

_pasta_temporaria = tempfile.mkdtemp(prefix="biblioteca-testes-")
# TEST_DATABASE_URL permite rodar os testes num MySQL de teste (nunca use o banco real: as tabelas são recriadas).
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", f"sqlite:///{os.path.join(_pasta_temporaria, 'teste.db')}"
)
os.environ["SECRET_KEY"] = "chave-de-teste-" + "x" * 48
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.limitador import limitador  # noqa: E402
from app.core.seguranca import gerar_hash_senha  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402

SENHA_ADMIN = "senha-de-teste-bem-longa"


@pytest.fixture(autouse=True)
def banco_limpo():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    limitador.reset()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin():
    with SessionLocal() as db:
        usuario = Usuario(usuario="admin", senha_hash=gerar_hash_senha(SENHA_ADMIN))
        db.add(usuario)
        db.commit()
        return usuario.id


@pytest.fixture
def auth(client, admin):
    resposta = client.post("/auth/login", json={"usuario": "admin", "senha": SENHA_ADMIN})
    assert resposta.status_code == 200
    return {"Authorization": f"Bearer {resposta.json()['access_token']}"}


@pytest.fixture
def criar_manga(client, auth):
    def _criar(**dados):
        corpo = {"titulo": "Vagabond", "autor": "Takehiko Inoue", "genero": "Ação, Histórico"}
        corpo.update(dados)
        resposta = client.post("/mangas/", json=corpo, headers=auth)
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    return _criar


@pytest.fixture
def criar_capitulo(client, auth):
    def _criar(manga_id, numero, **dados):
        corpo = {"manga_id": manga_id, "numero": numero, **dados}
        resposta = client.post("/capitulos/", json=corpo, headers=auth)
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    return _criar
