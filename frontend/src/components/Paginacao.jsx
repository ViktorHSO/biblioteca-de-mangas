// Mostra a primeira, a última e as páginas vizinhas da atual: 1 … 4 5 6 … 12
function paginasVisiveis(atual, total) {
  const paginas = new Set([1, total, atual - 1, atual, atual + 1]);
  return [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export default function Paginacao({ pagina, totalPaginas, aoMudar }) {
  if (totalPaginas <= 1) return null;

  const classeBotao = "min-w-9 rounded-md border px-3 py-1.5 text-sm transition-colors";
  const normal = "border-white/10 text-paper/70 hover:border-accent hover:text-accent";
  const desativado = "border-white/5 text-paper/20";

  const paginas = paginasVisiveis(pagina, totalPaginas);
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Paginação">
      <button
        type="button"
        onClick={() => aoMudar(pagina - 1)}
        disabled={pagina === 1}
        className={`${classeBotao} ${pagina === 1 ? desativado : normal}`}
      >
        ← Anterior
      </button>

      {paginas.map((numero, posicao) => {
        const temSalto = posicao > 0 && numero - paginas[posicao - 1] > 1;
        return (
          <span key={numero} className="flex items-center gap-2">
            {temSalto && <span className="text-paper/30">…</span>}
            <button
              type="button"
              onClick={() => aoMudar(numero)}
              aria-current={numero === pagina ? "page" : undefined}
              className={`${classeBotao} ${numero === pagina ? "border-accent bg-accent text-base font-semibold" : normal}`}
            >
              {numero}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => aoMudar(pagina + 1)}
        disabled={pagina === totalPaginas}
        className={`${classeBotao} ${pagina === totalPaginas ? desativado : normal}`}
      >
        Próxima →
      </button>
    </nav>
  );
}
