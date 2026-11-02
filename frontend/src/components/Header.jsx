import { useCallback, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import useAtalhoBusca from "../hooks/useAtalhoBusca";
import BuscaRapida from "./BuscaRapida";
import IconeLupa from "./IconeLupa";

const LINKS = [
  { para: "/", texto: "Início" },
  { para: "/series", texto: "Séries" },
  { para: "/ranking", texto: "Ranking" },
  { para: "/capitulos", texto: "Lançamentos" },
];

function classeDoLink({ isActive }) {
  return `text-sm transition-colors ${isActive ? "text-accent" : "text-paper/70 hover:text-paper"}`;
}

export default function Header() {
  const { usuario, logado, logout } = useAuth();
  const navigate = useNavigate();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const abrirBusca = useCallback(() => setBuscaAberta(true), []);
  useAtalhoBusca(abrirBusca);

  function sair() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3 md:px-6">
        <Link to="/" className="font-display text-xl text-paper">
          Biblioteca <span className="text-accent">de Mangás</span>
        </Link>
        {/* Em telas pequenas o menu desce para uma segunda linha, com rolagem lateral se precisar. */}
        <nav
          className="order-last flex w-full items-center gap-5 overflow-x-auto md:order-none md:w-auto md:flex-1"
          aria-label="Principal"
        >
          {LINKS.map((link) => (
            <NavLink key={link.para} to={link.para} end={link.para === "/"} className={classeDoLink}>
              {link.texto}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={abrirBusca}
            aria-label="Buscar (Ctrl+K)"
            className="flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1.5 text-sm text-paper/60 transition-colors hover:border-accent hover:text-paper"
          >
            <IconeLupa />
            <span className="hidden lg:inline">Buscar</span>
            <kbd className="hidden rounded border border-white/10 px-1 text-[10px] text-paper/40 lg:inline">Ctrl K</kbd>
          </button>
          {logado ? (
            <>
              <Link
                to="/novo"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
              >
                + Novo mangá
              </Link>
              <span className="hidden text-sm text-paper/60 sm:inline">{usuario.usuario}</span>
              <button
                type="button"
                onClick={sair}
                className="text-sm text-paper/70 transition-colors hover:text-paper"
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-paper/70 transition-colors hover:text-paper">
              Entrar
            </Link>
          )}
        </div>
      </div>
      <BuscaRapida aberta={buscaAberta} aoFechar={() => setBuscaAberta(false)} />
    </header>
  );
}
