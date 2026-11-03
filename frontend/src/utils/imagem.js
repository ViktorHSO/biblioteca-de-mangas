import { URL_DA_API } from "../api/client";

export const TIPOS_DE_CAPA = ["image/jpeg", "image/png", "image/webp"];
export const TAMANHO_MAXIMO_CAPA = 5 * 1024 * 1024; // o mesmo limite da API

// Capas enviadas do computador ficam na API e o banco guarda só o caminho
// ("/uploads/capas/..."). Para o navegador, o caminho vira um endereço completo.
export function ehCapaEnviada(caminho) {
  return typeof caminho === "string" && caminho.startsWith("/uploads/capas/");
}

export function urlDaImagem(caminho) {
  return ehCapaEnviada(caminho) ? `${URL_DA_API}${caminho}` : caminho;
}

export function problemaNoArquivo(arquivo) {
  if (!TIPOS_DE_CAPA.includes(arquivo.type)) return "Escolha uma imagem JPG, PNG ou WEBP.";
  if (arquivo.size > TAMANHO_MAXIMO_CAPA) return "A imagem pode ter no máximo 5 MB.";
  return null;
}

export function tamanhoLegivel(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
