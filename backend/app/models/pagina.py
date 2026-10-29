from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Pagina(Base):
    """Uma imagem de um capítulo, exibida no leitor na ordem do campo `ordem`."""

    __tablename__ = "paginas"
    __table_args__ = (UniqueConstraint("capitulo_id", "ordem", name="uq_pagina_capitulo_ordem"),)

    id = Column(Integer, primary_key=True, index=True)
    ordem = Column(Integer, nullable=False)
    imagem_url = Column(String(500), nullable=False)

    capitulo_id = Column(Integer, ForeignKey("capitulos.id", ondelete="CASCADE"), nullable=False, index=True)
    capitulo = relationship("Capitulo", back_populates="paginas")
