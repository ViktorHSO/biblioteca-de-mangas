import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { criarCapitulo, enviarPaginas } from "../api/capitulos";
import { buscarManga } from "../api/mangas";
import CapituloForm from "../components/CapituloForm";
import { FormularioEsqueleto } from "../components/Esqueleto";
import { useToast } from "../context/useToast";
import { useIdioma } from "../context/useIdioma";
import { mensagemDaApi } from "../utils/erros";
import NaoEncontrado from "./NaoEncontrado";

export default function NovoCapitulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useToast();
  const { t } = useIdioma();
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
        avisar(t("novoCap.falhaPaginas", { erro: mensagemDaApi(error, t("comum.tenteNovamente")) }), "erro");
        navigate(`/capitulo/${capitulo.id}/editar`);
        return;
      }
    }
    avisar(t("novoCap.sucesso", { numero: capitulo.numero }));
    navigate(`/capitulo/${capitulo.id}`);
  }

  if (erro === 404) return <NaoEncontrado mensagem={t("nao.manga")} />;
  if (erro) return <p className="text-red-400">{t("erro.manga")}</p>;
  if (!manga) return <FormularioEsqueleto />;

  // Sugere o número seguinte ao maior já cadastrado (a lista vem do mais novo ao mais antigo).
  const proximoNumero = (manga.capitulos[0]?.numero ?? 0) + 1;

  return (
    <section>
      <header className="mb-6">
        <Link to={`/manga/${id}`} className="text-sm text-paper/50 hover:text-paper">
          ← {manga.titulo}
        </Link>
        <h1 className="mt-2 font-display text-3xl text-paper">{t("novoCap.titulo")}</h1>
      </header>
      <CapituloForm valoresIniciais={{ numero: proximoNumero }} textoBotao={t("novoCap.salvar")} onSalvar={salvar} />
    </section>
  );
}
