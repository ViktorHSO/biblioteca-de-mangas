import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listarLancamentos } from "../api/capitulos";
import Capa from "../components/Capa";
import Paginacao from "../components/Paginacao";
import useCarregamento from "../hooks/useCarregamento";
import { tempoRelativo } from "../utils/tempo";
import { lerPagina } from "../utils/url";

const POR_PAGINA = 30;

export default function Lancamentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pagina = lerPagina(searchParams);

  const { dados, erro, carregando } = useCarregamento(
    useCallback(() => listarLancamentos({ skip: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA }), [pagina]),
  );

  function mudarPagina(nova) {
    setSearchParams(nova > 1 ? { pagina: String(nova) } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-paper">Lançamentos</h1>
        <p className="mt-1 text-sm text-paper/50">Os capítulos cadastrados mais recentemente.</p>
      </header>

      {erro && <p className="text-red-400">Não foi possível carregar os lançamentos. A API está rodando?</p>}
      {!dados && !erro && <p className="text-paper/60">Carregando...</p>}
      {dados?.itens.length === 0 && <p className="text-paper/50">Nenhum capítulo cadastrado ainda.</p>}

      {dados?.itens.length > 0 && (
        <div className={`space-y-8 transition-opacity ${carregando ? "opacity-50" : ""}`} aria-busy={carregando}>
          <ul className="divide-y divide-white/5 overflow-hidden rounded-md border border-white/5">
            {dados.itens.map((capitulo) => (
              <li key={capitulo.id} className="flex items-center gap-4 bg-surface/60 px-4 py-3">
                <Link to={`/manga/${capitulo.manga.id}`} className="shrink-0">
                  <Capa manga={capitulo.manga} className="aspect-[3/4] w-12 rounded-sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/manga/${capitulo.manga.id}`} className="line-clamp-1 font-display text-paper hover:text-accent">
                    {capitulo.manga.titulo}
                  </Link>
                  <Link to={`/capitulo/${capitulo.id}`} className="line-clamp-1 text-sm text-paper/70 hover:text-accent">
                    Capítulo {capitulo.numero}
                    {capitulo.titulo && <span className="text-paper/50"> — {capitulo.titulo}</span>}
                  </Link>
                </div>
                <span className="shrink-0 text-xs text-paper/40">{tempoRelativo(capitulo.criado_em)}</span>
              </li>
            ))}
          </ul>
          <Paginacao pagina={pagina} totalPaginas={Math.ceil(dados.total / POR_PAGINA)} aoMudar={mudarPagina} />
        </div>
      )}
    </section>
  );
}
