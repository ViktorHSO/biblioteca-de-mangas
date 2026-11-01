import { Link } from "react-router-dom";
import { tempoRelativo } from "../../utils/tempo";
import Capa from "../Capa";

export default function NovosCapitulos({ mangas }) {
  if (mangas.length === 0) {
    return <p className="text-sm text-paper/50">Nenhum capítulo cadastrado ainda.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {mangas.map((manga) => (
        <li key={manga.id} className="flex gap-3 rounded-md border border-white/5 bg-surface/60 p-2.5">
          <Link to={`/manga/${manga.id}`} className="shrink-0">
            <Capa manga={manga} className="aspect-[3/4] w-16 rounded-sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/manga/${manga.id}`} className="line-clamp-1 font-display text-paper hover:text-accent">
              {manga.titulo}
            </Link>
            <p className="text-[11px] uppercase tracking-wide text-paper/40">{manga.tipo}</p>
            <ul className="mt-1.5 space-y-1">
              {manga.ultimos_capitulos.map((capitulo) => (
                <li key={capitulo.id}>
                  <Link
                    to={`/capitulo/${capitulo.id}`}
                    className="flex items-center justify-between gap-2 rounded-sm bg-white/5 px-2 py-1 text-xs transition-colors hover:bg-white/10"
                  >
                    <span className="text-paper/90">Cap. {capitulo.numero}</span>
                    <span className="text-paper/40">{tempoRelativo(capitulo.criado_em)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
}
