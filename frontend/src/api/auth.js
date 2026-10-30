import api from "./client";

export async function login(usuario, senha) {
  const { data } = await api.post("/auth/login", { usuario, senha });
  return data;
}

export async function buscarUsuarioLogado() {
  const { data } = await api.get("/auth/me");
  return data;
}
