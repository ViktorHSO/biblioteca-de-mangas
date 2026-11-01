import { useEffect, useState } from "react";

// Executa `carregar` e guarda o resultado. A função precisa ser estável (declarada fora do
// componente ou memorizada com useCallback): uma função nova a cada render buscaria de novo.
// Enquanto uma nova busca não termina, os dados anteriores continuam disponíveis,
// para a tela não "piscar" ao trocar de página ou de filtro.
export default function useCarregamento(carregar) {
  const [estado, setEstado] = useState({ origem: null, dados: null, erro: null });

  useEffect(() => {
    let ativo = true;
    carregar()
      .then((dados) => ativo && setEstado({ origem: carregar, dados, erro: null }))
      .catch((erro) => ativo && setEstado({ origem: carregar, dados: null, erro }));
    // Descarta a resposta de uma busca antiga que chegue depois da atual.
    return () => {
      ativo = false;
    };
  }, [carregar]);

  const carregando = estado.origem !== carregar;
  return { dados: estado.dados, erro: carregando ? null : estado.erro, carregando };
}
