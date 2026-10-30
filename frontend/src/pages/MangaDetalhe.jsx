import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buscarManga, excluirManga, registrarVisualizacao } from "../api/mangas";
import ConfirmDialog from "../components/ConfirmDialog";
import ListaCapitulos from "../components/ListaCapitulos";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/useAuth";
import NaoEncontrado from "./NaoEncontrado";

function separarGeneros(genero) {
  return (genero ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function MangaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logado } = useAuth();
  const [manga, setManga] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);
  const visualizacaoContada = useRef(null);

  useEffect(() => {
    buscarManga(id)
      .then(setManga)
      .catch((error) => setErro(error.response?.status === 404 ? 404 : "erro"));

    // O StrictMode do React roda os efeitos duas vezes em desenvolvimento;
    // o ref garante uma única visualização por mangá aberto.
    if (visualizacaoContada.current !== id) {
      visualizacaoContada.current = id;
      registrarVisualizacao(id).catch(() => {});
    }
  }, [id]);

  async function excluir() {
    try {
      await excluirManga(id);
      navigate("/");
    } catch {
      setConfirmandoExclusao(false);
      setErroExclusao("Não foi possível excluir o mangá.");
    }
  }

  if (erro === 404) return <NaoEncontrado mensagem="Mangá não encontrado." />;
  if (erro) return <p className="text-red-400">Não foi possível carregar o mangá. A API está rodando?</p>;
  if (!manga) return <p className="text-paper/60">Carregando...</p>;

  const generos = separarGeneros(manga.genero);
  const capitulos = manga.capitulos;
  const ultimo = capitulos[0];
  const primeiro = capitulos[capitulos.length - 1];

  return (
    <article className="space-y-10">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="mx-auto aspect-[3/4] w-48 overflow-hidden rounded-md border-2 border-black/60 bg-black/40 shadow-lg md:w-full">
          {manga.capa_url ? (
            <img src={manga.capa_url} alt={`Capa de ${manga.titulo}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-paper/30">Sem capa</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-paper/50">
            <span>{manga.tipo}</span>
            <span aria-hidden="true">•</span>
            <span>
              {manga.visualizacoes} {manga.visualizacoes === 1 ? "visualização" : "visualizações"}
            </span>
          </div>

          <h1 className="font-display text-4xl leading-tight text-paper">{manga.titulo}</h1>
          {manga.autor && <p className="text-paper/70">{manga.autor}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={manga.status} />
            {generos.map((genero) => (
              <span key={genero} className="rounded-sm bg-surface px-2 py-1 text-xs text-paper/80">
                {genero}
              </span>
            ))}
          </div>

          {manga.sinopse && <p className="max-w-2xl whitespace-pre-line text-paper/80">{manga.sinopse}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            {primeiro && (
              <Link
                to={`/capitulo/${primeiro.id}`}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base transition-opacity hover:opacity-90"
              >
                Ler do início
              </Link>
            )}
            {ultimo && ultimo !== primeiro && (
              <Link
                to={`/capitulo/${ultimo.id}`}
                className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                Último capítulo ({ultimo.numero})
              </Link>
            )}
            {logado && (
              <>
                <Link
                  to={`/manga/${id}/editar`}
                  className="rounded-md border border-white/10 px-4 py-2 text-sm text-paper/80 transition-colors hover:text-paper"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(true)}
                  className="rounded-md border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </>
            )}
          </div>
          {erroExclusao && <p className="text-sm text-red-400">{erroExclusao}</p>}
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl text-paper">
          Capítulos <span className="text-paper/40">({capitulos.length})</span>
        </h2>
        <ListaCapitulos capitulos={capitulos} />
      </section>

      <ConfirmDialog
        aberto={confirmandoExclusao}
        titulo="Excluir mangá?"
        mensagem={`"${manga.titulo}" e todos os seus capítulos serão apagados. Essa ação não pode ser desfeita.`}
        textoConfirmar="Excluir"
        onConfirmar={excluir}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    </article>
  );
}
