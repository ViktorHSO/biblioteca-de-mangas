import StatusBadge from "./StatusBadge";

export default function MangaCard({ manga }) {
  return (
    <div className="bg-surface border-2 border-black/60 rounded-md overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all">
      <div className="aspect-[3/4] bg-black/40">
        {manga.capa_url ? (
          <img src={manga.capa_url} alt={manga.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper/40 text-sm">
            Sem capa
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <h3 className="font-display text-paper text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {manga.titulo}
        </h3>
        <p className="text-paper/60 text-xs truncate">{manga.autor}</p>
        <div className="pt-1">
          <StatusBadge status={manga.status} />
        </div>
      </div>
    </div>
  );
}