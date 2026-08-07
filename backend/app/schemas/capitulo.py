from pydantic import BaseModel
from typing import Optional
from datetime import date


class CapituloBase(BaseModel):
    numero: int
    titulo: Optional[str] = None
    data_lancamento: Optional[date] = None


class CapituloCreate(CapituloBase):
    manga_id: int


class CapituloResponse(CapituloBase):
    id: int
    manga_id: int

    class Config:
        from_attributes = True