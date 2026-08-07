from sqlalchemy import Column, Integer, String, Text
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

    capitulos = relationship("Capitulo", back_populates="manga", cascade="all, delete-orphan")