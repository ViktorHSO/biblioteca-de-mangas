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


# Colunas opcionais novas: (tabela, coluna, definição SQL). Só são criadas se não existirem.
COLUNAS_NOVAS = [
    ("capitulos", "traducao_por", "VARCHAR(100) NULL"),
    ("capitulos", "traducao_url", "VARCHAR(500) NULL"),
]


def aplicar_migracoes(engine: Engine) -> None:
    inspetor = inspect(engine)
    colunas = {coluna["name"] for coluna in inspetor.get_columns("mangas")}
    for tabela, coluna, definicao in COLUNAS_NOVAS:
        if not inspetor.has_table(tabela):
            continue  # tabela nova: o create_all já a cria com todas as colunas
        if coluna not in {c["name"] for c in inspetor.get_columns(tabela)}:
            with engine.begin() as conexao:
                conexao.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}"))
            logger.info("Coluna %s.%s criada.", tabela, coluna)

    if "idioma_original" not in colunas:
        with engine.begin() as conexao:
            conexao.execute(
                text("ALTER TABLE mangas ADD COLUMN idioma_original VARCHAR(5) NOT NULL DEFAULT 'pt'")
            )
            # Os mangás cadastrados antes das traduções foram escritos em espanhol.
            conexao.execute(text("UPDATE mangas SET idioma_original = 'es'"))
        logger.info("Coluna mangas.idioma_original criada (mangás existentes marcados como espanhol).")
