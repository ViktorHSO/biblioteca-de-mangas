import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listarMangas } from "../api/mangas";
import Capa from "./Capa";
import IconeLupa from "./IconeLupa";

const ESPERA_MS = 250;
const MAXIMO_RESULTADOS = 8;

// Janela de busca aberta pelo botão do cabeçalho ou pelo atalho Ctrl+K (Cmd+K no Mac).
export default function BuscaRapida({ aberta, aoFechar }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (aberta && !dialog.open) dialog.showModal();
    if (!aberta && dialog.open) dialog.close();
  }, [aberta]);

  return (
    <dialog
      ref={dialogRef}
      onClose={aoFechar}
      onClick={(evento) => evento.target === dialogRef.current && aoFechar()}
      aria-label="Busca rápida"
      className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-lg border border-white/10 bg-surface p-0 text-paper backdrop:bg-black/70"
    >
      {/* O conteúdo só existe com a janela aberta: cada abertura começa com a busca limpa. */}
      {aberta && <ConteudoBusca aoFechar={aoFechar} />}
    </dialog>
  );
}

function ConteudoBusca({ aoFechar }) {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState({ termo: "", itens: [], total: 0, erro: false });
  const [selecionado, setSelecionado] = useState(0);
  const termo = texto.trim();

  useEffect(() => {
    if (!termo) return undefined;
    let ativo = true;
    const timer = setTimeout(() => {
      listarMangas({ titulo: termo, ordenar: "populares", limit: MAXIMO_RESULTADOS })
        .then((dados) => ativo && setBusca({ termo, itens: dados.itens, total: dados.total, erro: false }))
        .catch(() => ativo && setBusca({ termo, itens: [], total: 0, erro: true }));
    }, ESPERA_MS);
    // Cancela a espera e ignora a resposta de um termo antigo.
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [termo]);

  const atualizada = busca.termo === termo;
  const itens = termo && atualizada ? busca.itens : [];
  const indice = Math.min(selecionado, Math.max(itens.length - 1, 0));

  function abrir(caminho) {
    aoFechar();
    navigate(caminho);
  }

  function aoTeclar(evento) {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      if (itens.length === 0) return;
      const passo = evento.key === "ArrowDown" ? 1 : -1;
      setSelecionado((indice + passo + itens.length) % itens.length);
    } else if (evento.key === "Enter" && itens[indice]) {
      evento.preventDefault();
      abrir(`/manga/${itens[indice].id}`);
    }
  }

  return (
    <div onKeyDown={aoTeclar}>
      <div className="flex items-center gap-3 border-b border-white/10 px-4">
        <IconeLupa className="h-5 w-5 shrink-0 text-paper/40" />
        <input
          autoFocus
          type="text"
          enterKeyHint="search"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setSelecionado(0);
          }}
          placeholder="Buscar mangá pelo título..."
          maxLength={100}
          aria-label="Buscar mangá pelo título"
          aria-controls="resultados-busca-rapida"
          className="w-full bg-transparent py-4 text-paper placeholder:text-paper/40 focus:outline-none"
        />
        <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-paper/40">Esc</kbd>
      </div>

      <div id="resultados-busca-rapida" className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
        {!termo && <p className="px-3 py-6 text-center text-sm text-paper/40">Digite para buscar no catálogo.</p>}
        {termo && !atualizada && <p className="px-3 py-6 text-center text-sm text-paper/40">Buscando...</p>}
        {termo && atualizada && busca.erro && (
          <p className="px-3 py-6 text-center text-sm text-red-400">Não foi possível buscar agora.</p>
        )}
        {termo && atualizada && !busca.erro && itens.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-paper/50">Nenhum mangá encontrado.</p>
        )}

        {itens.length > 0 && (
          <ul role="listbox" aria-label="Resultados">
            {itens.map((manga, posicao) => (
              <li key={manga.id} role="option" aria-selected={posicao === indice}>
                <Link
                  to={`/manga/${manga.id}`}
                  onClick={aoFechar}
                  onMouseEnter={() => setSelecionado(posicao)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 ${posicao === indice ? "bg-white/10" : ""}`}
                >
                  <Capa manga={manga} className="aspect-[3/4] w-9 shrink-0 rounded-sm" />
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-paper">{manga.titulo}</span>
                    <span className="text-xs capitalize text-paper/50">
                      {manga.tipo}
                      {manga.autor && ` · ${manga.autor}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {busca.total > itens.length && itens.length > 0 && (
          <button
            type="button"
            onClick={() => abrir(`/series?busca=${encodeURIComponent(termo)}`)}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-accent hover:bg-white/5"
          >
            Ver todos os {busca.total} resultados →
          </button>
        )}
      </div>

      <p className="border-t border-white/10 px-4 py-2 text-[11px] text-paper/40">
        ↑ ↓ para navegar · Enter para abrir · Esc para fechar
      </p>
    </div>
  );
}
