import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { useIdioma } from "../context/useIdioma";
import { classeCampo } from "../utils/formulario";

function chaveDoErro(error) {
  const status = error.response?.status;
  if (status === 401) return "login.invalido";
  if (status === 429) return "login.muitas";
  return "login.falhou";
}

export default function Login() {
  const { login, logado } = useAuth();
  const { avisar } = useToast();
  const { t } = useIdioma();
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
      avisar(t("login.bemVindo", { usuario }));
      navigate(destino, { replace: true });
    } catch (error) {
      setErro(chaveDoErro(error));
      setSenha("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm pt-8">
      <h1 className="font-display text-3xl text-paper">{t("login.titulo")}</h1>
      <p className="mt-1 text-sm text-paper/60">{t("login.descricao")}</p>

      <form onSubmit={entrar} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-paper/80">{t("login.usuario")}</span>
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
          <span className="mb-1 block text-sm text-paper/80">{t("login.senha")}</span>
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

        {erro && <p className="text-sm text-red-400">{t(erro)}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-accent px-5 py-2 font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? t("login.entrando") : t("login.titulo")}
        </button>
      </form>
    </section>
  );
}
