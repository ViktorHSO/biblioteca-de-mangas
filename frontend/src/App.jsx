import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CriarManga from "./pages/CriarManga";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/novo" element={<CriarManga />} />
    </Routes>
  );
}