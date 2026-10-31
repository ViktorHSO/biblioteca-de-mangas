import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { atualizarCapitulo, buscarCapitulo, excluirCapitulo } from "../api/capitulos";
import CapituloForm from "../components/CapituloForm";
import ConfirmDialog from "../components/ConfirmDialog";
import NaoEncontrado from "./NaoEncontrado";

export default function EditarCapitulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capitulo, setCapitulo] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    buscarCapitulo(id)
      .then(setCapitulo)
      .catch((error) => setErro(error.response?.status === 404 ? 404 : "erro"));
  }, [id]);

  async function salvar(dados) {
    await atualizarCapitulo(id, dados);
    navigate(`/capitulo/${id}`);
  }

  async function excluir() {
    try {
      await excluirCapitulo(id);
      navigate(`/manga/${capitulo.manga_id}`);
    } catch {
      setConfirmandoExclusao(false);
      setErro("Não foi possível excluir o capítulo.");
    }
  }

  if (erro === 404) return <NaoEncontrado mensagem="Capítulo não encontrado." />;
  if (erro) return <p className="text-red-400">{erro === "erro" ? "Não foi possível carregar o capítulo." : erro}</p>;
  if (!capitulo) return <p className="text-paper/60">Carregando...</p>;

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

      <CapituloForm valoresIniciais={capitulo} textoBotao="Salvar alterações" onSalvar={salvar} />

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
