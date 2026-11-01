const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

// 1234 -> "1,2 mil"
export function formatarNumero(valor) {
  return compacto.format(valor ?? 0);
}
