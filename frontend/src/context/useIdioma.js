import { useContext } from "react";
import { IdiomaContext } from "./idiomas";

// const { t, idioma, trocarIdioma } = useIdioma();  t("nav.inicio") -> "Início" / "Home" / "Inicio"
export function useIdioma() {
  const contexto = useContext(IdiomaContext);
  if (!contexto) {
    throw new Error("useIdioma precisa estar dentro de <IdiomaProvider>");
  }
  return contexto;
}
