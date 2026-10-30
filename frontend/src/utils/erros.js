// Transforma a resposta 422 do FastAPI ({ detail: [{ loc: ["body", "campo"], msg }] })
// em { campo: "mensagem" }, para mostrar o erro embaixo do campo certo do formulário.
export function errosDeCampo(error) {
  const detalhes = error.response?.data?.detail;
  if (!Array.isArray(detalhes)) return {};

  return Object.fromEntries(
    detalhes
      .filter((item) => item.loc?.[0] === "body" && item.loc[1])
      .map((item) => [item.loc[1], item.msg.replace(/^Value error, /, "")])
  );
}
