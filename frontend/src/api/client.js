import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
});

let tokenAtual = null;
let aoExpirarSessao = () => {};

export function definirToken(token) {
  tokenAtual = token;
}

export function quandoSessaoExpirar(callback) {
  aoExpirarSessao = callback;
}

api.interceptors.request.use((config) => {
  if (tokenAtual) {
    config.headers.Authorization = `Bearer ${tokenAtual}`;
  }
  return config;
});

// Um 401 com token enviado significa que o login expirou ou foi invalidado:
// a sessão local é encerrada para o usuário não ficar num estado "logado" falso.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      aoExpirarSessao();
    }
    return Promise.reject(error);
  }
);

export default api;
