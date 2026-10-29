"""Hash de senhas (bcrypt) e criação/validação de tokens JWT."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import configuracoes

LIMITE_BYTES_BCRYPT = 72  # o bcrypt só considera os primeiros 72 bytes da senha

# Hash usado quando o usuário não existe, para que o tempo de resposta do login
# seja parecido nos dois casos (evita descobrir usuários válidos pelo tempo).
_HASH_FALSO = bcrypt.hashpw(b"senha-que-nunca-sera-usada", bcrypt.gensalt())


def senha_cabe_no_bcrypt(senha: str) -> bool:
    return len(senha.encode("utf-8")) <= LIMITE_BYTES_BCRYPT


def gerar_hash_senha(senha: str) -> str:
    if not senha_cabe_no_bcrypt(senha):
        raise ValueError("A senha pode ter no máximo 72 bytes.")
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str | None) -> bool:
    if not senha_cabe_no_bcrypt(senha):
        return False
    alvo = senha_hash.encode("utf-8") if senha_hash else _HASH_FALSO
    valida = bcrypt.checkpw(senha.encode("utf-8"), alvo)
    return valida and senha_hash is not None


def criar_token_acesso(usuario_id: int) -> tuple[str, int]:
    """Retorna o token e o tempo de expiração em segundos."""
    expira_em = timedelta(minutes=configuracoes.expiracao_token_minutos)
    agora = datetime.now(timezone.utc)
    dados = {"sub": str(usuario_id), "iat": agora, "exp": agora + expira_em, "tipo": "acesso"}
    token = jwt.encode(dados, configuracoes.secret_key, algorithm=configuracoes.algoritmo_jwt)
    return token, int(expira_em.total_seconds())


def ler_token_acesso(token: str) -> int | None:
    """Devolve o id do usuário se o token for válido; None caso contrário."""
    try:
        dados = jwt.decode(
            token,
            configuracoes.secret_key,
            algorithms=[configuracoes.algoritmo_jwt],  # lista fixa: impede o ataque "alg=none"
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        return None
    if dados.get("tipo") != "acesso":
        return None
    try:
        return int(dados["sub"])
    except (TypeError, ValueError):
        return None
