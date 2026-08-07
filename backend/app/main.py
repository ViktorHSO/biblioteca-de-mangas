from fastapi import FastAPI
from app.database import Base, engine
from app.models import manga, capitulo
from app.routers import manga as manga_router
from app.routers import capitulo as capitulo_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Biblioteca de Mangás")

app.include_router(manga_router.router)
app.include_router(capitulo_router.router)


@app.get("/")
def read_root():
    return {"mensagem": "API da Biblioteca de Mangás no ar! 📚"}