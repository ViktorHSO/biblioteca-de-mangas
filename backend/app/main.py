from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import manga, capitulo
from app.routers import manga as manga_router
from app.routers import capitulo as capitulo_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Biblioteca de Mangás")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(manga_router.router)
app.include_router(capitulo_router.router)


@app.get("/")
def read_root():
    return {"mensagem": "API da Biblioteca de Mangás no ar! 📚"}