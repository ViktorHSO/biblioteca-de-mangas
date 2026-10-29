from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from app.database import Base


class Usuario(Base):
    """Administrador da biblioteca. A senha nunca é guardada, só o hash bcrypt."""

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(50), nullable=False, unique=True, index=True)
    senha_hash = Column(String(255), nullable=False)
    ativo = Column(Boolean, nullable=False, default=True, server_default="1")
    criado_em = Column(DateTime, nullable=False, server_default=func.now())
