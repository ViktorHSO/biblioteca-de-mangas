from pydantic import BaseModel
from typing import Optional


class MangaBase(BaseModel):
    titulo: str
    autor: Optional[str] = None
    genero: Optional[str] = None
    sinopse: Optional[str] = None
    status: Optional[str] = "quero ler"
    capa_url: Optional[str] = None


class MangaCreate(MangaBase):
    pass


class MangaResponse(MangaBase):
    id: int

    class Config:
        from_attributes = True

class MangaPaginado(BaseModel):
    total: int
    itens: list[MangaResponse]