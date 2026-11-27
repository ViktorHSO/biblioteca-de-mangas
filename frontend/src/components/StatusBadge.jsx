import { useIdioma } from "../context/useIdioma";

const COLORS = {
  "quero ler": "bg-status-quero",
  "lendo": "bg-status-lendo",
  "concluído": "bg-status-concluido",
};

export default function StatusBadge({ status }) {
  const { t } = useIdioma();
  return (
    <span
      className={`${COLORS[status] ?? "bg-status-quero"} text-base text-xs font-semibold px-2 py-1 rounded-sm inline-block shadow-md`}
    >
      {status ? t(`status.${status}`) : null}
    </span>
  );
}