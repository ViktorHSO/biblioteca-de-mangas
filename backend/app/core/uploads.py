"""Armazenamento das imagens enviadas pelo site (capas e páginas de capítulos).

Os arquivos ficam em UPLOADS_DIR/<pasta> com um nome aleatório gerado pela API
(o nome original nunca é usado no disco) e o banco guarda só o caminho relativo,
por exemplo "/uploads/capas/3f2a...c1.webp". A API serve essa pasta em /uploads.
"""
import re
import secrets
from dataclasses import dataclass
from pathlib import Path

from app.core.config import configuracoes

MB = 1024 * 1024
PASTA_UPLOADS = Path(configuracoes.uploads_dir)

# O tipo é descoberto pelos primeiros bytes do arquivo, não pela extensão nem pelo
# Content-Type enviado (os dois podem ser falsificados). SVG fica de fora: pode conter script.
_ASSINATURAS = (
    (b"\xff\xd8\xff", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
)

# Formato exato dos caminhos que a própria API gera.
CAMINHO_GERADO = re.compile(r"^/uploads/(capas|paginas)/[0-9a-f]{32}\.(jpg|png|webp)$")


@dataclass(frozen=True)
class TipoDeImagem:
    pasta: str
    tamanho_maximo: int

    @property
    def diretorio(self) -> Path:
        return PASTA_UPLOADS / self.pasta

    @property
    def prefixo(self) -> str:
        return f"/uploads/{self.pasta}/"


CAPA = TipoDeImagem("capas", 5 * MB)
PAGINA = TipoDeImagem("paginas", 10 * MB)

# Páginas chegam em lotes: o site divide capítulos grandes em vários envios.
LIMITE_POR_ENVIO_DE_PAGINAS = 50 * MB
MAXIMO_ARQUIVOS_POR_ENVIO = 30


class ImagemInvalida(ValueError):
    """Arquivo recusado (tipo não aceito, vazio ou grande demais)."""


def detectar_extensao(conteudo: bytes) -> str | None:
    for assinatura, extensao in _ASSINATURAS:
        if conteudo.startswith(assinatura):
            return extensao
    if conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return "webp"
    return None


def validar_imagem(conteudo: bytes, tipo: TipoDeImagem) -> str:
    """Confere a imagem e devolve a extensão. Não grava nada."""
    if not conteudo:
        raise ImagemInvalida("O arquivo está vazio.")
    if len(conteudo) > tipo.tamanho_maximo:
        raise ImagemInvalida(f"A imagem pode ter no máximo {tipo.tamanho_maximo // MB} MB.")
    extensao = detectar_extensao(conteudo)
    if extensao is None:
        raise ImagemInvalida("Formato não aceito. Envie uma imagem JPG, PNG ou WEBP.")
    return extensao


def salvar_imagem(conteudo: bytes, tipo: TipoDeImagem) -> str:
    """Valida e grava a imagem. Devolve o caminho a ser guardado no banco."""
    extensao = validar_imagem(conteudo, tipo)
    tipo.diretorio.mkdir(parents=True, exist_ok=True)
    nome = f"{secrets.token_hex(16)}.{extensao}"
    (tipo.diretorio / nome).write_bytes(conteudo)
    return tipo.prefixo + nome


def eh_imagem_enviada(caminho: str | None) -> bool:
    return bool(caminho) and CAMINHO_GERADO.match(caminho) is not None


def remover_imagens(*caminhos: str | None) -> None:
    """Apaga os arquivos de imagens enviadas. URLs externas são ignoradas."""
    for caminho in caminhos:
        if eh_imagem_enviada(caminho):
            (PASTA_UPLOADS / caminho.removeprefix("/uploads/")).unlink(missing_ok=True)
