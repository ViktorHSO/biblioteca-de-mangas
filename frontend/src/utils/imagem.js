import { URL_DA_API } from "../api/client";
import { localeAtual, traduzir } from "../i18n/idioma";

const MB = 1024 * 1024;

export const TIPOS_DE_CAPA = ["image/jpeg", "image/png", "image/webp"];
export const TIPOS_DE_IMAGEM = TIPOS_DE_CAPA;
// Os mesmos limites da API.
export const TAMANHO_MAXIMO_CAPA = 5 * MB;
export const TAMANHO_MAXIMO_PAGINA = 10 * MB;

// Imagens enviadas do computador ficam na API e o banco guarda só o caminho
// ("/uploads/capas/..." ou "/uploads/paginas/..."). Para o navegador, o caminho
// vira um endereço completo.
export function ehImagemEnviada(caminho) {
  return typeof caminho === "string" && /^\/uploads\/(capas|paginas)\//.test(caminho);
}

export function ehCapaEnviada(caminho) {
  return typeof caminho === "string" && caminho.startsWith("/uploads/capas/");
}

export function urlDaImagem(caminho) {
  return ehImagemEnviada(caminho) ? `${URL_DA_API}${caminho}` : caminho;
}

export function problemaNoArquivo(arquivo, limite = TAMANHO_MAXIMO_CAPA) {
  if (!TIPOS_DE_IMAGEM.includes(arquivo.type)) return traduzir("imagem.tipoInvalido");
  if (arquivo.size > limite) return traduzir("imagem.grande", { mb: limite / MB });
  return null;
}

// "pagina2.jpg" antes de "pagina10.jpg": compara os números como números.
export function compararNomes(a, b) {
  return a.name.localeCompare(b.name, localeAtual(), { numeric: true, sensitivity: "base" });
}

export function tamanhoLegivel(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
