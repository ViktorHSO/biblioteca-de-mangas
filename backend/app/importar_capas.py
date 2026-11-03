"""Usa as imagens de uma pasta como capa dos mangás com o mesmo nome.

Uso, dentro da pasta backend com o venv ativado:
    python -m app.importar_capas "C:\\Users\\voce\\Downloads\\imagens-manga"

O nome do arquivo (sem a extensão) é comparado com o título do mangá ignorando
maiúsculas, acentos e espaços repetidos: "el sentido absoluto de la espada.webp"
vira a capa de "El Sentido Absoluto de la Espada". Arquivos sem mangá
correspondente são apenas listados.
"""
import sys
import unicodedata
from pathlib import Path

from app import models  # noqa: F401
from app.core.capas import CapaInvalida, salvar_capa
from app.crud.manga import trocar_capa
from app.database import SessionLocal
from app.models.manga import Manga

EXTENSOES = {".jpg", ".jpeg", ".png", ".webp"}


def normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return " ".join(sem_acento.casefold().split())


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    pasta = Path(sys.argv[1])
    if not pasta.is_dir():
        print(f"Pasta não encontrada: {pasta}")
        return 1

    imagens = sorted(p for p in pasta.iterdir() if p.suffix.lower() in EXTENSOES)
    if not imagens:
        print("Nenhuma imagem JPG, PNG ou WEBP na pasta.")
        return 1

    with SessionLocal() as db:
        por_titulo = {normalizar(m.titulo): m for m in db.query(Manga).all()}
        atualizados = 0
        for imagem in imagens:
            manga = por_titulo.get(normalizar(imagem.stem))
            if manga is None:
                print(f"  sem mangá com esse nome: {imagem.name}")
                continue
            try:
                trocar_capa(db, manga, salvar_capa(imagem.read_bytes()))
            except CapaInvalida as erro:
                print(f"  ignorada ({erro}): {imagem.name}")
                continue
            atualizados += 1
            print(f"  capa atualizada: {manga.titulo}")

    print(f"{atualizados} de {len(imagens)} imagens usadas como capa.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
