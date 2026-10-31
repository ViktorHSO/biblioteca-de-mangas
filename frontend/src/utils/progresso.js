// Guarda, por mangá, o último capítulo aberto no leitor (só neste navegador).
// O try/catch cobre navegadores que bloqueiam o localStorage.
const CHAVE = "biblioteca:progresso";

function lerTudo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) ?? {};
  } catch {
    return {};
  }
}

export function salvarProgresso(mangaId, capitulo) {
  try {
    const progresso = lerTudo();
    progresso[mangaId] = { capituloId: capitulo.id, numero: capitulo.numero };
    localStorage.setItem(CHAVE, JSON.stringify(progresso));
  } catch {
    // sem armazenamento disponível: o progresso simplesmente não é lembrado
  }
}

export function lerProgresso(mangaId) {
  return lerTudo()[mangaId] ?? null;
}
