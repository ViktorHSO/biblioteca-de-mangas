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
- ✅ Cadastro de capítulos vinculados a um mangá (relacionamento 1:N)
- ✅ Busca com filtros combináveis (título, autor, gênero, status)
- ✅ Paginação de resultados
- ✅ Documentação automática via Swagger

## 🛠️ Tecnologias utilizadas

**Back-end**
- [Python](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/) (ORM)
- [Pydantic](https://docs.pydantic.dev/) (validação de dados)
- [MySQL](https://www.mysql.com/) (banco de dados)

**Front-end**
- [React](https://react.dev/)

## 📂 Estrutura do projeto

```
biblioteca-de-mangas/
├── backend/
│   ├── app/
│   │   ├── main.py          # ponto de entrada da API
│   │   ├── database.py      # conexão com o MySQL
│   │   ├── models/          # tabelas (SQLAlchemy)
│   │   ├── schemas/         # validação de dados (Pydantic)
│   │   ├── routers/         # rotas da API
│   │   └── crud/            # funções de acesso ao banco
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

Configure o arquivo `.env` na pasta `backend/`:

```
DATABASE_URL=mysql+pymysql://usuario:senha@localhost:3306/biblioteca_mangas
```

Rode a API:

```bash
uvicorn app.main:app --reload
```

A documentação interativa (Swagger) fica disponível em `http://127.0.0.1:8000/docs`.

### Front-end

```bash
cd frontend
npm install
npm run dev
```

## 📌 Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/mangas/` | Lista mangás (com filtros e paginação) |
| GET | `/mangas/{id}` | Busca um mangá específico |
| POST | `/mangas/` | Cadastra um novo mangá |
| PUT | `/mangas/{id}` | Atualiza um mangá |
| DELETE | `/mangas/{id}` | Remove um mangá |
| GET | `/capitulos/manga/{manga_id}` | Lista capítulos de um mangá |
| POST | `/capitulos/` | Cadastra um capítulo |
| DELETE | `/capitulos/{id}` | Remove um capítulo |

## 🗺️ Próximos passos

- [ ] Interface completa em React
- [ ] Autenticação de usuário
- [ ] Upload de imagem de capa
- [ ] Deploy da API

## 👤 Autor

**Victor Hugo Sousa Oliveira**

[GitHub](https://github.com/ViktorHSO)
