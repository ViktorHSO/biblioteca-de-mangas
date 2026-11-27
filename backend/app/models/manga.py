from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.generos import traduzir_lista
from app.core.idiomas import idioma_atual
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
    # Idioma em que titulo e sinopse foram cadastrados; as outras versões ficam em `traducoes`.
    idioma_original = Column(String(5), nullable=False, default="pt", server_default="pt")
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
    # selectin: as traduções de uma lista inteira de mangás vêm numa única consulta extra.
    traducoes = relationship(
        "MangaTraducao",
        back_populates="manga",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ----- Textos no idioma da requisição (usados pelos schemas de resposta) -----

    def _traducao(self):
        idioma = idioma_atual()
        if idioma == self.idioma_original:
            return None
        return next((t for t in self.traducoes if t.idioma == idioma), None)

    @property
    def titulo_traduzido(self) -> str:
        traducao = self._traducao()
        return (traducao and traducao.titulo) or self.titulo

    @property
    def sinopse_traduzida(self) -> str | None:
        traducao = self._traducao()
        return (traducao and traducao.sinopse) or self.sinopse

    @property
    def genero_traduzido(self) -> str | None:
        return traduzir_lista(self.genero, idioma_atual())

    @property
    def titulo_original(self) -> str:
        return self.titulo
