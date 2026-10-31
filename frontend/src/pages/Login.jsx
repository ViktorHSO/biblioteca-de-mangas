import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { classeCampo } from "../utils/formulario";

function mensagemDeErro(error) {
  const status = error.response?.status;
  if (status === 401) return "Usuário ou senha inválidos.";
  if (status === 429) return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
  return "Não foi possível entrar. Confira se a API está no ar.";
}

export default function Login() {
  const { login, logado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const destino = location.state?.voltarPara ?? "/";

  if (logado) return <Navigate to={destino} replace />;

  async function entrar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await login(usuario, senha);
      navigate(destino, { replace: true });
    } catch (error) {
      setErro(mensagemDeErro(error));
      setSenha("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm pt-8">
      <h1 className="font-display text-3xl text-paper">Entrar</h1>
      <p className="mt-1 text-sm text-paper/60">Área do administrador da biblioteca.</p>

      <form onSubmit={entrar} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-paper/80">Usuário</span>
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            required
            maxLength={50}
            className={classeCampo}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-paper/80">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={128}
            className={classeCampo}
          />
        </label>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-accent px-5 py-2 font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}
