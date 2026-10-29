<h1 align="center">📚 Biblioteca de Mangás</h1>

<p align="center">
  API REST para gerenciamento de uma biblioteca pessoal de mangás, com cadastro de obras, capítulos e busca por múltiplos filtros.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge" alt="Em desenvolvimento" />
</p>

> 🚧 **Projeto em desenvolvimento ativo.** O back-end (API) já está funcional com CRUD completo, relacionamento entre tabelas e filtros de busca. O front-end em React ainda está sendo construído. Acompanhe o progresso na seção [Próximos passos](#-próximos-passos).

---

## 📖 Sobre o projeto

O **Biblioteca de Mangás** é um projeto pessoal criado para organizar e consultar uma coleção de mangás: título, autor, gênero, sinopse, status de leitura (quero ler / lendo / concluído) e os capítulos de cada obra.

O objetivo principal do projeto é praticar a construção de uma API REST completa, com relacionamento entre tabelas, filtros de busca e paginação — servindo também como projeto de portfólio.

## 🚀 Funcionalidades

- ✅ CRUD completo de mangás (criar, listar, buscar por ID, atualizar, deletar)
- ✅ Capítulos vinculados a um mangá (1:N) e páginas de imagem por capítulo, para o leitor
- ✅ Busca com filtros combináveis (título, autor, gênero, status, tipo) e ordenação
- ✅ Paginação de resultados
- ✅ Ranking por visualizações, destaques, últimos capítulos e lista de gêneros
- ✅ Login de administrador com JWT: leitura pública, escrita protegida
- ✅ Testes automatizados com pytest
- ✅ Documentação automática via Swagger

## 🛠️ Tecnologias utilizadas

**Back-end**
- [Python](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/) (ORM)
- [Pydantic](https://docs.pydantic.dev/) (validação de dados)
- [MySQL](https://www.mysql.com/) (banco de dados)
- [PyJWT](https://pyjwt.readthedocs.io/) + [bcrypt](https://pypi.org/project/bcrypt/) (autenticação)
- [SlowAPI](https://slowapi.readthedocs.io/) (limite de requisições)
- [pytest](https://docs.pytest.org/) (testes)

**Front-end**
- [React](https://react.dev/)

## 📂 Estrutura do projeto

```
biblioteca-de-mangas/
├── backend/
│   ├── app/
│   │   ├── main.py          # ponto de entrada da API
│   │   ├── database.py      # conexão com o MySQL
│   │   ├── criar_admin.py   # script para criar o administrador
│   │   ├── core/            # configurações, segurança (JWT/bcrypt) e rate limit
│   │   ├── models/          # tabelas (SQLAlchemy)
│   │   ├── schemas/         # validação de dados (Pydantic)
│   │   ├── routers/         # rotas da API
│   │   └── crud/            # funções de acesso ao banco
│   ├── migrations/          # scripts SQL para atualizar um banco já existente
│   ├── tests/               # testes automatizados (pytest)
│   ├── .env.example         # modelo das variáveis de ambiente
│   └── requirements.txt
└── frontend/                # interface em React
```

## ⚙️ Como rodar o projeto

### Pré-requisitos
- Python 3.12+
- MySQL rodando localmente
- Node.js (para o front-end)

### Back-end

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

Crie o banco no MySQL:

```sql
CREATE DATABASE biblioteca_mangas;
```

Copie `backend/.env.example` para `backend/.env` e preencha os valores. A `SECRET_KEY` pode ser gerada com:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

> A API não inicia sem uma `SECRET_KEY` segura. O arquivo `.env` fica fora do Git.

Se o banco já existia antes desta versão, rode o script `backend/migrations/001_estilo_olympus_e_admin.sql` (ele só adiciona colunas e tabelas, sem apagar dados).

Crie o administrador (a senha é digitada sem aparecer na tela):

```bash
python -m app.criar_admin
```

Rode a API:

```bash
uvicorn app.main:app --reload
```

A documentação interativa (Swagger) fica disponível em `http://127.0.0.1:8000/docs`. Para testar as rotas protegidas por lá, faça login em `POST /auth/login`, copie o `access_token` e cole no botão **Authorize**.

### Testes

```bash
pip install -r requirements-dev.txt
pytest
```

Os testes usam um banco SQLite temporário, sem tocar no MySQL.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

## 📌 Endpoints principais

🔒 = exige login de administrador (`Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login do administrador (retorna o token JWT) |
| GET | `/auth/me` 🔒 | Dados do administrador logado |
| GET | `/mangas/` | Lista mangás (filtros, ordenação e paginação) |
| GET | `/mangas/ranking` | Mais vistos |
| GET | `/mangas/destaques` | Mangás em destaque |
| GET | `/mangas/generos` | Lista de gêneros cadastrados |
| GET | `/mangas/{id}` | Mangá com a lista de capítulos |
| POST | `/mangas/` 🔒 | Cadastra um mangá |
| PUT | `/mangas/{id}` 🔒 | Atualiza um mangá |
| DELETE | `/mangas/{id}` 🔒 | Remove um mangá (e seus capítulos) |
| POST | `/mangas/{id}/visualizar` | Conta uma visualização |
| GET | `/capitulos/recentes` | Últimos capítulos lançados |
| GET | `/capitulos/manga/{manga_id}` | Capítulos de um mangá |
| GET | `/capitulos/{id}` | Capítulo com páginas e navegação (anterior/próximo) |
| POST | `/capitulos/` 🔒 | Cadastra um capítulo |
| PUT | `/capitulos/{id}` 🔒 | Atualiza um capítulo |
| PUT | `/capitulos/{id}/paginas` 🔒 | Define as páginas (URLs das imagens) |
| DELETE | `/capitulos/{id}` 🔒 | Remove um capítulo |
| POST | `/capitulos/{id}/visualizar` | Conta uma leitura |

## 🔐 Segurança

- Senhas guardadas apenas como hash **bcrypt**; login com token **JWT** assinado e com expiração.
- Rotas de escrita protegidas; leitura pública.
- Validação de todos os dados de entrada (tamanhos, valores permitidos, campos extras recusados).
- URLs de imagens aceitas só com `http`/`https`, bloqueando `javascript:` e `data:` (XSS).
- Consultas via ORM (sem SQL montado à mão) e curingas `%`/`_` escapados nas buscas.
- Limite de tentativas de login e de contagem de visualizações por IP.
- CORS restrito às origens configuradas e cabeçalhos de segurança nas respostas.
- Erros internos não expõem detalhes do servidor.
- Segredos só em variáveis de ambiente; dependências com versões fixadas e auditadas com `pip-audit` e `npm audit`.

## 🗺️ Próximos passos

- [ ] Interface completa em React (estilo site de leitura, com leitor de capítulos)
- [x] Autenticação de administrador
- [ ] Upload de imagem de capa
- [ ] Deploy da API

## 👤 Autor

**Victor Hugo Sousa Oliveira**

[GitHub](https://github.com/ViktorHSO)
