const relativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto", style: "short" });

const UNIDADES = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function tempoRelativo(dataIso) {
  const segundos = (new Date(dataIso).getTime() - Date.now()) / 1000;
  for (const [unidade, tamanho] of UNIDADES) {
    if (Math.abs(segundos) >= tamanho) {
      return relativo.format(Math.round(segundos / tamanho), unidade);
    }
  }
  return "agora";
}

// Datas sem horário ("2026-10-29") são montadas no fuso local; com new Date(texto)
// o navegador as trata como UTC e o dia pode aparecer um a menos no Brasil.
export function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}
