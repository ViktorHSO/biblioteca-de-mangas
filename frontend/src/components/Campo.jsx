export default function Campo({ rotulo, erro, dica, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-paper/80">{rotulo}</span>
      {children}
      {dica && !erro && <span className="mt-1 block text-xs text-paper/40">{dica}</span>}
      {erro && <span className="mt-1 block text-xs text-red-400">{erro}</span>}
    </label>
  );
}
