import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { atualizarCapitulo, buscarCapitulo, enviarPaginas, excluirCapitulo } from "../api/capitulos";
import CapituloForm from "../components/CapituloForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { FormularioEsqueleto } from "../components/Esqueleto";
import { useToast } from "../context/useToast";
import { useIdioma } from "../context/useIdioma";
import { mensagemDaApi } from "../utils/erros";
import NaoEncontrado from "./NaoEncontrado";

export default function EditarCapitulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useToast();
  const { t } = useIdioma();
  const [capitulo, setCapitulo] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    buscarCapitulo(id)
      .then(setCapitulo)
      .catch((error) => setErro(error.response?.status === 404 ? 404 : "erro"));
  }, [id]);

  async function salvar(dados, arquivos, aoProgredir) {
    await atualizarCapitulo(id, dados);
    if (arquivos.length) {
      try {
        await enviarPaginas(id, arquivos, aoProgredir);
      } catch (error) {
        // Parte das imagens pode ter entrado: recarrega o capítulo para não enviar repetido.
        avisar(t("editarCap.falhaPaginas", { erro: mensagemDaApi(error, t("comum.tenteNovamente")) }), "erro");
        setCapitulo(await buscarCapitulo(id));
        setVersao((atual) => atual + 1);
        return;
      }
    }
    avisar(t("comum.alteracoesSalvas"));
    navigate(`/capitulo/${id}`);
  }

  async function excluir() {
    try {
      await excluirCapitulo(id);
      avisar(t("editarCap.excluido"));
      navigate(`/manga/${capitulo.manga_id}`);
    } catch {
      setConfirmandoExclusao(false);
      setErro("editarCap.erroExcluir");
    }
  }

  if (erro === 404) return <NaoEncontrado mensagem={t("nao.capitulo")} />;
  if (erro) return <p className="text-red-400">{t(erro === "erro" ? "erro.capitulo" : erro)}</p>;
  if (!capitulo) return <FormularioEsqueleto />;

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={`/manga/${capitulo.manga_id}`} className="text-sm text-paper/50 hover:text-paper">
            ← {capitulo.manga.titulo}
          </Link>
          <h1 className="mt-2 font-display text-3xl text-paper">{t("editarCap.titulo", { numero: capitulo.numero })}</h1>
        </div>
        <button
          type="button"
          onClick={() => setConfirmandoExclusao(true)}
          className="rounded-md border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          {t("editarCap.excluir")}
        </button>
      </header>

      <CapituloForm key={versao} valoresIniciais={capitulo} textoBotao={t("comum.salvarAlteracoes")} onSalvar={salvar} />

      <ConfirmDialog
        aberto={confirmandoExclusao}
        titulo={t("editarCap.confirmarTitulo")}
        mensagem={t("editarCap.confirmarMensagem", { numero: capitulo.numero })}
        textoConfirmar={t("comum.excluir")}
        onConfirmar={excluir}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    </section>
  );
}
