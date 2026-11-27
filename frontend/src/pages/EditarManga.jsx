import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { atualizarManga, buscarMangaParaEdicao, enviarCapa } from "../api/mangas";
import { FormularioEsqueleto } from "../components/Esqueleto";
import MangaForm from "../components/MangaForm";
import { useToast } from "../context/useToast";
import { useIdioma } from "../context/useIdioma";

export default function EditarManga() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useToast();
  const { t } = useIdioma();
  const [manga, setManga] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    // Os dados de edição vêm como foram cadastrados (texto original + traduções), não no idioma do site.
    buscarMangaParaEdicao(id)
      .then(setManga)
      .catch((error) => setErro(error.response?.status === 404 ? "nao.manga" : "erro.manga"));
  }, [id]);

  async function salvar(dados, arquivo) {
    await atualizarManga(id, dados);
    if (arquivo) await enviarCapa(id, arquivo);
    avisar(t("comum.alteracoesSalvas"));
    navigate(`/manga/${id}`);
  }

  if (erro) return <p className="text-red-400">{t(erro)}</p>;
  if (!manga) return <FormularioEsqueleto />;

  return (
    <section>
      <header className="mb-6">
        <Link to={`/manga/${id}`} className="text-sm text-paper/50 hover:text-paper">
          {t("editar.voltar")}
        </Link>
        <h1 className="mt-2 font-display text-3xl text-paper">{t("editar.titulo")}</h1>
      </header>
      <MangaForm valoresIniciais={manga} textoBotao={t("comum.salvarAlteracoes")} onSalvar={salvar} />
    </section>
  );
}
