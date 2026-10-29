"""Configurações da aplicação, lidas das variáveis de ambiente (arquivo .env).

Nenhum segredo fica no código: se uma variável obrigatória estiver faltando ou
insegura, a API se recusa a iniciar e mostra o motivo.
"""
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

TAMANHO_MINIMO_CHAVE = 32


def _obrigatoria(nome: str) -> str:
    valor = os.getenv(nome, "").strip()
    if not valor:
        raise RuntimeError(
            f"A variável de ambiente {nome} não foi definida. "
            "Confira o arquivo backend/.env (use o .env.example como modelo)."
        )
    return valor


def _lista(nome: str, padrao: str) -> list[str]:
    bruto = os.getenv(nome, padrao)
    return [item.strip() for item in bruto.split(",") if item.strip()]


@dataclass(frozen=True)
class Configuracoes:
    database_url: str
    secret_key: str
    algoritmo_jwt: str
    expiracao_token_minutos: int
    cors_origins: list[str]
    rate_limit_ativo: bool


def carregar_configuracoes() -> Configuracoes:
    secret_key = _obrigatoria("SECRET_KEY")
    if len(secret_key) < TAMANHO_MINIMO_CHAVE or secret_key.startswith("troque"):
        raise RuntimeError(
            "SECRET_KEY insegura. Gere uma chave nova com: "
            'python -c "import secrets; print(secrets.token_urlsafe(64))"'
        )

    origens = _lista("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    if "*" in origens:
        raise RuntimeError("CORS_ORIGINS não pode conter '*'. Liste as origens permitidas.")

    return Configuracoes(
        database_url=_obrigatoria("DATABASE_URL"),
        secret_key=secret_key,
        algoritmo_jwt="HS256",
        expiracao_token_minutos=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
        cors_origins=origens,
        rate_limit_ativo=os.getenv("RATE_LIMIT_ATIVO", "true").lower() != "false",
    )


configuracoes = carregar_configuracoes()
