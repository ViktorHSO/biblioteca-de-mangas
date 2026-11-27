from datetime import date
from typing import Annotated

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.schemas.comum import DataHoraUTC, UrlImagem, UrlImagemObrigatoria, texto_opcional

MAXIMO_PAGINAS_POR_CAPITULO = 300

ListaPaginas = Annotated[list[UrlImagemObrigatoria], Field(max_length=MAXIMO_PAGINAS_POR_CAPITULO)]


class CapituloBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    numero: int = Field(gt=0, le=100_000)
    titulo: texto_opcional(255) = None
    data_lancamento: date | None = None
    traducao_por: texto_opcional(100) = Field(
        default=None, description="Quem traduziu o capítulo (ex.: o nome do grupo de scanlation)"
    )
    traducao_url: UrlImagem = Field(default=None, description="Link do site de quem traduziu (http ou https)")


class CapituloCreate(CapituloBase):
    manga_id: int = Field(gt=0)
    paginas: ListaPaginas = Field(
        default_factory=list, description="URLs das páginas, na ordem de leitura (opcional)"
    )


class CapituloUpdate(CapituloBase):
    paginas: ListaPaginas | None = Field(
        default=None, description="Se enviada, substitui todas as páginas; se omitida, mantém as atuais"
    )


class PaginasUpdate(BaseModel):
    """Lista completa de URLs das páginas, na ordem de leitura. Substitui as atuais."""

    model_config = ConfigDict(extra="forbid")

    urls: list[UrlImagemObrigatoria] = Field(min_length=1, max_length=MAXIMO_PAGINAS_POR_CAPITULO)


class PaginaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ordem: int
    imagem_url: str


class MangaResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str = Field(validation_alias=AliasChoices("titulo_traduzido", "titulo"))
    capa_url: str | None = None
    tipo: str
    status: str | None = None


class CapituloResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    titulo: str | None = None
    data_lancamento: date | None = None
    traducao_por: str | None = None
    traducao_url: str | None = None
    visualizacoes: int
    criado_em: DataHoraUTC


class CapituloResponse(CapituloResumo):
    manga_id: int


class CapituloRecente(CapituloResponse):
    manga: MangaResumo


class CapituloRecentePaginado(BaseModel):
    total: int
    itens: list[CapituloRecente]


class CapituloLeitura(CapituloResponse):
    """Tudo que o leitor precisa: páginas, dados do mangá e navegação."""

    manga: MangaResumo
    paginas: list[PaginaResponse]
    anterior_id: int | None = None
    proximo_id: int | None = None
