import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { atualizarCapitulo, buscarCapitulo, enviarPaginas, excluirCapitulo } from "../api/capitulos";
import CapituloForm from "../components/CapituloForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { FormularioEsqueleto } from "../components/Esqueleto";
import { useToast } from "../context/useToast";
import { mensagemDaApi } from "../utils/erros";
import NaoEncontrado from "./NaoEncontrado";

export default function EditarCapitulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useToast();
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
        avisar(`Nem todas as páginas foram enviadas: ${mensagemDaApi(error, "tente novamente.")}`, "erro");
        setCapitulo(await buscarCapitulo(id));
        setVersao((atual) => atual + 1);
        return;
      }
    }
    avisar("Alterações salvas.");
    navigate(`/capitulo/${id}`);
  }

  async function excluir() {
    try {
      await excluirCapitulo(id);
      avisar("Capítulo excluído.");
      navigate(`/manga/${capitulo.manga_id}`);
    } catch {
      setConfirmandoExclusao(false);
      setErro("Não foi possível excluir o capítulo.");
    }
  }

  if (erro === 404) return <NaoEncontrado mensagem="Capítulo não encontrado." />;
  if (erro) return <p className="text-red-400">{erro === "erro" ? "Não foi possível carregar o capítulo." : erro}</p>;
  if (!capitulo) return <FormularioEsqueleto />;

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={`/manga/${capitulo.manga_id}`} className="text-sm text-paper/50 hover:text-paper">
            ← {capitulo.manga.titulo}
          </Link>
          <h1 className="mt-2 font-display text-3xl text-paper">Editar capítulo {capitulo.numero}</h1>
        </div>
        <button
          type="button"
          onClick={() => setConfirmandoExclusao(true)}
          className="rounded-md border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          Excluir capítulo
        </button>
      </header>

      <CapituloForm key={versao} valoresIniciais={capitulo} textoBotao="Salvar alterações" onSalvar={salvar} />

      <ConfirmDialog
        aberto={confirmandoExclusao}
        titulo="Excluir capítulo?"
        mensagem={`O capítulo ${capitulo.numero} e todas as suas páginas serão apagados.`}
        textoConfirmar="Excluir"
        onConfirmar={excluir}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    </section>
  );
}
