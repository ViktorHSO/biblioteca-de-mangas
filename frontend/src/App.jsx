import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RotaAdmin from "./components/RotaAdmin";
import CriarManga from "./pages/CriarManga";
import EditarManga from "./pages/EditarManga";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MangaDetalhe from "./pages/MangaDetalhe";
import NaoEncontrado from "./pages/NaoEncontrado";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manga/:id" element={<MangaDetalhe />} />
        <Route path="/novo" element={<RotaAdmin><CriarManga /></RotaAdmin>} />
        <Route path="/manga/:id/editar" element={<RotaAdmin><EditarManga /></RotaAdmin>} />
        <Route path="*" element={<NaoEncontrado />} />
      </Route>
    </Routes>
  );
}
