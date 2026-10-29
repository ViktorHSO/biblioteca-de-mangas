from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.seguranca import ler_token_acesso
from app.database import get_db
from app.models.usuario import Usuario

esquema_bearer = HTTPBearer(auto_error=False, description="Token obtido em POST /auth/login")

_ERRO_NAO_AUTENTICADO = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Não autenticado ou sessão expirada.",
    headers={"WWW-Authenticate": "Bearer"},
)


def exigir_admin(
    credenciais: HTTPAuthorizationCredentials | None = Depends(esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Dependência usada em todas as rotas que alteram dados."""
    if credenciais is None or credenciais.scheme.lower() != "bearer":
        raise _ERRO_NAO_AUTENTICADO

    usuario_id = ler_token_acesso(credenciais.credentials)
    if usuario_id is None:
        raise _ERRO_NAO_AUTENTICADO

    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.ativo:
        raise _ERRO_NAO_AUTENTICADO
    return usuario
