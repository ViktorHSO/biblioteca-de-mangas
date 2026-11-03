import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app import models  # noqa: F401  (registra todas as tabelas no SQLAlchemy)
from app.core import capas
from app.core.config import configuracoes
from app.core.limitador import limitador
from app.database import Base, engine
from app.routers import auth as auth_router
from app.routers import capitulo as capitulo_router
from app.routers import manga as manga_router

logger = logging.getLogger("biblioteca_mangas")

CABECALHOS_SEGURANCA = {
    "X-Content-Type-Options": "nosniff",  # navegador não "adivinha" o tipo do conteúdo
    "X-Frame-Options": "DENY",  # impede a API de ser carregada dentro de um iframe (clickjacking)
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Cria as tabelas que ainda não existem. Colunas novas em tabelas antigas
    # precisam das migrações em backend/migrations/.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Biblioteca de Mangás",
    description="API para catalogar mangás, capítulos e páginas. "
    "Leitura pública; criação, edição e exclusão exigem login de administrador.",
    version="1.1.0",
    lifespan=lifespan,
)

app.state.limiter = limitador
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configuracoes.cors_origins,
    allow_credentials=False,  # usamos token no cabeçalho, não cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def limitar_tamanho_do_envio(request: Request, call_next):
    # O corpo de um upload é lido antes de checar o login; por isso o tamanho é
    # conferido aqui, pelo cabeçalho, antes de qualquer byte ser recebido.
    if request.method == "POST" and request.url.path.endswith("/capa"):
        tamanho = request.headers.get("content-length")
        if tamanho is None or not tamanho.isdigit():
            return JSONResponse(status_code=411, content={"detail": "Envio sem tamanho declarado."})
        if int(tamanho) > capas.TAMANHO_MAXIMO_BYTES + 64 * 1024:  # folga para os campos do formulário
            return JSONResponse(status_code=413, content={"detail": "A imagem pode ter no máximo 5 MB."})
    return await call_next(request)


@app.middleware("http")
async def adicionar_cabecalhos_seguranca(request: Request, call_next):
    resposta = await call_next(request)
    for nome, valor in CABECALHOS_SEGURANCA.items():
        resposta.headers.setdefault(nome, valor)
    return resposta


@app.exception_handler(Exception)
async def erro_inesperado(request: Request, exc: Exception):
    # O detalhe do erro vai só para o log do servidor; o cliente recebe uma
    # mensagem genérica, sem stack trace nem informações do banco.
    logger.exception("Erro inesperado em %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor."})


app.include_router(auth_router.router)
app.include_router(manga_router.router)
app.include_router(capitulo_router.router)

# Capas enviadas pelo computador. A pasta é criada se ainda não existir.
capas.PASTA_CAPAS.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=configuracoes.uploads_dir), name="uploads")


@app.get("/", tags=["Status"])
def read_root():
    return {"mensagem": "API da Biblioteca de Mangás no ar! 📚"}
