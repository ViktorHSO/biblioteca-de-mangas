import { useNavigate } from "react-router-dom";
import { criarManga } from "../api/mangas";
import MangaForm from "../components/MangaForm";
import { useToast } from "../context/useToast";

export default function CriarManga() {
  const navigate = useNavigate();
  const { avisar } = useToast();

  async function salvar(dados) {
    const manga = await criarManga(dados);
    avisar("Mangá cadastrado.");
    navigate(`/manga/${manga.id}`);
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-paper">Novo mangá</h1>
        <p className="mt-1 text-paper/60">Adicione uma obra à sua estante.</p>
      </header>
      <MangaForm textoBotao="Salvar mangá" onSalvar={salvar} />
    </section>
  );
}
