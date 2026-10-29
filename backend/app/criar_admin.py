"""Cria (ou redefine a senha de) um administrador da biblioteca.

Uso, dentro da pasta backend com o venv ativado:
    python -m app.criar_admin

A senha é digitada sem aparecer na tela e só o hash bcrypt é salvo no banco.
"""
import getpass
import sys

from app import models  # noqa: F401
from app.core.seguranca import gerar_hash_senha, senha_cabe_no_bcrypt
from app.database import Base, SessionLocal, engine
from app.models.usuario import Usuario

TAMANHO_MINIMO_SENHA = 12


def pedir_senha() -> str:
    while True:
        senha = getpass.getpass(f"Senha (mínimo {TAMANHO_MINIMO_SENHA} caracteres): ")
        if len(senha) < TAMANHO_MINIMO_SENHA:
            print("Senha muito curta.")
            continue
        if not senha_cabe_no_bcrypt(senha):
            print("Senha muito longa (máximo 72 bytes).")
            continue
        if getpass.getpass("Repita a senha: ") != senha:
            print("As senhas não conferem.")
            continue
        return senha


def main() -> int:
    Base.metadata.create_all(bind=engine)
    nome = input("Nome de usuário do administrador: ").strip()
    if not 3 <= len(nome) <= 50:
        print("O nome de usuário deve ter entre 3 e 50 caracteres.")
        return 1

    with SessionLocal() as db:
        usuario = db.query(Usuario).filter(Usuario.usuario == nome).first()
        if usuario:
            resposta = input(f"O usuário '{nome}' já existe. Redefinir a senha? [s/N] ").strip().lower()
            if resposta != "s":
                print("Nada foi alterado.")
                return 0
            usuario.senha_hash = gerar_hash_senha(pedir_senha())
            usuario.ativo = True
            mensagem = "Senha redefinida."
        else:
            db.add(Usuario(usuario=nome, senha_hash=gerar_hash_senha(pedir_senha())))
            mensagem = f"Administrador '{nome}' criado."
        db.commit()

    print(mensagem)
    return 0


if __name__ == "__main__":
    sys.exit(main())
