import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RotaAdmin({ children }) {
  const { logado, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return <p className="text-paper/60">Carregando...</p>;
  }
  if (!logado) {
    return <Navigate to="/login" replace state={{ voltarPara: location.pathname }} />;
  }
  return children;
}
