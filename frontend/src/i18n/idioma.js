import api from "../api/client";
import { TEXTOS } from "./textos";

// Idiomas do site, com o nome de cada um no próprio idioma (para o seletor).
export const IDIOMAS = [
  { codigo: "pt", nome: "Português", sigla: "PT" },
  { codigo: "en", nome: "English", sigla: "EN" },
  { codigo: "es", nome: "Español", sigla: "ES" },
];
const CODIGOS = IDIOMAS.map((idioma) => idioma.codigo);
const LOCALES = { pt: "pt-BR", en: "en-US", es: "es-ES" };
const CHAVE = "biblioteca:idioma";

let atual = "pt";

// Idioma salvo neste navegador; na primeira visita, o idioma do navegador (se for um dos três).
export function idiomaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (CODIGOS.includes(salvo)) return salvo;
  } catch {
    // sem armazenamento disponível
  }
  const doNavegador = (navigator.languages ?? [navigator.language])
    .map((codigo) => codigo?.slice(0, 2).toLowerCase())
    .find((codigo) => CODIGOS.includes(codigo));
  return doNavegador ?? "pt";
}

// Aplica o idioma fora do React: cabeçalho das requisições (a API devolve título,
// sinopse e gêneros traduzidos), datas/números e o atributo lang da página.
export function aplicarIdioma(idioma, { salvar = false } = {}) {
  atual = CODIGOS.includes(idioma) ? idioma : "pt";
  api.defaults.headers.common["Accept-Language"] = atual;
  document.documentElement.lang = LOCALES[atual];
  document.title = traduzirPara(atual, "app.nome");
  if (salvar) {
    try {
      localStorage.setItem(CHAVE, atual);
    } catch {
      // sem armazenamento disponível: vale só até recarregar a página
    }
  }
}

export function localeAtual() {
  return LOCALES[atual];
}

export function traduzirPara(idioma, chave, valores = {}) {
  const texto = TEXTOS[idioma]?.[chave] ?? TEXTOS.pt[chave] ?? chave;
  if (typeof texto === "function") return texto(valores);
  return texto.replace(/\{(\w+)\}/g, (trecho, nome) => (nome in valores ? String(valores[nome]) : trecho));
}

// Para funções fora dos componentes (ex.: validação de arquivos).
export function traduzir(chave, valores) {
  return traduzirPara(atual, chave, valores);
}
