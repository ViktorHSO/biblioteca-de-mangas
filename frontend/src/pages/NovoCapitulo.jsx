import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { criarCapitulo } from "../api/capitulos";
import { buscarManga } from "../api/mangas";
import CapituloForm from "../components/CapituloForm";
import NaoEncontrado from "./NaoEncontrado";

export default function NovoCapitulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarManga(id)
      .then(setManga)
      .catch((error) => setErro(error.response?.status === 404 ? 404 : "erro"));
  }, [id]);

  async function salvar(dados) {
    const capitulo = await criarCapitulo({ ...dados, manga_id: Number(id) });
    navigate(`/capitulo/${capitulo.id}`);
  }

  if (erro === 404) return <NaoEncontrado mensagem="Mangá não encontrado." />;
  if (erro) return <p className="text-red-400">Não foi possível carregar o mangá.</p>;
  if (!manga) return <p className="text-paper/60">Carregando...</p>;

  // Sugere o número seguinte ao maior já cadastrado (a lista vem do mais novo ao mais antigo).
  const proximoNumero = (manga.capitulos[0]?.numero ?? 0) + 1;

  return (
    <section>
      <header className="mb-6">
        <Link to={`/manga/${id}`} className="text-sm text-paper/50 hover:text-paper">
          ← {manga.titulo}
        </Link>
        <h1 className="mt-2 font-display text-3xl text-paper">Novo capítulo</h1>
      </header>
      <CapituloForm valoresIniciais={{ numero: proximoNumero }} textoBotao="Salvar capítulo" onSalvar={salvar} />
    </section>
  );
}
