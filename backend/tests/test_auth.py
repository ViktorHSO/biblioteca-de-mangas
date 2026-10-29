from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import configuracoes
from tests.conftest import SENHA_ADMIN


def test_login_com_senha_correta_retorna_token(client, admin):
    resposta = client.post("/auth/login", json={"usuario": "admin", "senha": SENHA_ADMIN})
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["token_type"] == "bearer"
    assert corpo["expira_em"] > 0


def test_login_com_senha_errada_ou_usuario_inexistente_tem_mesma_mensagem(client, admin):
    senha_errada = client.post("/auth/login", json={"usuario": "admin", "senha": "errada"})
    sem_usuario = client.post("/auth/login", json={"usuario": "ninguem", "senha": "errada"})
    assert senha_errada.status_code == sem_usuario.status_code == 401
    assert senha_errada.json() == sem_usuario.json()


def test_login_tem_limite_de_tentativas(client, admin):
    for _ in range(5):
        client.post("/auth/login", json={"usuario": "admin", "senha": "errada"})
    resposta = client.post("/auth/login", json={"usuario": "admin", "senha": SENHA_ADMIN})
    assert resposta.status_code == 429


def test_me_exige_token(client, auth):
    assert client.get("/auth/me").status_code == 401
    resposta = client.get("/auth/me", headers=auth)
    assert resposta.status_code == 200
    assert resposta.json()["usuario"] == "admin"
    assert "senha_hash" not in resposta.json()


def test_rotas_de_escrita_exigem_login(client):
    rotas = [
        ("post", "/mangas/", {"titulo": "X"}),
        ("put", "/mangas/1", {"titulo": "X"}),
        ("delete", "/mangas/1", None),
        ("post", "/capitulos/", {"manga_id": 1, "numero": 1}),
        ("put", "/capitulos/1", {"numero": 1}),
        ("put", "/capitulos/1/paginas", {"urls": ["https://exemplo.com/1.jpg"]}),
        ("delete", "/capitulos/1", None),
    ]
    for metodo, url, corpo in rotas:
        resposta = client.request(metodo, url, json=corpo)
        assert resposta.status_code == 401, f"{metodo.upper()} {url} deveria exigir login"


def test_token_invalido_e_recusado(client):
    cabecalho = {"Authorization": "Bearer token-inventado"}
    assert client.post("/mangas/", json={"titulo": "X"}, headers=cabecalho).status_code == 401


def test_token_expirado_e_recusado(client, admin):
    passado = datetime.now(timezone.utc) - timedelta(hours=2)
    token = jwt.encode(
        {"sub": str(admin), "iat": passado, "exp": passado + timedelta(minutes=1), "tipo": "acesso"},
        configuracoes.secret_key,
        algorithm="HS256",
    )
    resposta = client.post("/mangas/", json={"titulo": "X"}, headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 401


def test_token_assinado_com_outra_chave_e_recusado(client, admin):
    token = jwt.encode(
        {"sub": str(admin), "exp": datetime.now(timezone.utc) + timedelta(minutes=5), "tipo": "acesso"},
        "outra-chave-qualquer-" + "y" * 40,
        algorithm="HS256",
    )
    resposta = client.post("/mangas/", json={"titulo": "X"}, headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 401


def test_token_sem_assinatura_alg_none_e_recusado(client, admin):
    token = jwt.encode({"sub": str(admin), "tipo": "acesso"}, key=None, algorithm="none")
    resposta = client.post("/mangas/", json={"titulo": "X"}, headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 401


def test_senha_nunca_e_salva_em_texto_puro(admin):
    from app.database import SessionLocal
    from app.models.usuario import Usuario

    with SessionLocal() as db:
        usuario = db.get(Usuario, admin)
        assert usuario.senha_hash != SENHA_ADMIN
        assert usuario.senha_hash.startswith("$2")  # prefixo dos hashes bcrypt
