import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export async function listarMangas({ skip = 0, limit = 20, titulo, autor, genero, status } = {}) {
  const params = { skip, limit };
  if (titulo) params.titulo = titulo;
  if (autor) params.autor = autor;
  if (genero) params.genero = genero;
  if (status) params.status = status;

  const response = await api.get("/mangas/", { params });
  return response.data; // { total, itens }
}

export default api;

export async function criarManga(dados) {
  const response = await api.post("/mangas/", dados);
  return response.data;
}