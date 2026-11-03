import { useNavigate } from "react-router-dom";
import { criarManga, enviarCapa } from "../api/mangas";
import MangaForm from "../components/MangaForm";
import { useToast } from "../context/useToast";
import { mensagemDaApi } from "../utils/erros";

export default function CriarManga() {
  const navigate = useNavigate();
  const { avisar } = useToast();

  async function salvar(dados, arquivo) {
    const manga = await criarManga(dados);
    if (arquivo) {
      try {
        await enviarCapa(manga.id, arquivo);
      } catch (error) {
        // O mangá já existe: em vez de repetir o cadastro, leva à edição para tentar a capa de novo.
        avisar(`Mangá cadastrado, mas a capa não foi enviada: ${mensagemDaApi(error, "tente novamente.")}`, "erro");
        navigate(`/manga/${manga.id}/editar`);
        return;
      }
    }
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
