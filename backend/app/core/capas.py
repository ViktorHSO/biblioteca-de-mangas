"""Armazenamento das capas enviadas do computador.

Os arquivos ficam em UPLOADS_DIR/capas com um nome aleatório gerado pela API
(o nome original nunca é usado no disco) e o banco guarda só o caminho relativo,
por exemplo "/uploads/capas/3f2a...c1.webp". A API serve essa pasta em /uploads.
"""
import re
import secrets
from pathlib import Path

from app.core.config import configuracoes

TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024  # 5 MB
PREFIXO_URL = "/uploads/capas/"
PASTA_CAPAS = Path(configuracoes.uploads_dir) / "capas"

# O tipo é descoberto pelos primeiros bytes do arquivo, não pela extensão nem pelo
# Content-Type enviado (os dois podem ser falsificados). SVG fica de fora: pode conter script.
_ASSINATURAS = (
    (b"\xff\xd8\xff", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
)

CAMINHO_VALIDO = re.compile(r"^/uploads/capas/[0-9a-f]{32}\.(jpg|png|webp)$")


class CapaInvalida(ValueError):
    """Arquivo recusado (tipo não aceito, vazio ou grande demais)."""


def detectar_extensao(conteudo: bytes) -> str | None:
    for assinatura, extensao in _ASSINATURAS:
        if conteudo.startswith(assinatura):
            return extensao
    if conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return "webp"
    return None


def salvar_capa(conteudo: bytes) -> str:
    """Valida e grava a imagem. Devolve o caminho a ser guardado em capa_url."""
    if not conteudo:
        raise CapaInvalida("O arquivo está vazio.")
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise CapaInvalida("A imagem pode ter no máximo 5 MB.")
    extensao = detectar_extensao(conteudo)
    if extensao is None:
        raise CapaInvalida("Formato não aceito. Envie uma imagem JPG, PNG ou WEBP.")

    PASTA_CAPAS.mkdir(parents=True, exist_ok=True)
    nome = f"{secrets.token_hex(16)}.{extensao}"
    (PASTA_CAPAS / nome).write_bytes(conteudo)
    return PREFIXO_URL + nome


def eh_capa_local(caminho: str | None) -> bool:
    return bool(caminho) and CAMINHO_VALIDO.match(caminho) is not None


def remover_capa_local(caminho: str | None) -> None:
    """Apaga o arquivo de uma capa enviada. URLs externas são ignoradas."""
    if not eh_capa_local(caminho):
        return
    (PASTA_CAPAS / caminho.removeprefix(PREFIXO_URL)).unlink(missing_ok=True)
