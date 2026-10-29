# Importar todos os modelos aqui garante que o SQLAlchemy conheça todas as tabelas
# (e os relacionamentos entre elas) antes de criar ou consultar o banco.
from app.models.capitulo import Capitulo
from app.models.manga import Manga
from app.models.pagina import Pagina
from app.models.usuario import Usuario

__all__ = ["Capitulo", "Manga", "Pagina", "Usuario"]
