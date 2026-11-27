import { useEffect, useState } from "react";
import { useIdioma } from "../context/useIdioma";

// Executa `carregar` e guarda o resultado. A função precisa ser estável (declarada fora do
// componente ou memorizada com useCallback): uma função nova a cada render buscaria de novo.
// Enquanto uma nova busca não termina, os dados anteriores continuam disponíveis,
// para a tela não "piscar" ao trocar de página, de filtro ou de idioma.
// Trocar o idioma do site busca de novo: a API devolve título, sinopse e gêneros traduzidos.
export default function useCarregamento(carregar) {
  const { idioma } = useIdioma();
  const [estado, setEstado] = useState({ origem: null, idioma: null, dados: null, erro: null });

  useEffect(() => {
    let ativo = true;
    carregar()
      .then((dados) => ativo && setEstado({ origem: carregar, idioma, dados, erro: null }))
      .catch((erro) => ativo && setEstado({ origem: carregar, idioma, dados: null, erro }));
    // Descarta a resposta de uma busca antiga que chegue depois da atual.
    return () => {
      ativo = false;
    };
  }, [carregar, idioma]);

  const carregando = estado.origem !== carregar || estado.idioma !== idioma;
  return { dados: estado.dados, erro: carregando ? null : estado.erro, carregando };
}
