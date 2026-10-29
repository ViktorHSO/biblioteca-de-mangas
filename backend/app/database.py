from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import configuracoes

# SQLite (usado nos testes) precisa dessa opção para funcionar com o servidor da API.
argumentos_conexao = {"check_same_thread": False} if configuracoes.database_url.startswith("sqlite") else {}

engine = create_engine(
    configuracoes.database_url,
    pool_pre_ping=True,  # descarta conexões que o MySQL fechou por inatividade
    connect_args=argumentos_conexao,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
