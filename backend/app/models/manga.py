from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Manga(Base):
    __tablename__ = "mangas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    autor = Column(String(255))
    genero = Column(String(100))
    sinopse = Column(Text)
    status = Column(String(50), default="quero ler")
    capa_url = Column(String(500))
    tipo = Column(String(20), nullable=False, default="mangá", server_default="mangá")
    destaque = Column(Boolean, nullable=False, default=False, server_default="0")
    visualizacoes = Column(Integer, nullable=False, default=0, server_default="0")
    criado_em = Column(DateTime, nullable=False, server_default=func.now())
    atualizado_em = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    capitulos = relationship(
        "Capitulo",
        back_populates="manga",
        cascade="all, delete-orphan",
        order_by="desc(Capitulo.numero)",
    )
