def padrao_like(texto: str) -> str:
    """Monta o padrão de busca "contém" escapando os curingas do SQL.

    Sem isso, buscar por "%" ou "_" retornaria todos os registros.
    Usar junto com `.ilike(padrao, escape="\\\\")`.
    """
    escapado = texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escapado}%"
