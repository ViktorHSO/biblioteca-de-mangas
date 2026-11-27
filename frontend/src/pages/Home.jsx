import { Link } from "react-router-dom";
import { listarAtualizados, listarDestaques, listarMangas, listarRanking } from "../api/mangas";
import EmAlta from "../components/home/EmAlta";
import CarrosselDestaques from "../components/home/CarrosselDestaques";
import { HomeEsqueleto } from "../components/Esqueleto";
import NovosCapitulos from "../components/home/NovosCapitulos";
import MangaCard from "../components/MangaCard";
import Secao from "../components/Secao";
import { useAuth } from "../context/useAuth";
import { useIdioma } from "../context/useIdioma";
import useCarregamento from "../hooks/useCarregamento";

// As quatro seções vêm de rotas diferentes da API, buscadas em paralelo.
async function carregarHome() {
  const [destaques, atualizados, emAlta, recentes] = await Promise.all([
    listarDestaques(),
    listarAtualizados(10),
    listarRanking(3),
    listarMangas({ ordenar: "recentes", limit: 12 }),
  ]);
  return { destaques, atualizados, emAlta, recentes: recentes.itens };
}

export default function Home() {
  const { logado } = useAuth();
  const { t } = useIdioma();
  const { dados, erro, carregando } = useCarregamento(carregarHome);

  if (erro) return <p className="text-red-400">{t("erro.pagina")}</p>;
  if (carregando && !dados) return <HomeEsqueleto />;

  if (dados.recentes.length === 0) {
    return (
      <section className="py-16 text-center">
        <h1 className="font-display text-3xl text-paper">{t("home.vazia")}</h1>
        <p className="mt-2 text-paper/60">{t("comum.nenhumManga")}</p>
        {logado && (
          <Link to="/novo" className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base">
            {t("home.cadastrarPrimeiro")}
          </Link>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-12">
      <h1 className="sr-only">{t("app.nome")}</h1>
      <CarrosselDestaques mangas={dados.destaques} />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <Secao titulo={t("home.novosCapitulos")} link="/capitulos">
          <NovosCapitulos mangas={dados.atualizados} />
        </Secao>
        <Secao titulo={t("home.emAlta")} link="/ranking" textoLink={t("nav.ranking")}>
          <EmAlta mangas={dados.emAlta} />
        </Secao>
      </div>

      <Secao titulo={t("home.adicionados")} link="/series" textoLink={t("home.verCatalogo")}>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {dados.recentes.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </Secao>
    </div>
  );
}
