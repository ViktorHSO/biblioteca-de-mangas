export default function Capa({ manga, className = "" }) {
  return (
    <div className={`overflow-hidden bg-black/40 ${className}`}>
      {manga.capa_url ? (
        <img src={manga.capa_url} alt={manga.titulo} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-paper/40">Sem capa</div>
      )}
    </div>
  );
}
