"""Ajustes automáticos no banco feitos quando a API inicia.

O `create_all` cria tabelas novas (como manga_traducoes), mas não adiciona colunas
em tabelas que já existem. Aqui ficam as colunas novas simples, para um banco
antigo (local, Docker ou o do deploy) ser atualizado sem rodar SQL à mão.
Os scripts em backend/migrations/ fazem o mesmo, para quem preferir manualmente.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("biblioteca_mangas")


def aplicar_migracoes(engine: Engine) -> None:
    colunas = {coluna["name"] for coluna in inspect(engine).get_columns("mangas")}
    if "idioma_original" not in colunas:
        with engine.begin() as conexao:
            conexao.execute(
                text("ALTER TABLE mangas ADD COLUMN idioma_original VARCHAR(5) NOT NULL DEFAULT 'pt'")
            )
            # Os mangás cadastrados antes das traduções foram escritos em espanhol.
            conexao.execute(text("UPDATE mangas SET idioma_original = 'es'"))
        logger.info("Coluna mangas.idioma_original criada (mangás existentes marcados como espanhol).")
