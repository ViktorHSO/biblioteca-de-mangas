import { Link } from "react-router-dom";
import { useIdioma } from "../../context/useIdioma";
import { formatarNumero } from "../../utils/numero";
import Capa from "../Capa";
import StatusBadge from "../StatusBadge";

export default function EmAlta({ mangas }) {
  const { t } = useIdioma();
  if (mangas.length === 0) {
    return <p className="text-sm text-paper/50">{t("home.semLeituras")}</p>;
  }

  return (
    <ol className="space-y-3">
      {mangas.map((manga) => (
        <li key={manga.id}>
          <Link
            to={`/manga/${manga.id}`}
            className="flex items-center gap-3 rounded-md border border-white/5 bg-surface/60 p-2.5 transition-colors hover:bg-surface"
          >
            <span className="w-8 shrink-0 text-center font-display text-3xl text-accent">{manga.posicao}</span>
            <Capa manga={manga} className="aspect-[3/4] w-12 shrink-0 rounded-sm" />
            <span className="min-w-0 space-y-1">
              <span className="line-clamp-1 font-display text-paper">{manga.titulo}</span>
              <span className="block text-xs text-paper/50">{formatarNumero(manga.visualizacoes)} {t("comum.visualizacoesRotulo")}</span>
              <StatusBadge status={manga.status} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
