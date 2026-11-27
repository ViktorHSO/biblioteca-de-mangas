import { localeAtual } from "../i18n/idioma";

const formatadores = {};

// 1234 -> "1,2 mil" / "1.2K" / "1,2 mil"
export function formatarNumero(valor) {
  const locale = localeAtual();
  formatadores[locale] ??= new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  return formatadores[locale].format(valor ?? 0);
}
