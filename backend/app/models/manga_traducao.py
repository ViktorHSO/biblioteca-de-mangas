from sqlalchemy import Column, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class MangaTraducao(Base):
    """Título e sinopse de um mangá em outro idioma (pt, en ou es).

    Os campos principais do mangá guardam o texto no idioma original
    (`Manga.idioma_original`); aqui ficam só as versões nos outros idiomas.
    """

    __tablename__ = "manga_traducoes"
    __table_args__ = (UniqueConstraint("manga_id", "idioma", name="uq_traducao_manga_idioma"),)

    id = Column(Integer, primary_key=True, index=True)
    idioma = Column(String(5), nullable=False)
    titulo = Column(String(255))
    sinopse = Column(Text)

    manga_id = Column(Integer, ForeignKey("mangas.id", ondelete="CASCADE"), nullable=False, index=True)
    manga = relationship("Manga", back_populates="traducoes")
