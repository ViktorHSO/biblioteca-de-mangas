import { Link } from "react-router-dom";
import { formatarData, tempoRelativo } from "../utils/tempo";

export default function ListaCapitulos({ capitulos }) {
  if (capitulos.length === 0) {
    return <p className="text-sm text-paper/50">Nenhum capítulo cadastrado ainda.</p>;
  }

  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-md border border-white/5">
      {capitulos.map((capitulo) => (
        <li key={capitulo.id}>
          <Link
            to={`/capitulo/${capitulo.id}`}
            className="flex items-center justify-between gap-4 bg-surface/60 px-4 py-3 transition-colors hover:bg-surface"
          >
            <span className="min-w-0">
              <span className="font-semibold text-paper">Capítulo {capitulo.numero}</span>
              {capitulo.titulo && <span className="ml-2 truncate text-paper/60">— {capitulo.titulo}</span>}
            </span>
            <span className="shrink-0 text-xs text-paper/40">
              {capitulo.data_lancamento ? formatarData(capitulo.data_lancamento) : tempoRelativo(capitulo.criado_em)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
