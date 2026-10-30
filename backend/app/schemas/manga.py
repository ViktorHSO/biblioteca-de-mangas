from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.schemas.capitulo import CapituloResumo
from app.schemas.comum import DataHoraUTC, StatusLeitura, TipoObra, UrlImagem, texto_opcional

Titulo = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class MangaCreate(BaseModel):
    """Dados aceitos para criar ou atualizar um mangá. Campos extras são recusados."""

    model_config = ConfigDict(extra="forbid")

    titulo: Titulo
    autor: texto_opcional(255) = None
    genero: texto_opcional(100) = Field(
        default=None, description="Um ou mais gêneros separados por vírgula. Ex.: Ação, Aventura"
    )
    sinopse: texto_opcional(5000) = None
    status: StatusLeitura = "quero ler"
    tipo: TipoObra = "mangá"
    capa_url: UrlImagem = None
    destaque: bool = False


class MangaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    autor: str | None = None
    genero: str | None = None
    sinopse: str | None = None
    status: str | None = None
    tipo: str
    capa_url: str | None = None
    destaque: bool
    visualizacoes: int
    criado_em: DataHoraUTC
    atualizado_em: DataHoraUTC


class MangaDetalhe(MangaResponse):
    capitulos: list[CapituloResumo] = []


class MangaPaginado(BaseModel):
    total: int
    itens: list[MangaResponse]


class MangaRanking(MangaResponse):
    posicao: int


class Visualizacoes(BaseModel):
    visualizacoes: int
