import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { atualizarManga, buscarManga } from "../api/mangas";
import MangaForm from "../components/MangaForm";

export default function EditarManga() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarManga(id)
      .then(setManga)
      .catch((error) =>
        setErro(error.response?.status === 404 ? "Mangá não encontrado." : "Não foi possível carregar o mangá.")
      );
  }, [id]);

  async function salvar(dados) {
    await atualizarManga(id, dados);
    navigate(`/manga/${id}`);
  }

  if (erro) return <p className="text-red-400">{erro}</p>;
  if (!manga) return <p className="text-paper/60">Carregando...</p>;

  return (
    <section>
      <header className="mb-6">
        <Link to={`/manga/${id}`} className="text-sm text-paper/50 hover:text-paper">
          ← Voltar para o mangá
        </Link>
        <h1 className="mt-2 font-display text-3xl text-paper">Editar mangá</h1>
      </header>
      <MangaForm valoresIniciais={manga} textoBotao="Salvar alterações" onSalvar={salvar} />
    </section>
  );
}
