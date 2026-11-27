import { useIdioma } from "../context/useIdioma";

export default function Footer() {
  const { t } = useIdioma();
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-paper/40 sm:flex-row md:px-6">
        <span>{t("footer.descricao")}</span>
        <a
          href="https://github.com/ViktorHSO/biblioteca-de-mangas"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-paper"
        >
          {t("footer.github")}
        </a>
      </div>
    </footer>
  );
}
