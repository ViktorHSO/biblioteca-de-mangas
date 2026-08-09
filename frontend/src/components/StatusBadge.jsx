const LABELS = {
  "quero ler": "Quero ler",
  "lendo": "Lendo",
  "concluído": "Concluído",
};

const COLORS = {
  "quero ler": "bg-status-quero",
  "lendo": "bg-status-lendo",
  "concluído": "bg-status-concluido",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`${COLORS[status] ?? "bg-status-quero"} text-base text-xs font-semibold px-2 py-1 rounded-sm inline-block shadow-md`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}