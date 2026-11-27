import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buscarManga, excluirManga, registrarVisualizacao } from "../api/mangas";
import ConfirmDialog from "../components/ConfirmDialog";
import { DetalheEsqueleto } from "../components/Esqueleto";
import ListaCapitulos from "../components/ListaCapitulos";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { useIdioma } from "../context/useIdioma";
import { urlDaImagem } from "../utils/imagem";
import { lerProgresso } from "../utils/progresso";
import NaoEncontrado from "./NaoEncontrado";

function separarGeneros(genero) {
  return (genero ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// A key recria a página ao trocar de mangá (ex.: pela busca rápida), sem mostrar o anterior.
export default function MangaDetalhe() {
  const { id } = useParams();
  return <PaginaManga key={id} id={id} />;
}

function PaginaManga({ id }) {
  const navigate = useNavigate();
  const { logado } = useAuth();
  const { avisar } = useToast();
  const { idioma, t } = useIdioma();
  const [manga, setManga] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);
  const visualizacaoContada = useRef(null);

  // Busca de novo ao trocar o idioma do site: título, sinopse e gêneros vêm traduzidos.
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
  }, [id, idioma]);

  async function excluir() {
    try {
      await excluirManga(id);
      avisar(t("detalhe.excluido"));
      navigate("/");
    } catch {
      setConfirmandoExclusao(false);
      setErroExclusao(t("detalhe.erroExcluir"));
    }
  }

  if (erro === 404) return <NaoEncontrado mensagem={t("nao.manga")} />;
  if (erro) return <p className="text-red-400">{t("erro.manga")} {t("erro.apiRodando")}</p>;
  if (!manga) return <DetalheEsqueleto />;

  const generos = separarGeneros(manga.genero);
  const capitulos = manga.capitulos;
  const ultimo = capitulos[0];
  const primeiro = capitulos[capitulos.length - 1];
  const progresso = lerProgresso(manga.id);
  const continuar = progresso && capitulos.find((capitulo) => capitulo.id === progresso.capituloId);

  return (
    <article className="space-y-10">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="mx-auto aspect-[3/4] w-48 overflow-hidden rounded-md border-2 border-black/60 bg-black/40 shadow-lg md:w-full">
          {manga.capa_url ? (
            <img src={urlDaImagem(manga.capa_url)} alt={t("comum.capaDe", { titulo: manga.titulo })} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-paper/30">{t("comum.semCapa")}</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-paper/50">
            <span>{t(`tipo.${manga.tipo}`)}</span>
            <span aria-hidden="true">•</span>
            <span>{t("comum.visualizacoes", { n: manga.visualizacoes })}</span>
          </div>

          <h1 className="font-display text-4xl leading-tight text-paper">{manga.titulo}</h1>
          {manga.titulo_original && manga.titulo_original !== manga.titulo && (
            <p lang={manga.idioma_original} className="-mt-2 text-sm text-paper/50">
              {t("detalhe.tituloOriginal", { titulo: manga.titulo_original })}
            </p>
          )}
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
            {continuar ? (
              <Link
                to={`/capitulo/${continuar.id}`}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base transition-opacity hover:opacity-90"
              >
                {t("detalhe.continuar", { numero: continuar.numero })}
              </Link>
            ) : (
              primeiro && (
                <Link
                  to={`/capitulo/${primeiro.id}`}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base transition-opacity hover:opacity-90"
                >
                  {t("detalhe.lerInicio")}
                </Link>
              )
            )}
            {ultimo && ultimo !== primeiro && (
              <Link
                to={`/capitulo/${ultimo.id}`}
                className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                {t("detalhe.ultimo", { numero: ultimo.numero })}
              </Link>
            )}
            {logado && (
              <>
                <Link
                  to={`/manga/${id}/capitulos/novo`}
                  className="rounded-md border border-white/10 px-4 py-2 text-sm text-paper/80 transition-colors hover:text-paper"
                >
                  {t("detalhe.novoCapitulo")}
                </Link>
                <Link
                  to={`/manga/${id}/editar`}
                  className="rounded-md border border-white/10 px-4 py-2 text-sm text-paper/80 transition-colors hover:text-paper"
                >
                  {t("comum.editar")}
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(true)}
                  className="rounded-md border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  {t("comum.excluir")}
                </button>
              </>
            )}
          </div>
          {erroExclusao && <p className="text-sm text-red-400">{erroExclusao}</p>}
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl text-paper">
          {t("detalhe.capitulos")} <span className="text-paper/40">({capitulos.length})</span>
        </h2>
        <ListaCapitulos capitulos={capitulos} capituloAtualId={continuar?.id} />
      </section>

      <ConfirmDialog
        aberto={confirmandoExclusao}
        titulo={t("detalhe.excluirTitulo")}
        mensagem={t("detalhe.excluirMensagem", { titulo: manga.titulo })}
        textoConfirmar={t("comum.excluir")}
        onConfirmar={excluir}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    </article>
  );
}
