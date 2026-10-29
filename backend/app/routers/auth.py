from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.dependencias import exigir_admin
from app.core.limitador import limitador
from app.core.seguranca import criar_token_acesso, verificar_senha
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
@limitador.limit("5/minute")
def login(request: Request, dados: LoginRequest, db: Session = Depends(get_db)):
    """Troca usuário e senha do administrador por um token de acesso (JWT).

    Limitado a 5 tentativas por minuto por IP, contra ataques de força bruta.
    """
    usuario = db.query(Usuario).filter(Usuario.usuario == dados.usuario).first()
    senha_hash = usuario.senha_hash if usuario and usuario.ativo else None

    # verificar_senha sempre roda o bcrypt, mesmo sem usuário, para o tempo de
    # resposta não revelar quais usuários existem.
    if not verificar_senha(dados.senha, senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token, expira_em = criar_token_acesso(usuario.id)
    return {"access_token": token, "token_type": "bearer", "expira_em": expira_em}


@router.get("/me", response_model=UsuarioResponse)
def usuario_logado(usuario: Usuario = Depends(exigir_admin)):
    return usuario
