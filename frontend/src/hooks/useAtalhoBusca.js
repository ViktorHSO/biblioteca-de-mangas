import { useEffect } from "react";

// Ctrl+K (ou Cmd+K no Mac) chama `abrir`. O preventDefault evita que o navegador
// use o atalho para focar a barra de endereço.
export default function useAtalhoBusca(abrir) {
  useEffect(() => {
    function aoApertarTecla(evento) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        abrir();
      }
    }
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, [abrir]);
}
