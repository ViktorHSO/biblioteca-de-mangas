import { useNavigate } from "react-router-dom";
import { criarManga, enviarCapa } from "../api/mangas";
import MangaForm from "../components/MangaForm";
import { useToast } from "../context/useToast";
import { useIdioma } from "../context/useIdioma";
import { mensagemDaApi } from "../utils/erros";

export default function CriarManga() {
  const navigate = useNavigate();
  const { avisar } = useToast();
  const { t } = useIdioma();

  async function salvar(dados, arquivo) {
    const manga = await criarManga(dados);
    if (arquivo) {
      try {
        await enviarCapa(manga.id, arquivo);
      } catch (error) {
        // O mangá já existe: em vez de repetir o cadastro, leva à edição para tentar a capa de novo.
        avisar(t("criar.capaFalhou", { erro: mensagemDaApi(error, t("comum.tenteNovamente")) }), "erro");
        navigate(`/manga/${manga.id}/editar`);
        return;
      }
    }
    avisar(t("criar.sucesso"));
    navigate(`/manga/${manga.id}`);
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-paper">{t("criar.titulo")}</h1>
        <p className="mt-1 text-paper/60">{t("criar.descricao")}</p>
      </header>
      <MangaForm textoBotao={t("criar.salvar")} onSalvar={salvar} />
    </section>
  );
}
