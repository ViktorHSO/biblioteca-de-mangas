import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function classeDoLink({ isActive }) {
  return `text-sm transition-colors ${isActive ? "text-accent" : "text-paper/70 hover:text-paper"}`;
}

export default function Header() {
  const { usuario, logado, logout } = useAuth();
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl text-paper">
            Biblioteca <span className="text-accent">de Mangás</span>
          </Link>
          <nav className="flex items-center gap-5">
            <NavLink to="/" end className={classeDoLink}>
              Início
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
    </header>
  );
}
