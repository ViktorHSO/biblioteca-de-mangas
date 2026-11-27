import { useIdioma } from "../context/useIdioma";
import { IDIOMAS } from "../i18n/idioma";

// Troca o idioma do site inteiro: textos da interface e título, sinopse e gêneros dos mangás.
// Fechado, mostra só a sigla (PT/EN/ES); a lista aberta tem o nome de cada idioma.
// O <select> nativo fica invisível por cima do botão: continua acessível pelo teclado e leitores de tela.
export default function SeletorIdioma() {
  const { idioma, trocarIdioma, t } = useIdioma();
  const atual = IDIOMAS.find((opcao) => opcao.codigo === idioma);

  return (
    <label
      title={t("idioma.rotulo")}
      className="relative flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-sm text-paper/70 transition-colors focus-within:ring-2 focus-within:ring-accent hover:border-accent hover:text-paper"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9M12 3C9.5 5.5 8.2 8.5 8.2 12s1.3 6.5 3.8 9" />
      </svg>
      <span aria-hidden="true">{atual?.sigla}</span>
      <select
        value={idioma}
        onChange={(evento) => trocarIdioma(evento.target.value)}
        aria-label={t("idioma.rotulo")}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {IDIOMAS.map((opcao) => (
          <option key={opcao.codigo} value={opcao.codigo} lang={opcao.codigo} className="bg-surface text-paper">
            {opcao.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
