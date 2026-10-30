from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import configuracoes

# SQLite (usado nos testes) precisa dessa opção para funcionar com o servidor da API.
argumentos_conexao = {"check_same_thread": False} if configuracoes.database_url.startswith("sqlite") else {}

engine = create_engine(
    configuracoes.database_url,
    pool_pre_ping=True,  # descarta conexões que o MySQL fechou por inatividade
    connect_args=argumentos_conexao,
)


# Todas as datas são gravadas em UTC (o SQLite já usa UTC; no MySQL o padrão seria o
# fuso do servidor). A API devolve as datas marcadas como UTC e o navegador converte
# para o horário de quem está acessando.
if engine.dialect.name == "mysql":

    @event.listens_for(engine, "connect")
    def usar_utc_no_mysql(conexao, _registro):
        with conexao.cursor() as cursor:
            cursor.execute("SET time_zone = '+00:00'")


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
