import { useCallback, useEffect, useMemo, useState } from "react";
import { buscarUsuarioLogado, login as loginApi } from "../api/auth";
import { definirToken, quandoSessaoExpirar } from "../api/client";
import { AuthContext } from "./contexto";

const CHAVE_TOKEN = "biblioteca:token";

// sessionStorage: o login dura só enquanto a aba estiver aberta.
// O try/catch cobre navegadores que bloqueiam o armazenamento (ex.: modo privado).
function lerTokenSalvo() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

function salvarToken(token) {
  try {
    if (token) sessionStorage.setItem(CHAVE_TOKEN, token);
    else sessionStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // sem armazenamento disponível: o login vale só até recarregar a página
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(() => Boolean(lerTokenSalvo()));

  const logout = useCallback(() => {
    definirToken(null);
    salvarToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    quandoSessaoExpirar(logout);

    const token = lerTokenSalvo();
    if (!token) return;

    definirToken(token);
    buscarUsuarioLogado()
      .then(setUsuario)
      .catch(logout)
      .finally(() => setCarregando(false));
  }, [logout]);

  const login = useCallback(async (nomeUsuario, senha) => {
    const { access_token: token } = await loginApi(nomeUsuario, senha);
    definirToken(token);
    salvarToken(token);
    setUsuario(await buscarUsuarioLogado());
  }, []);

  const valor = useMemo(
    () => ({ usuario, logado: Boolean(usuario), carregando, login, logout }),
    [usuario, carregando, login, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
