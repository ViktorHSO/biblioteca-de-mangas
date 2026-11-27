import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../context/useIdioma";
import { IDIOMAS } from "../i18n/idioma";
import { errosDeCampo, mensagemDaApi } from "../utils/erros";
import { classeCampo, ehUrlHttp } from "../utils/formulario";
import { ehCapaEnviada, problemaNoArquivo, tamanhoLegivel, TIPOS_DE_CAPA, urlDaImagem } from "../utils/imagem";
import { STATUS, TIPOS } from "../utils/opcoes";
import Campo from "./Campo";

const VAZIO = {
  titulo: "",
  autor: "",
  genero: "",
  sinopse: "",
  status: "quero ler",
  tipo: "mangá",
  capa_url: "",
  destaque: false,
  idioma_original: "pt",
};

// { pt: { titulo, sinopse }, en: {...}, es: {...} } sempre com os três idiomas, para os campos controlados.
function traducoesIniciais(traducoes = {}) {
  return Object.fromEntries(
    IDIOMAS.map(({ codigo }) => [
      codigo,
      { titulo: traducoes[codigo]?.titulo ?? "", sinopse: traducoes[codigo]?.sinopse ?? "" },
    ])
  );
}

export default function MangaForm({ valoresIniciais, textoBotao, onSalvar }) {
  const { idioma, t } = useIdioma();
  // Mangá novo: o idioma original sugerido é o idioma em que o site está.
  const [form, setForm] = useState(() => ({ ...VAZIO, idioma_original: idioma, ...valoresIniciais }));
  const [traducoes, setTraducoes] = useState(() => traducoesIniciais(valoresIniciais?.traducoes));
  const outrosIdiomas = IDIOMAS.filter(({ codigo }) => codigo !== form.idioma_original);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  // Imagem escolhida no computador: só é enviada à API depois que o mangá é salvo.
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState(null);
  const previaAtual = useRef(null);

  // Libera da memória a pré-visualização da imagem ao sair da página.
  useEffect(() => () => previaAtual.current && URL.revokeObjectURL(previaAtual.current), []);

  function trocarPrevia(novoArquivo) {
    if (previaAtual.current) URL.revokeObjectURL(previaAtual.current);
    previaAtual.current = novoArquivo ? URL.createObjectURL(novoArquivo) : null;
    setPrevia(previaAtual.current);
    setArquivo(novoArquivo);
  }

  function escolherArquivo(e) {
    const escolhido = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois de remover
    if (!escolhido) return;
    const problema = problemaNoArquivo(escolhido);
    setErros((anteriores) => ({ ...anteriores, capa_url: problema ?? undefined }));
    if (!problema) trocarPrevia(escolhido);
  }

  function removerCapa() {
    trocarPrevia(null);
    setForm((anterior) => ({ ...anterior, capa_url: "" }));
  }

  function alterar(e) {
    const { name, value, type, checked } = e.target;
    setForm((anterior) => ({ ...anterior, [name]: type === "checkbox" ? checked : value }));
  }

  function alterarTraducao(codigo, campo, valor) {
    setTraducoes((anteriores) => ({ ...anteriores, [codigo]: { ...anteriores[codigo], [campo]: valor } }));
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErros({});
    setErroGeral(null);
    try {
      // Envia só os campos do formulário: a API recusa campos extras (id, datas etc.).
      const dados = Object.fromEntries(Object.keys(VAZIO).map((campo) => [campo, form[campo]]));
      // Só os idiomas diferentes do original; campos vazios a API descarta.
      dados.traducoes = Object.fromEntries(outrosIdiomas.map(({ codigo }) => [codigo, traducoes[codigo]]));
      await onSalvar(dados, arquivo);
    } catch (error) {
      const status = error.response?.status;
      if (status === 422 || status === 413) {
        // Erro do envio da capa vem como texto; os do formulário, campo a campo.
        const mensagemDaCapa = mensagemDaApi(error, null);
        setErros(mensagemDaCapa ? { capa_url: mensagemDaCapa } : errosDeCampo(error));
        setErroGeral(t("form.confira"));
      } else if (status === 401) {
        setErroGeral(t("form.sessao"));
      } else {
        setErroGeral(t("form.naoSalvou"));
      }
    } finally {
      setEnviando(false);
    }
  }

  const capaEnviada = ehCapaEnviada(form.capa_url);
  const imagemDaPrevia =
    previa ?? (capaEnviada || ehUrlHttp(form.capa_url) ? urlDaImagem(form.capa_url) : null);

  return (
    <form onSubmit={enviar} className="grid gap-6 md:grid-cols-[1fr_180px]">
      <div className="space-y-4">
        <Campo rotulo={t("form.titulo")} erro={erros.titulo}>
          <input name="titulo" value={form.titulo} onChange={alterar} required maxLength={255} className={classeCampo} />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo={t("form.autor")} erro={erros.autor}>
            <input name="autor" value={form.autor ?? ""} onChange={alterar} maxLength={255} className={classeCampo} />
          </Campo>
          <Campo rotulo={t("form.generos")} erro={erros.genero} dica={t("form.generosDica")}>
            <input name="genero" value={form.genero ?? ""} onChange={alterar} maxLength={100} className={classeCampo} />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo={t("form.tipo")} erro={erros.tipo}>
            <select name="tipo" value={form.tipo} onChange={alterar} className={classeCampo}>
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>{t(`tipo.${tipo}`)}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo={t("form.status")} erro={erros.status}>
            <select name="status" value={form.status} onChange={alterar} className={classeCampo}>
              {STATUS.map((status) => (
                <option key={status} value={status}>{t(`status.${status}`)}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo rotulo={t("form.sinopse")} erro={erros.sinopse}>
          <textarea name="sinopse" value={form.sinopse ?? ""} onChange={alterar} rows={5} maxLength={5000} className={classeCampo} />
        </Campo>

        <Campo rotulo={t("form.idiomaOriginal")} erro={erros.idioma_original} dica={t("form.idiomaOriginalDica")}>
          <select name="idioma_original" value={form.idioma_original} onChange={alterar} className={`${classeCampo} sm:w-1/2`}>
            {IDIOMAS.map(({ codigo }) => (
              <option key={codigo} value={codigo}>{t(`idioma.${codigo}`)}</option>
            ))}
          </select>
        </Campo>

        <fieldset className="space-y-4 rounded-md border border-white/10 p-4">
          <legend className="px-1 text-sm text-paper/80">{t("form.traducoes")}</legend>
          <p className="-mt-2 text-xs text-paper/40">{t("form.traducoesDica")}</p>
          {outrosIdiomas.map(({ codigo }) => {
            const nome = t(`idioma.${codigo}`);
            return (
              <div key={codigo} lang={codigo} className="space-y-3">
                <Campo rotulo={t("form.tituloEm", { idioma: nome })} erro={erros.traducoes}>
                  <input
                    value={traducoes[codigo].titulo}
                    onChange={(e) => alterarTraducao(codigo, "titulo", e.target.value)}
                    placeholder={form.titulo}
                    maxLength={255}
                    className={classeCampo}
                  />
                </Campo>
                <Campo rotulo={t("form.sinopseEm", { idioma: nome })}>
                  <textarea
                    value={traducoes[codigo].sinopse}
                    onChange={(e) => alterarTraducao(codigo, "sinopse", e.target.value)}
                    rows={3}
                    maxLength={5000}
                    className={classeCampo}
                  />
                </Campo>
              </div>
            );
          })}
        </fieldset>

        <Campo rotulo={t("form.capa")} erro={erros.capa_url} dica={t("form.capaDica")}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-md border border-white/15 px-3 py-2 text-sm text-paper/80 transition-colors hover:border-accent hover:text-paper focus-within:ring-2 focus-within:ring-accent">
                {t("form.escolherImagem")}
                <input type="file" accept={TIPOS_DE_CAPA.join(",")} onChange={escolherArquivo} className="sr-only" />
              </label>
              {(arquivo || capaEnviada) && (
                <span className="flex items-center gap-2 text-sm text-paper/60">
                  {arquivo ? `${arquivo.name} (${tamanhoLegivel(arquivo.size)})` : t("form.imagemEnviada")}
                  <button type="button" onClick={removerCapa} className="text-red-400 hover:underline">
                    {t("form.remover")}
                  </button>
                </span>
              )}
            </div>
            <input
              name="capa_url"
              type="url"
              value={capaEnviada ? "" : form.capa_url ?? ""}
              onChange={alterar}
              disabled={Boolean(arquivo)}
              placeholder={capaEnviada ? t("form.trocarEnviada") : t("form.colarLink")}
              maxLength={500}
              aria-label={t("form.linkCapa")}
              className={`${classeCampo} disabled:opacity-40`}
            />
          </div>
        </Campo>

        <label className="flex items-center gap-2 text-sm text-paper/80">
          <input type="checkbox" name="destaque" checked={form.destaque} onChange={alterar} className="accent-accent" />
          {t("form.destaque")}
        </label>

        {erroGeral && <p className="text-sm text-red-400">{erroGeral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-accent px-5 py-2 font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? t("comum.salvando") : textoBotao}
        </button>
      </div>

      <div className="order-first md:order-last">
        <span className="mb-1 block text-sm text-paper/80">{t("form.previa")}</span>
        <div className="aspect-[3/4] overflow-hidden rounded-md border border-black/60 bg-black/40">
          {imagemDaPrevia ? (
            <img src={imagemDaPrevia} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-paper/30">{t("comum.semCapa")}</div>
          )}
        </div>
      </div>
    </form>
  );
}
