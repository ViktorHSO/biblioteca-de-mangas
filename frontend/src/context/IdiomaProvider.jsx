import { useCallback, useMemo, useState } from "react";
import { aplicarIdioma, idiomaInicial, traduzirPara } from "../i18n/idioma";
import { IdiomaContext } from "./idiomas";

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    const inicial = idiomaInicial();
    // Antes do primeiro render: as primeiras requisições já saem com o idioma certo.
    aplicarIdioma(inicial);
    return inicial;
  });

  const trocarIdioma = useCallback((novo) => {
    aplicarIdioma(novo, { salvar: true });
    setIdioma(novo);
  }, []);

  const t = useCallback((chave, valores) => traduzirPara(idioma, chave, valores), [idioma]);

  const valor = useMemo(() => ({ idioma, trocarIdioma, t }), [idioma, trocarIdioma, t]);

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
}
