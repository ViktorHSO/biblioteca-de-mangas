import { useEffect, useState } from "react";
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
    <section>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-paper">Minha Biblioteca de Mangás</h1>
        <p className="mt-1 text-paper/60">Sua estante pessoal, organizada por status de leitura.</p>
      </header>

      {carregando && <p className="text-paper/60">Carregando...</p>}
      {erro && <p className="text-red-400">{erro}</p>}

      {!carregando && !erro && mangas.length === 0 && (
        <p className="text-paper/60">Nenhum mangá cadastrado ainda.</p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
        {mangas.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    </section>
  );
}
