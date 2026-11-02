# Biblioteca de Mangás — front-end

Interface em React do projeto. A documentação completa (funcionalidades, como rodar a API e o banco, segurança) está no [README principal](../README.md).

## Rodando

```bash
npm install
copy .env.example .env      # Windows (Mac/Linux: cp .env.example .env)
npm run dev                 # http://localhost:5173
```

| Variável | Para que serve | Padrão |
|---|---|---|
| `VITE_API_URL` | Endereço da API (back-end) | `http://127.0.0.1:8000` |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve a pasta `dist/` para conferir o build |
| `npm run lint` | Verifica o código com o ESLint |

## Organização

```
src/
├── api/         chamadas à API (axios com token e tratamento de sessão expirada)
├── components/  peças reaproveitáveis (cards, formulários, busca rápida, paginação...)
├── context/     login do administrador e avisos (toasts)
├── hooks/       useCarregamento e atalho Ctrl+K
├── pages/       uma página por rota
└── utils/       datas, números, URL e opções compartilhadas
```
