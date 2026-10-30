import { useEffect, useRef } from "react";

export default function ConfirmDialog({ aberto, titulo, mensagem, textoConfirmar, onConfirmar, onCancelar }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancelar}
      className="m-auto w-full max-w-sm rounded-lg border border-white/10 bg-surface p-6 text-paper backdrop:bg-black/70"
    >
      <h2 className="font-display text-xl">{titulo}</h2>
      <p className="mt-2 text-sm text-paper/70">{mensagem}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-md px-4 py-2 text-sm text-paper/70 transition-colors hover:text-paper"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="rounded-md bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
        >
          {textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
