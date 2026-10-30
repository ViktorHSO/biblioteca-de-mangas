import { useState } from "react";
import { errosDeCampo } from "../utils/erros";

const STATUS = ["quero ler", "lendo", "concluído"];
const TIPOS = ["mangá", "manhwa", "manhua", "novel"];

const VAZIO = {
  titulo: "",
  autor: "",
  genero: "",
  sinopse: "",
  status: "quero ler",
  tipo: "mangá",
  capa_url: "",
  destaque: false,
};

function ehUrlHttp(texto) {
  return /^https?:\/\/\S+$/i.test(texto ?? "");
}

const classeCampo =
  "w-full rounded-md border border-black/60 bg-surface px-3 py-2 text-paper focus:outline-none focus:ring-2 focus:ring-accent";

function Campo({ rotulo, erro, dica, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-paper/80">{rotulo}</span>
      {children}
      {dica && !erro && <span className="mt-1 block text-xs text-paper/40">{dica}</span>}
      {erro && <span className="mt-1 block text-xs text-red-400">{erro}</span>}
    </label>
  );
}

export default function MangaForm({ valoresIniciais, textoBotao, onSalvar }) {
  const [form, setForm] = useState(() => ({ ...VAZIO, ...valoresIniciais }));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function alterar(e) {
    const { name, value, type, checked } = e.target;
    setForm((anterior) => ({ ...anterior, [name]: type === "checkbox" ? checked : value }));
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErros({});
    setErroGeral(null);
    try {
      // Envia só os campos do formulário: a API recusa campos extras (id, datas etc.).
      const dados = Object.fromEntries(Object.keys(VAZIO).map((campo) => [campo, form[campo]]));
      await onSalvar(dados);
    } catch (error) {
      const status = error.response?.status;
      if (status === 422) {
        setErros(errosDeCampo(error));
        setErroGeral("Confira os campos destacados.");
      } else if (status === 401) {
        setErroGeral("Sua sessão expirou. Entre novamente para salvar.");
      } else {
        setErroGeral("Não foi possível salvar. Confira se a API está no ar.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-6 md:grid-cols-[1fr_180px]">
      <div className="space-y-4">
        <Campo rotulo="Título *" erro={erros.titulo}>
          <input name="titulo" value={form.titulo} onChange={alterar} required maxLength={255} className={classeCampo} />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Autor" erro={erros.autor}>
            <input name="autor" value={form.autor ?? ""} onChange={alterar} maxLength={255} className={classeCampo} />
          </Campo>
          <Campo rotulo="Gêneros" erro={erros.genero} dica="Separe por vírgula. Ex.: Ação, Aventura">
            <input name="genero" value={form.genero ?? ""} onChange={alterar} maxLength={100} className={classeCampo} />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Tipo" erro={erros.tipo}>
            <select name="tipo" value={form.tipo} onChange={alterar} className={classeCampo}>
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Status" erro={erros.status}>
            <select name="status" value={form.status} onChange={alterar} className={classeCampo}>
              {STATUS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo rotulo="Sinopse" erro={erros.sinopse}>
          <textarea name="sinopse" value={form.sinopse ?? ""} onChange={alterar} rows={5} maxLength={5000} className={classeCampo} />
        </Campo>

        <Campo rotulo="URL da capa" erro={erros.capa_url} dica="Link de uma imagem começando com https://">
          <input
            name="capa_url"
            type="url"
            value={form.capa_url ?? ""}
            onChange={alterar}
            placeholder="https://..."
            maxLength={500}
            className={classeCampo}
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm text-paper/80">
          <input type="checkbox" name="destaque" checked={form.destaque} onChange={alterar} className="accent-accent" />
          Mostrar em destaque na página inicial
        </label>

        {erroGeral && <p className="text-sm text-red-400">{erroGeral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-accent px-5 py-2 font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Salvando..." : textoBotao}
        </button>
      </div>

      <div className="order-first md:order-last">
        <span className="mb-1 block text-sm text-paper/80">Pré-visualização</span>
        <div className="aspect-[3/4] overflow-hidden rounded-md border border-black/60 bg-black/40">
          {ehUrlHttp(form.capa_url) ? (
            <img src={form.capa_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-paper/30">Sem capa</div>
          )}
        </div>
      </div>
    </form>
  );
}
