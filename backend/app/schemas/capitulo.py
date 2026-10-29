from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.comum import UrlImagemObrigatoria, texto_opcional

MAXIMO_PAGINAS_POR_CAPITULO = 300


class CapituloBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    numero: int = Field(gt=0, le=100_000)
    titulo: texto_opcional(255) = None
    data_lancamento: date | None = None


class CapituloCreate(CapituloBase):
    manga_id: int = Field(gt=0)


class CapituloUpdate(CapituloBase):
    pass


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
    titulo: str
    capa_url: str | None = None
    tipo: str
    status: str | None = None


class CapituloResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    titulo: str | None = None
    data_lancamento: date | None = None
    visualizacoes: int
    criado_em: datetime


class CapituloResponse(CapituloResumo):
    manga_id: int


class CapituloRecente(CapituloResponse):
    manga: MangaResumo


class CapituloLeitura(CapituloResponse):
    """Tudo que o leitor precisa: páginas, dados do mangá e navegação."""

    manga: MangaResumo
    paginas: list[PaginaResponse]
    anterior_id: int | None = None
    proximo_id: int | None = None
