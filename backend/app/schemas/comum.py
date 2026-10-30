"""Tipos reutilizados pelos schemas, com as regras de validação em um só lugar."""
from datetime import datetime, timezone
from typing import Annotated, Literal
from urllib.parse import urlparse

from pydantic import AfterValidator, BeforeValidator, Field

StatusLeitura = Literal["quero ler", "lendo", "concluído"]
TipoObra = Literal["mangá", "manhwa", "manhua", "novel"]

TAMANHO_MAXIMO_URL = 500


def _vazio_para_none(valor):
    """Campos opcionais enviados como "" pelo formulário viram None."""
    if isinstance(valor, str):
        valor = valor.strip()
        return valor or None
    return valor


def _validar_url(valor: str | None) -> str | None:
    """Aceita apenas URLs http/https com domínio.

    Bloqueia esquemas perigosos como `javascript:` e `data:`, que poderiam executar
    código no navegador de quem abrir a página (ataque XSS).
    """
    if valor is None:
        return None
    partes = urlparse(valor)
    if partes.scheme not in ("http", "https") or not partes.netloc:
        raise ValueError("A URL precisa começar com http:// ou https:// e ter um domínio válido.")
    if any(c.isspace() for c in valor):
        raise ValueError("A URL não pode conter espaços.")
    return valor


def _marcar_utc(valor: datetime) -> datetime:
    return valor.replace(tzinfo=timezone.utc) if valor.tzinfo is None else valor


# O banco guarda datas sem fuso (sempre em UTC). Marcar o fuso na resposta evita que
# o navegador interprete a data como horário local.
DataHoraUTC = Annotated[datetime, AfterValidator(_marcar_utc)]

UrlImagem = Annotated[
    Annotated[str, Field(max_length=TAMANHO_MAXIMO_URL)] | None,
    BeforeValidator(_vazio_para_none),
    AfterValidator(_validar_url),
]

UrlImagemObrigatoria = Annotated[
    str,
    BeforeValidator(lambda v: v.strip() if isinstance(v, str) else v),
    Field(min_length=1, max_length=TAMANHO_MAXIMO_URL),
    AfterValidator(_validar_url),
]


def texto_opcional(tamanho_maximo: int):
    return Annotated[
        Annotated[str, Field(max_length=tamanho_maximo)] | None,
        BeforeValidator(_vazio_para_none),
    ]
