"""Servidor MCP em /mcp: autenticação, ferramentas expostas e chamadas."""
import json
import os
from dataclasses import replace

import pytest
from fastapi import FastAPI

from app import mcp as modulo_mcp
from app.mcp import FERRAMENTAS

CHAVE = os.environ["MCP_API_KEY"]
CABECALHOS = {
    "Authorization": f"Bearer {CHAVE}",
    "Accept": "application/json, text/event-stream",
    "Content-Type": "application/json",
}


class ClienteMCP:
    """Cliente JSON-RPC mínimo do transporte HTTP do MCP, sobre o TestClient."""

    def __init__(self, client, cabecalhos=CABECALHOS):
        self.client = client
        self.cabecalhos = dict(cabecalhos)
        self.proximo_id = 0

    def enviar(self, metodo, parametros=None, notificacao=False):
        corpo = {"jsonrpc": "2.0", "method": metodo}
        if parametros is not None:
            corpo["params"] = parametros
        if not notificacao:
            self.proximo_id += 1
            corpo["id"] = self.proximo_id
        return self.client.post("/mcp", headers=self.cabecalhos, json=corpo)

    def iniciar(self):
        resposta = self.enviar(
            "initialize",
            {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "testes", "version": "1"}},
        )
        assert resposta.status_code == 200, resposta.text
        self.cabecalhos["mcp-session-id"] = resposta.headers["mcp-session-id"]
        self.enviar("notifications/initialized", notificacao=True)
        return resposta.json()["result"]

    def ferramentas(self):
        return {f["name"]: f for f in self.enviar("tools/list").json()["result"]["tools"]}

    def chamar(self, nome, **argumentos):
        resultado = self.enviar("tools/call", {"name": nome, "arguments": argumentos}).json()["result"]
        texto = resultado["content"][0]["text"]
        if resultado.get("isError"):
            return None, texto
        return json.loads(texto), None


@pytest.fixture
def mcp(client, admin):
    cliente = ClienteMCP(client)
    cliente.iniciar()
    return cliente


def test_conexao_exige_a_chave(client):
    for autorizacao in (None, "Bearer chave-errada", f"Basic {CHAVE}"):
        cabecalhos = {k: v for k, v in CABECALHOS.items() if k != "Authorization"}
        if autorizacao:
            cabecalhos["Authorization"] = autorizacao
        assert ClienteMCP(client, cabecalhos).enviar("initialize", {}).status_code == 401, autorizacao


def test_so_as_ferramentas_escolhidas(mcp):
    nomes = set(mcp.ferramentas())
    assert nomes == set(FERRAMENTAS)
    for perigosa in ("deletar_manga", "deletar_capitulo", "login", "enviar_capa", "enviar_paginas"):
        assert not any(perigosa in nome for nome in nomes)


def test_ferramentas_tem_descricao(mcp):
    ferramentas = mcp.ferramentas()
    assert "traducoes" in ferramentas["criar_manga"]["description"]
    assert "dados_do_manga_para_edicao" in ferramentas["atualizar_manga"]["description"]
    assert "idioma_original" in json.dumps(ferramentas["criar_manga"]["inputSchema"])


def test_cadastra_manga_e_capitulo_pelo_mcp(mcp, client):
    manga, erro = mcp.chamar(
        "criar_manga",
        titulo="Solo Leveling",
        genero="Acción, Fantasía",
        idioma_original="es",
        capa_url="https://biblioteca-de-mangas.onrender.com/capa-solo-leveling.webp",
        traducoes={"pt": {"titulo": "Nivelando Sozinho"}, "en": {"sinopse": "A weak hunter..."}},
    )
    assert erro is None, erro
    assert manga["titulo"] == "Nivelando Sozinho"  # o MCP consulta em português
    assert manga["genero"] == "Ação, Fantasia"

    capitulo, erro = mcp.chamar(
        "criar_capitulo",
        manga_id=manga["id"],
        numero=1,
        titulo="O caçador mais fraco",
        paginas=["https://exemplo.com/1.jpg", "https://exemplo.com/2.jpg"],
    )
    assert erro is None, erro
    leitura, _ = mcp.chamar("buscar_capitulo", capitulo_id=capitulo["id"])
    assert [p["imagem_url"] for p in leitura["paginas"]] == ["https://exemplo.com/1.jpg", "https://exemplo.com/2.jpg"]

    paginas, erro = mcp.chamar("definir_paginas_do_capitulo", capitulo_id=capitulo["id"], urls=["https://exemplo.com/3.jpg"])
    assert erro is None and len(paginas) == 1

    # O site mostra o que foi cadastrado pelo MCP.
    assert client.get(f"/mangas/{manga['id']}", headers={"Accept-Language": "en"}).json()["capitulos"][0]["numero"] == 1


def test_edicao_pelo_mcp_mantem_traducoes(mcp):
    manga, _ = mcp.chamar("criar_manga", titulo="Original", idioma_original="es", traducoes={"en": {"titulo": "English"}})
    dados, _ = mcp.chamar("dados_do_manga_para_edicao", manga_id=manga["id"])
    # Campos vazios são omitidos (o esquema das ferramentas não aceita null) e voltam a ser vazios.
    dados = {k: v for k, v in dados.items() if k not in ("id", "traducoes") and v is not None}
    _, erro = mcp.chamar("atualizar_manga", manga_id=manga["id"], **{**dados, "status": "concluído"})
    assert erro is None, erro
    final, _ = mcp.chamar("dados_do_manga_para_edicao", manga_id=manga["id"])
    assert final["status"] == "concluído"
    assert final["traducoes"]["en"]["titulo"] == "English"


def test_erros_da_api_voltam_para_o_assistente(mcp):
    _, erro = mcp.chamar("criar_manga", titulo="X", capa_url="javascript:alert(1)")
    assert erro and "422" in erro
    _, erro = mcp.chamar("criar_capitulo", manga_id=999, numero=1)
    assert erro and "404" in erro


def test_chave_do_mcp_tambem_vale_na_api(client, admin):
    resposta = client.post("/mangas/", json={"titulo": "Pela chave"}, headers={"Authorization": f"Bearer {CHAVE}"})
    assert resposta.status_code == 201


def test_chave_sem_nenhum_admin_cadastrado_e_recusada(client):
    resposta = client.post("/mangas/", json={"titulo": "X"}, headers={"Authorization": f"Bearer {CHAVE}"})
    assert resposta.status_code == 401


def test_sem_chave_configurada_o_mcp_fica_desligado(monkeypatch):
    monkeypatch.setattr(modulo_mcp, "configuracoes", replace(modulo_mcp.configuracoes, mcp_api_key=None))
    app = FastAPI()
    assert modulo_mcp.montar_mcp(app) is None
    assert not any(getattr(rota, "path", "") == "/mcp" for rota in app.routes)
