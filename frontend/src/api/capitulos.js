import api from "./client";

export async function listarLancamentos({ skip = 0, limit = 30 } = {}) {
  const { data } = await api.get("/capitulos/recentes", { params: { skip, limit } });
  return data;
}

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

// A API aceita até 30 imagens e 50 MB por envio; capítulos maiores vão em lotes.
const MAXIMO_POR_LOTE = 30;
const TAMANHO_POR_LOTE = 45 * 1024 * 1024;

function dividirEmLotes(arquivos) {
  const lotes = [];
  let atual = [];
  let tamanho = 0;
  for (const arquivo of arquivos) {
    if (atual.length && (atual.length === MAXIMO_POR_LOTE || tamanho + arquivo.size > TAMANHO_POR_LOTE)) {
      lotes.push(atual);
      atual = [];
      tamanho = 0;
    }
    atual.push(arquivo);
    tamanho += arquivo.size;
  }
  if (atual.length) lotes.push(atual);
  return lotes;
}

// Envia as imagens na ordem recebida; cada lote entra no fim do capítulo.
export async function enviarPaginas(id, arquivos, aoProgredir = () => {}) {
  let enviadas = 0;
  for (const lote of dividirEmLotes(arquivos)) {
    const formulario = new FormData();
    lote.forEach((arquivo) => formulario.append("arquivos", arquivo));
    await api.post(`/capitulos/${id}/paginas/arquivos`, formulario);
    enviadas += lote.length;
    aoProgredir(enviadas, arquivos.length);
  }
}

export async function excluirCapitulo(id) {
  await api.delete(`/capitulos/${id}`);
}

export async function registrarLeitura(id) {
  await api.post(`/capitulos/${id}/visualizar`);
}
