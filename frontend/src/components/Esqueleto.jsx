// Blocos cinza animados que ocupam o lugar do conteúdo enquanto ele carrega,
// para a página não "pular" quando os dados chegam.
function Bloco({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-white/5 ${className}`} />;
}

function Carregando({ children, className = "", style }) {
  return (
    <div className={className} style={style} aria-busy="true">
      <span className="sr-only" role="status">Carregando...</span>
      {children}
    </div>
  );
}

export function GradeEsqueleto({ quantidade = 12 }) {
  return (
    <Carregando className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="space-y-2">
          <Bloco className="aspect-[3/4]" />
          <Bloco className="h-4 w-3/4" />
          <Bloco className="h-3 w-1/2" />
        </div>
      ))}
    </Carregando>
  );
}

export function ListaEsqueleto({ quantidade = 8 }) {
  return (
    <Carregando className="space-y-2">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-md bg-surface/60 px-4 py-3">
          <Bloco className="aspect-[3/4] w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Bloco className="h-4 w-1/3" />
            <Bloco className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </Carregando>
  );
}

export function HomeEsqueleto() {
  return (
    <Carregando className="space-y-12">
      <Bloco className="h-[280px] w-full rounded-lg" />
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Bloco key={i} className="h-28" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Bloco key={i} className="h-24" />
          ))}
        </div>
      </div>
    </Carregando>
  );
}

export function DetalheEsqueleto() {
  return (
    <Carregando className="flex flex-col gap-8 md:flex-row">
      <Bloco className="aspect-[3/4] w-56 shrink-0 self-center md:self-start" />
      <div className="flex-1 space-y-4">
        <Bloco className="h-9 w-2/3" />
        <Bloco className="h-4 w-1/3" />
        <Bloco className="h-4 w-1/2" />
        <Bloco className="h-24 w-full" />
        <Bloco className="h-10 w-40" />
      </div>
    </Carregando>
  );
}

export function LeitorEsqueleto() {
  return (
    <Carregando className="mx-auto max-w-3xl space-y-4">
      <Bloco className="mx-auto h-8 w-1/2" />
      <Bloco className="h-10 w-full" />
      <Bloco className="aspect-[3/4] w-full" />
    </Carregando>
  );
}

export function FormularioEsqueleto() {
  return (
    <Carregando className="max-w-2xl space-y-5">
      <Bloco className="h-9 w-1/3" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Bloco className="h-3 w-24" />
          <Bloco className="h-10 w-full" />
        </div>
      ))}
    </Carregando>
  );
}
