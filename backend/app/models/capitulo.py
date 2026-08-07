from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base


class Capitulo(Base):
    __tablename__ = "capitulos"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer, nullable=False)
    titulo = Column(String(255))
    data_lancamento = Column(Date, nullable=True)

    manga_id = Column(Integer, ForeignKey("mangas.id"), nullable=False)
    manga = relationship("Manga", back_populates="capitulos")