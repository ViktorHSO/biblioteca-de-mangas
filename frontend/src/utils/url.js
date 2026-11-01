// Lê um número de página da URL (?pagina=3). Valores inválidos viram 1.
export function lerPagina(searchParams) {
  const pagina = Number.parseInt(searchParams.get("pagina"), 10);
  return Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
}

// Só aceita da URL valores que a API conhece; o resto é ignorado em vez de virar erro 422.
export function lerOpcao(searchParams, chave, permitidos) {
  const valor = searchParams.get(chave);
  return permitidos.includes(valor) ? valor : "";
}
