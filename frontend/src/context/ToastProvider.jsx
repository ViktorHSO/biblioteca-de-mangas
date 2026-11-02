import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toasts";

const DURACAO_MS = 4000;

const ESTILOS = {
  sucesso: "border-status-concluido/60",
  erro: "border-red-500/60",
};

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const proximoId = useRef(0);

  const fechar = useCallback((id) => {
    setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id));
  }, []);

  const avisar = useCallback(
    (mensagem, tipo = "sucesso") => {
      proximoId.current += 1;
      const id = proximoId.current;
      setAvisos((atuais) =>
        // Ignora um aviso repetido que ainda está na tela; mostra no máximo 3 de cada vez.
        atuais.some((aviso) => aviso.mensagem === mensagem) ? atuais : [...atuais.slice(-2), { id, mensagem, tipo }],
      );
      setTimeout(() => fechar(id), DURACAO_MS);
    },
    [fechar],
  );

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {/* aria-live: leitores de tela anunciam o aviso sem tirar o foco do usuário. */}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            role={aviso.tipo === "erro" ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-md border-l-4 bg-surface px-4 py-3 text-sm text-paper shadow-xl ${ESTILOS[aviso.tipo] ?? ESTILOS.sucesso}`}
          >
            <span>{aviso.mensagem}</span>
            <button
              type="button"
              onClick={() => fechar(aviso.id)}
              aria-label="Fechar aviso"
              className="text-paper/40 hover:text-paper"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
