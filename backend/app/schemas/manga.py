from typing import Annotated

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, StringConstraints

from app.core.idiomas import Idioma

from app.schemas.capitulo import CapituloResumo
from app.schemas.comum import DataHoraUTC, StatusLeitura, TipoObra, UrlCapa, texto_opcional

Titulo = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class TraducaoManga(BaseModel):
    """Título e sinopse em um dos outros idiomas. Campos vazios usam o texto original."""

    model_config = ConfigDict(extra="forbid")

    titulo: texto_opcional(255) = None
    sinopse: texto_opcional(5000) = None


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
    capa_url: UrlCapa = None
    destaque: bool = False
    idioma_original: Idioma = Field(
        default="pt", description="Idioma em que título e sinopse foram escritos (pt, en ou es)"
    )
    traducoes: dict[Idioma, TraducaoManga] | None = Field(
        default=None,
        description='Versões nos outros idiomas. Ex.: {"en": {"titulo": "...", "sinopse": "..."}}. '
        "Na edição, se omitido, mantém as traduções atuais.",
    )


class MangaResponse(BaseModel):
    """Mangá com título, sinopse e gêneros no idioma pedido (cabeçalho Accept-Language).

    Sem tradução para o idioma pedido, vem o texto original.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str = Field(validation_alias=AliasChoices("titulo_traduzido", "titulo"))
    titulo_original: str
    idioma_original: str = "pt"
    autor: str | None = None
    genero: str | None = Field(default=None, validation_alias=AliasChoices("genero_traduzido", "genero"))
    sinopse: str | None = Field(default=None, validation_alias=AliasChoices("sinopse_traduzida", "sinopse"))
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


class MangaAtualizado(MangaResponse):
    """Mangá com os capítulos mais recentes, para a seção "Novos capítulos"."""

    ultimos_capitulos: list[CapituloResumo]


class MangaRanking(MangaResponse):
    posicao: int


class Visualizacoes(BaseModel):
    visualizacoes: int


class MangaEdicao(BaseModel):
    """Dados do mangá do jeito que foram cadastrados, para o formulário de edição."""

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
    idioma_original: str
    traducoes: dict[str, TraducaoManga]
