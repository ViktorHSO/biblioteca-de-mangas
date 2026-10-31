import { useState } from "react";
import { errosDeCampo } from "../utils/erros";
import { classeCampo, ehUrlHttp } from "../utils/formulario";
import Campo from "./Campo";

function separarLinhas(texto) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

export default function CapituloForm({ valoresIniciais, textoBotao, onSalvar }) {
  const [numero, setNumero] = useState(valoresIniciais?.numero ?? "");
  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [dataLancamento, setDataLancamento] = useState(valoresIniciais?.data_lancamento ?? "");
  const [textoPaginas, setTextoPaginas] = useState(
    (valoresIniciais?.paginas ?? []).map((pagina) => pagina.imagem_url).join("\n")
  );
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const paginas = separarLinhas(textoPaginas);

  function limparErro(campo) {
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErros({});
    setErroGeral(null);
    try {
      await onSalvar({
        numero: Number(numero),
        titulo: titulo.trim() || null,
        data_lancamento: dataLancamento || null,
        paginas,
      });
    } catch (error) {
      const status = error.response?.status;
      if (status === 422) {
        setErros(errosDeCampo(error));
        setErroGeral("Confira os campos destacados.");
      } else if (status === 409) {
        setErros({ numero: error.response.data.detail });
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
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr_180px]">
        <Campo rotulo="Número *" erro={erros.numero}>
          <input
            type="number"
            min={1}
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value);
              limparErro("numero");
            }}
            required
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Título" erro={erros.titulo}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={255} className={classeCampo} />
        </Campo>
        <Campo rotulo="Lançamento" erro={erros.data_lancamento}>
          <input
            type="date"
            value={dataLancamento}
            onChange={(e) => setDataLancamento(e.target.value)}
            className={classeCampo}
          />
        </Campo>
      </div>

      <Campo
        rotulo={`Páginas (${paginas.length})`}
        erro={erros.paginas}
        dica="Cole o link de cada imagem, uma por linha, na ordem de leitura."
      >
        <textarea
          value={textoPaginas}
          onChange={(e) => {
            setTextoPaginas(e.target.value);
            limparErro("paginas");
          }}
          rows={8}
          spellCheck={false}
          placeholder={"https://exemplo.com/capitulo-1/01.jpg\nhttps://exemplo.com/capitulo-1/02.jpg"}
          className={`${classeCampo} font-mono text-xs`}
        />
      </Campo>

      {paginas.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {paginas.map((url, indice) => (
            <figure key={`${indice}-${url}`} className="overflow-hidden rounded border border-black/60 bg-black/40">
              {ehUrlHttp(url) ? (
                <img
                  src={url}
                  alt={`Página ${indice + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-[10px] text-red-400">link inválido</div>
              )}
              <figcaption className="py-0.5 text-center text-[10px] text-paper/50">{indice + 1}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {erroGeral && <p className="text-sm text-red-400">{erroGeral}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-accent px-5 py-2 font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "Salvando..." : textoBotao}
      </button>
    </form>
  );
}
