import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Capa from "../Capa";

const INTERVALO_MS = 6000;

function prefereMenosMovimento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export default function CarrosselDestaques({ mangas }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const total = mangas.length;

  // Avança sozinho, exceto com o mouse/foco no banner ou se o sistema pede menos animação.
  useEffect(() => {
    if (total < 2 || pausado || prefereMenosMovimento()) return undefined;
    const timer = setInterval(() => setIndice((atual) => (atual + 1) % total), INTERVALO_MS);
    return () => clearInterval(timer);
  }, [total, pausado]);

  if (total === 0) return null;

  const manga = mangas[indice % total];
  const irPara = (novo) => setIndice((novo + total) % total);
  const generos = manga.genero?.split(",").map((g) => g.trim()).filter(Boolean) ?? [];

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className="relative overflow-hidden rounded-lg border border-white/5 bg-surface"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {manga.capa_url && (
        <img
          src={manga.capa_url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-base via-base/80 to-transparent" />

      <div className="relative flex min-h-[280px] items-center gap-6 px-12 py-8 md:gap-10 md:px-16 md:py-10">
        <Capa manga={manga} className="hidden aspect-[3/4] w-40 shrink-0 rounded-md shadow-2xl sm:block md:w-48" />

        <div className="min-w-0 space-y-3" aria-live={pausado ? "polite" : "off"}>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Destaque · {manga.tipo}</p>
          <h2 className="font-display text-3xl leading-tight text-paper md:text-4xl">{manga.titulo}</h2>
          {generos.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {generos.map((genero) => (
                <li key={genero} className="rounded-sm bg-white/10 px-2 py-0.5 text-xs text-paper/80">
                  {genero}
                </li>
              ))}
            </ul>
          )}
          {manga.sinopse && <p className="line-clamp-3 max-w-xl text-sm text-paper/70">{manga.sinopse}</p>}
          <Link
            to={`/manga/${manga.id}`}
            className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base transition-opacity hover:opacity-90"
          >
            Ver mangá
          </Link>
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => irPara(indice - 1)}
            aria-label="Destaque anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-1.5 text-paper/80 hover:text-accent"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => irPara(indice + 1)}
            aria-label="Próximo destaque"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-1.5 text-paper/80 hover:text-accent"
          >
            ›
          </button>
          <div className="absolute bottom-3 right-4 flex gap-2">
            {mangas.map((item, posicao) => (
              <button
                key={item.id}
                type="button"
                onClick={() => irPara(posicao)}
                aria-label={`Ir para o destaque ${posicao + 1}`}
                aria-current={posicao === indice % total}
                className={`h-2 rounded-full transition-all ${posicao === indice % total ? "w-6 bg-accent" : "w-2 bg-paper/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
