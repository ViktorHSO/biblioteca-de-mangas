"""Servidor MCP da API (https://modelcontextprotocol.io), montado em /mcp.

Transforma algumas rotas da API em ferramentas que um assistente de IA compatível
com MCP pode chamar: consultar o catálogo e cadastrar ou editar mangás e capítulos.

- Só liga se a variável MCP_API_KEY estiver definida.
- Toda conexão precisa do cabeçalho `Authorization: Bearer <MCP_API_KEY>`. O cabeçalho
  é repassado em cada chamada de ferramenta, e as rotas de escrita continuam protegidas
  pelo `exigir_admin`, que aceita essa chave.
- Ficam de fora o login, as exclusões, os envios de arquivo e os contadores de visualização.
  Capas e páginas entram por link.

Os nomes das ferramentas são os `operation_id` das rotas, e as descrições vêm das docstrings.
"""
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi_mcp import AuthConfig, FastApiMCP

from app.core.config import configuracoes
from app.core.dependencias import eh_chave_mcp, esquema_bearer

FERRAMENTAS = [
    # consulta
    "listar_mangas",
    "buscar_manga",
    "dados_do_manga_para_edicao",
    "listar_generos",
    "listar_capitulos_do_manga",
    "buscar_capitulo",
    # cadastro e edição
    "criar_manga",
    "atualizar_manga",
    "criar_capitulo",
    "atualizar_capitulo",
    "definir_paginas_do_capitulo",
]


def exigir_chave_mcp(credenciais: HTTPAuthorizationCredentials | None = Depends(esquema_bearer)) -> None:
    if credenciais is None or not eh_chave_mcp(credenciais.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave do MCP ausente ou inválida.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def montar_mcp(app: FastAPI) -> FastApiMCP | None:
    """Monta o MCP em /mcp. Precisa ser chamada depois de incluir todas as rotas."""
    if not configuracoes.mcp_api_key:
        return None
    mcp = FastApiMCP(
        app,
        name="Biblioteca de Mangás",
        # O fastapi-mcp 0.4 repassa a "description" ao MCP como versão do servidor.
        description=app.version,
        include_operations=FERRAMENTAS,
        auth_config=AuthConfig(dependencies=[Depends(exigir_chave_mcp)]),
    )
    mcp.mount_http(mount_path="/mcp")
    return mcp


async def encerrar_mcp(mcp: FastApiMCP | None) -> None:
    """Para as sessões do MCP quando a API desliga.

    O fastapi-mcp inicia o gerenciador de sessões na primeira conexão e não o encerra
    sozinho; sem isso, ele fica preso ao event loop antigo (ex.: entre um teste e outro).
    """
    transporte = getattr(mcp, "_http_transport", None)
    if transporte is not None:
        await transporte.shutdown()
