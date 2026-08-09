import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarMangas } from "../api/mangas";
import MangaCard from "../components/MangaCard";

export default function Home() {
  const [mangas, setMangas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarMangas()
      .then((data) => setMangas(data.itens))
      .catch(() => setErro("Não foi possível carregar os mangás. A API está rodando?"))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-paper">Minha Biblioteca de Mangás</h1>
          <p className="text-paper/60 mt-1">Sua estante pessoal, organizada por status de leitura.</p>
        </div>
        <Link
          to="/novo"
          className="bg-accent text-base font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          + Novo mangá
        </Link>
      </header>

      {carregando && <p className="text-paper/60">Carregando...</p>}
      {erro && <p className="text-status-concluido/80">{erro}</p>}

      {!carregando && !erro && mangas.length === 0 && (
        <p className="text-paper/60">Nenhum mangá cadastrado ainda.</p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
        {mangas.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    </div>
  );
}