import { useEffect, useRef, useState } from "react";
import { errosDeCampo, mensagemDaApi } from "../utils/erros";
import { classeCampo, ehUrlHttp } from "../utils/formulario";
import {
  compararNomes,
  ehImagemEnviada,
  problemaNoArquivo,
  TAMANHO_MAXIMO_PAGINA,
  TIPOS_DE_IMAGEM,
  urlDaImagem,
} from "../utils/imagem";
import Campo from "./Campo";

const MAXIMO_PAGINAS = 300;

function separarLinhas(texto) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

function Miniatura({ src, numero, novo, aoRemover }) {
  return (
    <figure className="relative overflow-hidden rounded border border-black/60 bg-black/40">
      {src ? (
        <img
          src={src}
          alt={`Página ${numero}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-[2/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[2/3] items-center justify-center text-[10px] text-red-400">link inválido</div>
      )}
      <figcaption className="py-0.5 text-center text-[10px] text-paper/50">
        {numero}
        {novo && <span className="ml-1 text-accent">novo</span>}
      </figcaption>
      {aoRemover && (
        <button
          type="button"
          onClick={aoRemover}
          aria-label={`Remover página ${numero}`}
          className="absolute right-0.5 top-0.5 rounded bg-black/70 px-1 text-xs text-paper/80 hover:text-red-400"
        >
          ×
        </button>
      )}
    </figure>
  );
}

export default function CapituloForm({ valoresIniciais, textoBotao, onSalvar }) {
  const [numero, setNumero] = useState(valoresIniciais?.numero ?? "");
  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [dataLancamento, setDataLancamento] = useState(valoresIniciais?.data_lancamento ?? "");
  const [textoPaginas, setTextoPaginas] = useState(
    (valoresIniciais?.paginas ?? []).map((pagina) => pagina.imagem_url).join("\n")
  );
  // Imagens escolhidas no computador: entram depois das linhas acima, ordenadas pelo nome.
  const [novas, setNovas] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const previas = useRef(new Set());

  // Libera da memória as pré-visualizações ao sair da página.
  useEffect(() => {
    const abertas = previas.current;
    return () => abertas.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const paginas = separarLinhas(textoPaginas);
  const totalPaginas = paginas.length + novas.length;

  function limparErro(campo) {
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
  }

  function escolherArquivos(e) {
    const escolhidos = [...(e.target.files ?? [])];
    e.target.value = ""; // permite escolher os mesmos arquivos de novo
    if (escolhidos.length === 0) return;

    const recusado = escolhidos.find((arquivo) => problemaNoArquivo(arquivo, TAMANHO_MAXIMO_PAGINA));
    if (recusado) {
      setErros((anteriores) => ({
        ...anteriores,
        paginas: `${recusado.name}: ${problemaNoArquivo(recusado, TAMANHO_MAXIMO_PAGINA)}`,
      }));
      return;
    }
    if (totalPaginas + escolhidos.length > MAXIMO_PAGINAS) {
      setErros((anteriores) => ({ ...anteriores, paginas: `Um capítulo pode ter no máximo ${MAXIMO_PAGINAS} páginas.` }));
      return;
    }

    limparErro("paginas");
    const itens = escolhidos.map((arquivo) => {
      const previa = URL.createObjectURL(arquivo);
      previas.current.add(previa);
      return { arquivo, previa };
    });
    setNovas((atuais) => [...atuais, ...itens].sort((a, b) => compararNomes(a.arquivo, b.arquivo)));
  }

  function removerNova(item) {
    URL.revokeObjectURL(item.previa);
    previas.current.delete(item.previa);
    setNovas((atuais) => atuais.filter((atual) => atual !== item));
  }

  function removerLinha(indice) {
    setTextoPaginas(paginas.filter((_, i) => i !== indice).join("\n"));
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErros({});
    setErroGeral(null);
    try {
      await onSalvar(
        {
          numero: Number(numero),
          titulo: titulo.trim() || null,
          data_lancamento: dataLancamento || null,
          paginas,
        },
        novas.map((item) => item.arquivo),
        (enviadas, total) => setProgresso({ enviadas, total })
      );
    } catch (error) {
      const status = error.response?.status;
      if (status === 422 || status === 413) {
        // Erros do envio das imagens vêm como texto; os do formulário, campo a campo.
        const mensagemDasImagens = mensagemDaApi(error, null);
        setErros(mensagemDasImagens ? { paginas: mensagemDasImagens } : errosDeCampo(error));
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
      setProgresso(null);
    }
  }

  const textoDoBotao = progresso
    ? `Enviando páginas... ${progresso.enviadas} de ${progresso.total}`
    : enviando
      ? "Salvando..."
      : textoBotao;

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
        rotulo={`Páginas (${totalPaginas})`}
        erro={erros.paginas}
        dica="Escolha as imagens do computador (ficam na ordem do nome do arquivo: 01, 02, 03...) ou cole links, um por linha. As imagens já enviadas aparecem como /uploads/...: mude as linhas de lugar para reordenar."
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-md border border-white/15 px-3 py-2 text-sm text-paper/80 transition-colors hover:border-accent hover:text-paper focus-within:ring-2 focus-within:ring-accent">
              Adicionar imagens do computador
              <input
                type="file"
                multiple
                accept={TIPOS_DE_IMAGEM.join(",")}
                onChange={escolherArquivos}
                className="sr-only"
              />
            </label>
            {novas.length > 0 && (
              <span className="text-sm text-paper/60">
                {novas.length} {novas.length === 1 ? "imagem nova" : "imagens novas"}
                <button
                  type="button"
                  onClick={() => novas.forEach(removerNova)}
                  className="ml-2 text-red-400 hover:underline"
                >
                  Remover todas
                </button>
              </span>
            )}
          </div>
          <textarea
            value={textoPaginas}
            onChange={(e) => {
              setTextoPaginas(e.target.value);
              limparErro("paginas");
            }}
            rows={6}
            spellCheck={false}
            aria-label="Links das páginas"
            placeholder={"ou cole os links:\nhttps://exemplo.com/capitulo-1/01.jpg\nhttps://exemplo.com/capitulo-1/02.jpg"}
            className={`${classeCampo} font-mono text-xs`}
          />
        </div>
      </Campo>

      {totalPaginas > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {paginas.map((url, indice) => (
            <Miniatura
              key={`${indice}-${url}`}
              numero={indice + 1}
              src={ehUrlHttp(url) || ehImagemEnviada(url) ? urlDaImagem(url) : null}
              aoRemover={() => removerLinha(indice)}
            />
          ))}
          {novas.map((item, indice) => (
            <Miniatura
              key={item.previa}
              numero={paginas.length + indice + 1}
              src={item.previa}
              novo
              aoRemover={() => removerNova(item)}
            />
          ))}
        </div>
      )}

      {erroGeral && <p className="text-sm text-red-400">{erroGeral}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-accent px-5 py-2 font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {textoDoBotao}
      </button>
    </form>
  );
}
