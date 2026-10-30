import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function MangaCard({ manga }) {
  return (
    <Link
      to={`/manga/${manga.id}`}
      className="block overflow-hidden rounded-md border-2 border-black/60 bg-surface shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="aspect-[3/4] bg-black/40">
        {manga.capa_url ? (
          <img src={manga.capa_url} alt={manga.titulo} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-paper/40">Sem capa</div>
        )}
      </div>
      <div className="space-y-1 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm leading-snug text-paper">{manga.titulo}</h3>
        <p className="truncate text-xs text-paper/60">{manga.autor}</p>
        <div className="pt-1">
          <StatusBadge status={manga.status} />
        </div>
      </div>
    </Link>
  );
}
