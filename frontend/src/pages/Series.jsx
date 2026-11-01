import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listarGeneros, listarMangas } from "../api/mangas";
import MangaCard from "../components/MangaCard";
import Paginacao from "../components/Paginacao";
import useCarregamento from "../hooks/useCarregamento";
import { classeCampo } from "../utils/formulario";
import { ORDENACOES, STATUS, TIPOS } from "../utils/opcoes";
import { lerOpcao, lerPagina } from "../utils/url";

const POR_PAGINA = 24;
const ESPERA_BUSCA_MS = 400;
const VALORES_ORDENACAO = ORDENACOES.map((opcao) => opcao.valor);

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

  // Os filtros moram na URL: dá para compartilhar o link, recarregar e usar o "voltar" do navegador.
  const busca = (searchParams.get("busca") ?? "").slice(0, 100);
  const genero = (searchParams.get("genero") ?? "").slice(0, 100);
  const status = lerOpcao(searchParams, "status", STATUS);
  const tipo = lerOpcao(searchParams, "tipo", TIPOS);
  const ordenar = lerOpcao(searchParams, "ordenar", VALORES_ORDENACAO) || "recentes";
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
        <h1 className="font-display text-3xl text-paper">Séries</h1>
        {dados && (
          <p className="text-sm text-paper/50">
            {dados.total} {dados.total === 1 ? "série encontrada" : "séries encontradas"}
          </p>
        )}
      </header>

      <form
        role="search"
        onSubmit={(evento) => evento.preventDefault()}
        className="grid gap-3 rounded-md border border-white/5 bg-surface/60 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
      >
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Buscar por título</span>
          <input
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Buscar por título..."
            maxLength={100}
            className={classeCampo}
          />
        </label>
        <Filtro rotulo="Gênero" valor={genero} aoMudar={(v) => alterarFiltro("genero", v)} opcoes={generos ?? []} />
        <Filtro rotulo="Status" valor={status} aoMudar={(v) => alterarFiltro("status", v)} opcoes={STATUS} />
        <Filtro rotulo="Tipo" valor={tipo} aoMudar={(v) => alterarFiltro("tipo", v)} opcoes={TIPOS} />
        <label>
          <span className="sr-only">Ordenar</span>
          <select
            value={ordenar}
            onChange={(evento) => alterarFiltro("ordenar", evento.target.value === "recentes" ? "" : evento.target.value)}
            className={classeCampo}
          >
            {ORDENACOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
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
          Limpar filtros
        </button>
      )}

      {erro && <p className="text-red-400">Não foi possível carregar o catálogo. A API está rodando?</p>}
      {!dados && !erro && <p className="text-paper/60">Carregando...</p>}

      {dados && (
        <div className={`space-y-8 transition-opacity ${carregando ? "opacity-50" : ""}`} aria-busy={carregando}>
          {dados.itens.length === 0 ? (
            <p className="py-12 text-center text-paper/50">Nenhuma série encontrada com esses filtros.</p>
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
  return (
    <label>
      <span className="sr-only">{rotulo}</span>
      <select value={valor} onChange={(evento) => aoMudar(evento.target.value)} className={`${classeCampo} capitalize`}>
        <option value="">{rotulo}: todos</option>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </label>
  );
}
