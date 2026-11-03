// Transforma a resposta 422 do FastAPI ({ detail: [{ loc: ["body", "campo"], msg }] })
// em { campo: "mensagem" }, para mostrar o erro embaixo do campo certo do formulário.
// Em listas, o índice vem no loc (["body", "paginas", 3]) e vira "Linha 4: ...".
// Mensagem de erro simples da API ({ detail: "texto" }), quando houver.
export function mensagemDaApi(error, padrao) {
  const detalhe = error.response?.data?.detail;
  return typeof detalhe === "string" ? detalhe : padrao;
}

export function errosDeCampo(error) {
  const detalhes = error.response?.data?.detail;
  if (!Array.isArray(detalhes)) return {};

  const erros = {};
  for (const item of detalhes) {
    const [origem, campo, indice] = item.loc ?? [];
    if (origem !== "body" || !campo || erros[campo]) continue;

    const mensagem = item.msg.replace(/^Value error, /, "");
    erros[campo] = Number.isInteger(indice) ? `Linha ${indice + 1}: ${mensagem}` : mensagem;
  }
  return erros;
}
