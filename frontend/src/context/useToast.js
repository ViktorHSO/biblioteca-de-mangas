import { useContext } from "react";
import { ToastContext } from "./toasts";

// avisar("Mangá salvo.") ou avisar("Algo deu errado.", "erro")
export function useToast() {
  return useContext(ToastContext);
}
