from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Capitulo(Base):
    __tablename__ = "capitulos"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer, nullable=False)
    titulo = Column(String(255))
    data_lancamento = Column(Date, nullable=True)
    visualizacoes = Column(Integer, nullable=False, default=0, server_default="0")
    criado_em = Column(DateTime, nullable=False, server_default=func.now())

    manga_id = Column(Integer, ForeignKey("mangas.id"), nullable=False)
    manga = relationship("Manga", back_populates="capitulos")
    paginas = relationship(
        "Pagina",
        back_populates="capitulo",
        cascade="all, delete-orphan",
        order_by="Pagina.ordem",
    )
