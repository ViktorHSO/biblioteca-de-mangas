import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buscarCapitulo, registrarLeitura } from "../api/capitulos";
import { useAuth } from "../context/useAuth";
import { salvarProgresso } from "../utils/progresso";
import NaoEncontrado from "./NaoEncontrado";

function NavegacaoCapitulos({ capitulo }) {
  const classeBotao =
    "rounded-md border border-white/10 px-3 py-1.5 text-sm text-paper/80 transition-colors hover:border-accent hover:text-accent";
  const classeDesativado = "rounded-md border border-white/5 px-3 py-1.5 text-sm text-paper/20";

  return (
    <nav className="flex items-center justify-between gap-2" aria-label="Navegação entre capítulos">
      {capitulo.anterior_id ? (
        <Link to={`/capitulo/${capitulo.anterior_id}`} className={classeBotao}>← Anterior</Link>
      ) : (
        <span className={classeDesativado}>← Anterior</span>
      )}
      <Link to={`/manga/${capitulo.manga_id}`} className={classeBotao}>Capítulos</Link>
      {capitulo.proximo_id ? (
        <Link to={`/capitulo/${capitulo.proximo_id}`} className={classeBotao}>Próximo →</Link>
      ) : (
        <span className={classeDesativado}>Próximo →</span>
      )}
    </nav>
  );
}

// A key faz o React recriar o leitor a cada capítulo, começando com o estado limpo
// (sem mostrar por um instante as páginas do capítulo anterior).
export default function Leitor() {
  const { id } = useParams();
  return <LeitorCapitulo key={id} id={id} />;
}

function LeitorCapitulo({ id }) {
  const navigate = useNavigate();
  const { logado } = useAuth();
  const [capitulo, setCapitulo] = useState(null);
  const [erro, setErro] = useState(null);
  const leituraContada = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    buscarCapitulo(id)
      .then((dados) => {
        setCapitulo(dados);
        salvarProgresso(dados.manga_id, dados);
      })
      .catch((error) => setErro(error.response?.status === 404 ? 404 : "erro"));

    // Mesmo cuidado da página do mangá: o StrictMode roda o efeito duas vezes em desenvolvimento.
    if (leituraContada.current !== id) {
      leituraContada.current = id;
      registrarLeitura(id).catch(() => {});
    }
  }, [id]);

  // Setas ← e → trocam de capítulo, exceto quando o foco está num campo de texto.
  useEffect(() => {
    if (!capitulo) return undefined;

    function aoApertarTecla(evento) {
      if (evento.target.closest("input, textarea, select, [contenteditable]")) return;
      if (evento.key === "ArrowLeft" && capitulo.anterior_id) navigate(`/capitulo/${capitulo.anterior_id}`);
      if (evento.key === "ArrowRight" && capitulo.proximo_id) navigate(`/capitulo/${capitulo.proximo_id}`);
    }

    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [capitulo, navigate]);

  if (erro === 404) return <NaoEncontrado mensagem="Capítulo não encontrado." />;
  if (erro) return <p className="text-red-400">Não foi possível carregar o capítulo. A API está rodando?</p>;
  if (!capitulo) return <p className="text-paper/60">Carregando...</p>;

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-6 space-y-1 text-center">
        <Link to={`/manga/${capitulo.manga_id}`} className="font-display text-lg text-accent hover:underline">
          {capitulo.manga.titulo}
        </Link>
        <h1 className="font-display text-3xl text-paper">
          Capítulo {capitulo.numero}
          {capitulo.titulo && <span className="text-paper/60"> — {capitulo.titulo}</span>}
        </h1>
        {logado && (
          <Link to={`/capitulo/${id}/editar`} className="inline-block pt-1 text-xs text-paper/50 hover:text-paper">
            Editar capítulo
          </Link>
        )}
      </header>

      <div className="sticky top-[57px] z-30 -mx-4 mb-6 border-y border-white/5 bg-base/95 px-4 py-2 backdrop-blur">
        <NavegacaoCapitulos capitulo={capitulo} />
      </div>

      {capitulo.paginas.length === 0 ? (
        <p className="py-16 text-center text-paper/50">Este capítulo ainda não tem páginas cadastradas.</p>
      ) : (
        <div className="flex flex-col items-center">
          {capitulo.paginas.map((pagina) => (
            <img
              key={pagina.id}
              src={pagina.imagem_url}
              alt={`Página ${pagina.ordem}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="block w-full"
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <NavegacaoCapitulos capitulo={capitulo} />
        <p className="mt-3 text-center text-xs text-paper/30">Dica: use as setas ← e → do teclado para trocar de capítulo.</p>
      </div>
    </article>
  );
}
