import { useCallback, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
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

function classeDoLinkMobile({ isActive }) {
  return `block rounded-md px-3 py-2 ${isActive ? "bg-white/5 text-accent" : "text-paper/80 hover:bg-white/5"}`;
}

export default function Header() {
  const { usuario, logado, logout } = useAuth();
  const { avisar } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [buscaAberta, setBuscaAberta] = useState(false);
  // Guarda em qual página o menu foi aberto: ao navegar para outra, ele se fecha sozinho.
  const [menuAbertoEm, setMenuAbertoEm] = useState(null);
  const menuAberto = menuAbertoEm === pathname;

  const abrirBusca = useCallback(() => setBuscaAberta(true), []);
  useAtalhoBusca(abrirBusca);

  const fecharMenu = () => setMenuAbertoEm(null);

  function sair() {
    logout();
    fecharMenu();
    avisar("Você saiu da conta.");
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl text-paper">
            Biblioteca <span className="text-accent">de Mangás</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex" aria-label="Principal">
            {LINKS.map((link) => (
              <NavLink key={link.para} to={link.para} end={link.para === "/"} className={classeDoLink}>
                {link.texto}
              </NavLink>
            ))}
          </nav>
        </div>

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

          <div className="hidden items-center gap-3 md:flex">
            {logado ? (
              <>
                <Link
                  to="/novo"
                  className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-base transition-opacity hover:opacity-90"
                >
                  + Novo mangá
                </Link>
                <span className="text-sm text-paper/60">{usuario.usuario}</span>
                <button type="button" onClick={sair} className="text-sm text-paper/70 transition-colors hover:text-paper">
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-paper/70 transition-colors hover:text-paper">
                Entrar
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuAbertoEm(menuAberto ? null : pathname)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            aria-controls="menu-celular"
            className="rounded-md border border-white/10 p-1.5 text-paper/70 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
              {menuAberto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav id="menu-celular" aria-label="Menu" className="space-y-1 border-t border-white/5 px-4 py-3 md:hidden">
          {LINKS.map((link) => (
            <NavLink key={link.para} to={link.para} end={link.para === "/"} className={classeDoLinkMobile} onClick={fecharMenu}>
              {link.texto}
            </NavLink>
          ))}
          <div className="mt-2 border-t border-white/5 pt-2">
            {logado ? (
              <>
                <NavLink to="/novo" className={classeDoLinkMobile} onClick={fecharMenu}>
                  + Novo mangá
                </NavLink>
                <button type="button" onClick={sair} className="block w-full rounded-md px-3 py-2 text-left text-paper/80 hover:bg-white/5">
                  Sair ({usuario.usuario})
                </button>
              </>
            ) : (
              <NavLink to="/login" className={classeDoLinkMobile} onClick={fecharMenu}>
                Entrar
              </NavLink>
            )}
          </div>
        </nav>
      )}

      <BuscaRapida aberta={buscaAberta} aoFechar={() => setBuscaAberta(false)} />
    </header>
  );
}
