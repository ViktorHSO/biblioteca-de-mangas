export const classeCampo =
  "w-full rounded-md border border-black/60 bg-surface px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent";

export function ehUrlHttp(texto) {
  return /^https?:\/\/\S+$/i.test(texto ?? "");
}
