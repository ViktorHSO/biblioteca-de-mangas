import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { criarCapitulo, enviarPaginas } from "../api/capitulos";
import { buscarManga } from "../api/mangas";
import CapituloForm from "../components/CapituloForm";
import { FormularioEsqueleto } from "../components/Esqueleto";
import { useToast } from "../context/useToast";
import { mensagemDaApi } from "../utils/erros";
import NaoEncontrado from "./NaoEncontrado";

export default function NovoCapitulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useToast();
  const [manga, setManga] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarManga(id)
      .then(setManga)
      .catch((error) => setErro(error.response?.status === 404 ? 404 : "erro"));
  }, [id]);

  async function salvar(dados, arquivos, aoProgredir) {
    const capitulo = await criarCapitulo({ ...dados, manga_id: Number(id) });
    if (arquivos.length) {
      try {
        await enviarPaginas(capitulo.id, arquivos, aoProgredir);
      } catch (error) {
        // O capítulo já existe: em vez de repetir o cadastro, leva à edição para enviar o que faltou.
        avisar(`Capítulo cadastrado, mas nem todas as páginas foram enviadas: ${mensagemDaApi(error, "tente novamente.")}`, "erro");
        navigate(`/capitulo/${capitulo.id}/editar`);
        return;
      }
    }
    avisar(`Capítulo ${capitulo.numero} cadastrado.`);
    navigate(`/capitulo/${capitulo.id}`);
  }

  if (erro === 404) return <NaoEncontrado mensagem="Mangá não encontrado." />;
  if (erro) return <p className="text-red-400">Não foi possível carregar o mangá.</p>;
  if (!manga) return <FormularioEsqueleto />;

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
