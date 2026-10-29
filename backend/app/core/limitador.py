"""Limite de requisições por IP (proteção contra força bruta e abuso)."""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import configuracoes

limitador = Limiter(key_func=get_remote_address, enabled=configuracoes.rate_limit_ativo)
