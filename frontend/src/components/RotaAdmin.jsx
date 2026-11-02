import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { FormularioEsqueleto } from "./Esqueleto";

export default function RotaAdmin({ children }) {
  const { logado, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return <FormularioEsqueleto />;
  }
  if (!logado) {
    return <Navigate to="/login" replace state={{ voltarPara: location.pathname }} />;
  }
  return children;
}
