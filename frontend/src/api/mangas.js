import api from "./client";

export async function listarMangas({ skip = 0, limit = 20, ...filtros } = {}) {
  const params = { skip, limit };
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) params[chave] = valor;
  }
  const { data } = await api.get("/mangas/", { params });
  return data;
}

export async function buscarManga(id) {
  const { data } = await api.get(`/mangas/${id}`);
  return data;
}

export async function criarManga(dados) {
  const { data } = await api.post("/mangas/", dados);
  return data;
}

export async function atualizarManga(id, dados) {
  const { data } = await api.put(`/mangas/${id}`, dados);
  return data;
}

export async function excluirManga(id) {
  await api.delete(`/mangas/${id}`);
}

export async function registrarVisualizacao(id) {
  await api.post(`/mangas/${id}/visualizar`);
}
