import { Link } from "react-router-dom";
import { listarRanking } from "../api/mangas";
import Capa from "../components/Capa";
import StatusBadge from "../components/StatusBadge";
import useCarregamento from "../hooks/useCarregamento";
import { formatarNumero } from "../utils/numero";

const TAMANHO_RANKING = 50;

function carregarRanking() {
  return listarRanking(TAMANHO_RANKING);
}

// As 3 primeiras posições ganham cor de medalha.
const COR_POSICAO = { 1: "text-accent", 2: "text-paper", 3: "text-[#C08457]" };

export default function Ranking() {
  const { dados: mangas, erro } = useCarregamento(carregarRanking);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-paper">Ranking</h1>
        <p className="mt-1 text-sm text-paper/50">As {TAMANHO_RANKING} séries mais vistas da biblioteca.</p>
      </header>

      {erro && <p className="text-red-400">Não foi possível carregar o ranking. A API está rodando?</p>}
      {!mangas && !erro && <p className="text-paper/60">Carregando...</p>}
      {mangas?.length === 0 && <p className="text-paper/50">Nenhum mangá cadastrado ainda.</p>}

      {mangas?.length > 0 && (
        <ol className="divide-y divide-white/5 overflow-hidden rounded-md border border-white/5">
          {mangas.map((manga) => (
            <li key={manga.id}>
              <Link
                to={`/manga/${manga.id}`}
                className="flex items-center gap-4 bg-surface/60 px-4 py-3 transition-colors hover:bg-surface"
              >
                <span className={`w-10 shrink-0 text-center font-display text-2xl ${COR_POSICAO[manga.posicao] ?? "text-paper/40"}`}>
                  {manga.posicao}
                </span>
                <Capa manga={manga} className="aspect-[3/4] w-12 shrink-0 rounded-sm" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-display text-paper">{manga.titulo}</span>
                  <span className="line-clamp-1 text-xs text-paper/50">
                    <span className="capitalize">{manga.tipo}</span>
                    {manga.genero && ` · ${manga.genero}`}
                  </span>
                </span>
                <span className="hidden sm:block">
                  <StatusBadge status={manga.status} />
                </span>
                <span className="w-24 shrink-0 text-right text-sm text-paper/70">
                  {formatarNumero(manga.visualizacoes)}
                  <span className="block text-[10px] uppercase tracking-wide text-paper/40">visualizações</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
