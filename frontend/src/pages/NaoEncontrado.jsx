import { Link } from "react-router-dom";
import { useIdioma } from "../context/useIdioma";

export default function NaoEncontrado({ mensagem }) {
  const { t } = useIdioma();
  return (
    <section className="py-16 text-center">
      <p className="font-display text-6xl text-accent">404</p>
      <p className="mt-3 text-paper/70">{mensagem ?? t("nao.pagina")}</p>
      <Link to="/" className="mt-6 inline-block text-sm text-paper/60 underline hover:text-paper">
        {t("comum.voltarInicio")}
      </Link>
    </section>
  );
}
