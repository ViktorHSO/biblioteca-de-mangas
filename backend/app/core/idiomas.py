"""Idiomas do site e o idioma da requisição atual.

O front-end manda o idioma escolhido no cabeçalho `Accept-Language` (ex.: "en").
Um middleware guarda esse idioma numa ContextVar, que vale só para a requisição
em andamento; os schemas a consultam para devolver título, sinopse e gêneros
já traduzidos, sem precisar passar o idioma de função em função.
"""
from contextvars import ContextVar
from typing import Literal

Idioma = Literal["pt", "en", "es"]
IDIOMAS: tuple[str, ...] = ("pt", "en", "es")
IDIOMA_PADRAO = "pt"

_idioma_atual: ContextVar[str] = ContextVar("idioma_atual", default=IDIOMA_PADRAO)


def idioma_do_cabecalho(valor: str | None) -> str:
    """Escolhe o primeiro idioma suportado do `Accept-Language`, respeitando o peso q.

    "en-US,en;q=0.9,pt;q=0.8" -> "en". Sem nenhum idioma conhecido -> português.
    """
    if not valor:
        return IDIOMA_PADRAO
    opcoes: list[tuple[float, int, str]] = []
    for posicao, parte in enumerate(valor.split(",")[:20]):
        codigo, _, parametros = parte.strip().partition(";")
        peso = 1.0
        parametros = parametros.strip()
        if parametros.startswith("q="):
            try:
                peso = float(parametros[2:])
            except ValueError:
                peso = 0.0
        idioma = codigo.strip().lower()[:2]
        if idioma in IDIOMAS and peso > 0:
            opcoes.append((-peso, posicao, idioma))
    return min(opcoes)[2] if opcoes else IDIOMA_PADRAO


def idioma_atual() -> str:
    return _idioma_atual.get()


def definir_idioma(idioma: str):
    """Define o idioma da requisição atual. Devolve o token para restaurar depois."""
    return _idioma_atual.set(idioma if idioma in IDIOMAS else IDIOMA_PADRAO)


def restaurar_idioma(token) -> None:
    _idioma_atual.reset(token)
