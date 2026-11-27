import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listarGeneros, listarMangas } from "../api/mangas";
import { GradeEsqueleto } from "../components/Esqueleto";
import MangaCard from "../components/MangaCard";
import Paginacao from "../components/Paginacao";
import { useIdioma } from "../context/useIdioma";
import useCarregamento from "../hooks/useCarregamento";
import { classeCampo } from "../utils/formulario";
import { ORDENACOES, STATUS, TIPOS } from "../utils/opcoes";
import { lerOpcao, lerPagina } from "../utils/url";

const POR_PAGINA = 24;
const ESPERA_BUSCA_MS = 400;

// Copia os parâmetros da URL trocando um filtro. Filtro novo sempre volta para a primeira página.
function comFiltro(atuais, chave, valor) {
  const novos = new URLSearchParams(atuais);
  if (valor) novos.set(chave, valor);
  else novos.delete(chave);
  novos.delete("pagina");
  return novos;
}

export default function Series() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useIdioma();

  // Os filtros moram na URL: dá para compartilhar o link, recarregar e usar o "voltar" do navegador.
  const busca = (searchParams.get("busca") ?? "").slice(0, 100);
  const genero = (searchParams.get("genero") ?? "").slice(0, 100);
  const status = lerOpcao(searchParams, "status", STATUS);
  const tipo = lerOpcao(searchParams, "tipo", TIPOS);
  const ordenar = lerOpcao(searchParams, "ordenar", ORDENACOES) || "recentes";
  const pagina = lerPagina(searchParams);

  const { dados: generos } = useCarregamento(listarGeneros);
  const { dados, erro, carregando } = useCarregamento(
    useCallback(
      () =>
        listarMangas({
          titulo: busca,
          genero,
          status,
          tipo,
          ordenar,
          skip: (pagina - 1) * POR_PAGINA,
          limit: POR_PAGINA,
        }),
      [busca, genero, status, tipo, ordenar, pagina],
    ),
  );

  function alterarFiltro(chave, valor) {
    setSearchParams((atuais) => comFiltro(atuais, chave, valor));
  }

  // O campo de busca tem estado próprio e só vai para a URL depois de uma pausa na digitação (debounce).
  const [texto, setTexto] = useState(busca);
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  if (busca !== buscaAnterior) {
    // A URL mudou por fora (ex.: botão "voltar"): o campo acompanha.
    setBuscaAnterior(busca);
    setTexto(busca);
  }

  useEffect(() => {
    const valor = texto.trim();
    if (valor === busca) return undefined;
    const timer = setTimeout(() => setSearchParams((atuais) => comFiltro(atuais, "busca", valor)), ESPERA_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [texto, busca, setSearchParams]);

  function mudarPagina(nova) {
    setSearchParams((atuais) => {
      const novos = new URLSearchParams(atuais);
      if (nova > 1) novos.set("pagina", String(nova));
      else novos.delete("pagina");
      return novos;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const temFiltro = busca || genero || status || tipo;
  const totalPaginas = dados ? Math.ceil(dados.total / POR_PAGINA) : 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl text-paper">{t("series.titulo")}</h1>
        {dados && (
          <p className="text-sm text-paper/50">
            {t("series.encontradas", { n: dados.total })}
          </p>
        )}
      </header>

      <form
        role="search"
        onSubmit={(evento) => evento.preventDefault()}
        className="grid gap-3 rounded-md border border-white/5 bg-surface/60 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
      >
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="sr-only">{t("series.buscarRotulo")}</span>
          <input
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder={t("series.buscar")}
            maxLength={100}
            className={classeCampo}
          />
        </label>
        <Filtro
          rotulo={t("series.genero")}
          valor={genero}
          aoMudar={(v) => alterarFiltro("genero", v)}
          opcoes={(generos ?? []).map((nome) => ({ valor: nome, rotulo: nome }))}
        />
        <Filtro
          rotulo={t("series.status")}
          valor={status}
          aoMudar={(v) => alterarFiltro("status", v)}
          opcoes={STATUS.map((valor) => ({ valor, rotulo: t(`status.${valor}`) }))}
        />
        <Filtro
          rotulo={t("series.tipo")}
          valor={tipo}
          aoMudar={(v) => alterarFiltro("tipo", v)}
          opcoes={TIPOS.map((valor) => ({ valor, rotulo: t(`tipo.${valor}`) }))}
        />
        <label>
          <span className="sr-only">{t("series.ordenar")}</span>
          <select
            value={ordenar}
            onChange={(evento) => alterarFiltro("ordenar", evento.target.value === "recentes" ? "" : evento.target.value)}
            className={classeCampo}
          >
            {ORDENACOES.map((valor) => (
              <option key={valor} value={valor}>
                {t(`ordenar.${valor}`)}
              </option>
            ))}
          </select>
        </label>
      </form>

      {temFiltro && (
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className="text-sm text-paper/60 underline hover:text-paper"
        >
          {t("series.limpar")}
        </button>
      )}

      {erro && <p className="text-red-400">{t("erro.catalogo")}</p>}
      {!dados && !erro && <GradeEsqueleto />}

      {dados && (
        <div className={`space-y-8 transition-opacity ${carregando ? "opacity-50" : ""}`} aria-busy={carregando}>
          {dados.itens.length === 0 ? (
            <p className="py-12 text-center text-paper/50">{t("series.nenhuma")}</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {dados.itens.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          )}
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} aoMudar={mudarPagina} />
        </div>
      )}
    </section>
  );
}

function Filtro({ rotulo, valor, aoMudar, opcoes }) {
  const { t } = useIdioma();
  // Um gênero vindo da URL em outro idioma (ex.: "Acción" com o site em inglês) continua
  // funcionando na busca; ele entra na lista para o campo não aparecer vazio.
  const lista = valor && !opcoes.some((opcao) => opcao.valor === valor) ? [{ valor, rotulo: valor }, ...opcoes] : opcoes;
  return (
    <label>
      <span className="sr-only">{rotulo}</span>
      <select value={valor} onChange={(evento) => aoMudar(evento.target.value)} className={`${classeCampo} capitalize`}>
        <option value="">{t("series.todos", { rotulo })}</option>
        {lista.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}
