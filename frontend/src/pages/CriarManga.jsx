import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { criarManga } from "../api/mangas";

const STATUS_OPCOES = ["quero ler", "lendo", "concluído"];

export default function CriarManga() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    genero: "",
    sinopse: "",
    status: "quero ler",
    capa_url: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await criarManga(form);
      navigate("/");
    } catch {
      setErro("Não foi possível salvar. Confere se o título foi preenchido e se a API está no ar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-paper">Novo mangá</h1>
        <p className="text-paper/60 mt-1">Adicione uma obra à sua estante.</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-paper/80 text-sm mb-1">Título *</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
            className="w-full bg-surface border border-black/60 rounded-md px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-paper/80 text-sm mb-1">Autor</label>
          <input
            name="autor"
            value={form.autor}
            onChange={handleChange}
            className="w-full bg-surface border border-black/60 rounded-md px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-paper/80 text-sm mb-1">Gênero</label>
          <input
            name="genero"
            value={form.genero}
            onChange={handleChange}
            className="w-full bg-surface border border-black/60 rounded-md px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-paper/80 text-sm mb-1">Sinopse</label>
          <textarea
            name="sinopse"
            value={form.sinopse}
            onChange={handleChange}
            rows={4}
            className="w-full bg-surface border border-black/60 rounded-md px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-paper/80 text-sm mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full bg-surface border border-black/60 rounded-md px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-paper/80 text-sm mb-1">URL da capa</label>
          <input
            name="capa_url"
            value={form.capa_url}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full bg-surface border border-black/60 rounded-md px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {erro && <p className="text-status-concluido/90 text-sm">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="bg-accent text-base font-semibold px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {enviando ? "Salvando..." : "Salvar mangá"}
        </button>
      </form>
    </div>
  );
}