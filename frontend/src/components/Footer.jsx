export default function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-paper/40 sm:flex-row md:px-6">
        <span>Biblioteca de Mangás · catálogo pessoal</span>
        <a
          href="https://github.com/ViktorHSO/biblioteca-de-mangas"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-paper"
        >
          Código no GitHub
        </a>
      </div>
    </footer>
  );
}
