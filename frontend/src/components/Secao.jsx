import { Link } from "react-router-dom";

export default function Secao({ titulo, link, textoLink = "Ver tudo", children }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4 border-l-4 border-accent pl-3">
        <h2 className="font-display text-2xl text-paper">{titulo}</h2>
        {link && (
          <Link to={link} className="shrink-0 text-sm text-paper/60 transition-colors hover:text-accent">
            {textoLink} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
