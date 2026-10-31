import api from "./client";

export async function buscarCapitulo(id) {
  const { data } = await api.get(`/capitulos/${id}`);
  return data;
}

export async function criarCapitulo(dados) {
  const { data } = await api.post("/capitulos/", dados);
  return data;
}

export async function atualizarCapitulo(id, dados) {
  const { data } = await api.put(`/capitulos/${id}`, dados);
  return data;
}

export async function excluirCapitulo(id) {
  await api.delete(`/capitulos/${id}`);
}

export async function registrarLeitura(id) {
  await api.post(`/capitulos/${id}/visualizar`);
}
