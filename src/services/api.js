/**
 * Cliente HTTP da API Spring Boot (salvo-api).
 *
 * - Base URL configurável por VITE_API_URL.
 * - Sessão (JWT) persistida no localStorage.
 * - Modo "demo" mantém a interface funcionando com os dados fictícios.
 * - Erros de rede/API são publicados para o banner global (ApiFeedback).
 */

const BASE_URL = (
  import.meta.env.VITE_API_URL || "https://salvo-api.onrender.com"
).replace(/\/+$/, "");

const SESSION_KEY = "salvo.session.v1";
const MODE_KEY = "salvo.mode.v1";

export class ApiError extends Error {
  constructor(message, { status = 0, code = "", details = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponível (modo privado) — segue só em memória
  }
}

let session = readJson(SESSION_KEY);
let mode = localStorage.getItem(MODE_KEY) || null;
let busyCount = 0;
const listeners = new Set();

function notify(event) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // um listener com erro não pode derrubar os demais
    }
  });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isBusy() {
  return busyCount > 0;
}

export function getMode() {
  return mode;
}

export function isDemo() {
  return mode === "demo";
}

export function setDemoMode(enabled) {
  mode = enabled ? "demo" : null;
  if (enabled) localStorage.setItem(MODE_KEY, "demo");
  else localStorage.removeItem(MODE_KEY);
  notify({ type: "mode", mode });
}

export function getSession() {
  return session;
}

export function saveSession(loginResponse) {
  const expiresIn = Number(loginResponse?.expires_in) || 0;
  session = {
    accessToken: loginResponse?.access_token ?? null,
    refreshToken: loginResponse?.refresh_token ?? null,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
  };
  mode = "api";
  localStorage.setItem(MODE_KEY, "api");
  writeJson(SESSION_KEY, session);
  notify({ type: "session", session });
}

export function setSessionUser(user) {
  if (!session) return;
  session = { ...session, user };
  writeJson(SESSION_KEY, session);
}

export function clearSession() {
  session = null;
  writeJson(SESSION_KEY, null);
}

export function clearMode() {
  mode = null;
  localStorage.removeItem(MODE_KEY);
}

function begin() {
  busyCount += 1;
  notify({ type: "busy", busy: true });
}

function end() {
  busyCount = Math.max(0, busyCount - 1);
  notify({ type: "busy", busy: busyCount > 0 });
}

function describeError(data, status) {
  if (data && typeof data === "object") {
    const message = data.mensagem || data.message || data.error || "";
    const details = Array.isArray(data.detalhes)
      ? data.detalhes
      : Array.isArray(data.details)
        ? data.details
        : [];
    if (message) return { message, code: data.codigo || data.code || "", details };
  }
  if (typeof data === "string" && data.trim()) {
    return { message: data.trim().slice(0, 300), code: "", details: [] };
  }
  return { message: `A API respondeu com erro ${status}.`, code: "", details: [] };
}

async function request(
  path,
  { method = "GET", body, auth = true, notifyError = true } = {},
) {
  if (mode === "demo") {
    throw new ApiError("Modo demonstração: os dados são locais.", {
      code: "DEMO",
    });
  }

  const headers = { Accept: "application/json" };
  const options = { method, headers };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  if (auth && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  begin();
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (response.status === 401 && auth) {
      clearSession();
      clearMode();
      notify({ type: "unauthorized" });
      throw new ApiError("Sua sessão expirou. Entre novamente.", {
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    if (!response.ok) {
      const { message, code, details } = describeError(data, response.status);
      const error = new ApiError(message, {
        status: response.status,
        code,
        details,
      });
      if (notifyError) notify({ type: "error", error });
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const networkError = new ApiError(
      "Não foi possível conectar à API. Verifique a conexão e a URL configurada.",
      { code: "NETWORK" },
    );
    if (notifyError) notify({ type: "error", error: networkError });
    throw networkError;
  } finally {
    end();
  }
}

function query(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Percorre todas as páginas de um endpoint que devolve Spring Page. */
export async function getAll(path, params = {}, { size = 100 } = {}) {
  let page = 0;
  let items = [];

  for (;;) {
    const data = await request(`${path}${query({ ...params, page, size })}`);
    if (Array.isArray(data)) return data;

    const content = Array.isArray(data?.content) ? data.content : [];
    items = items.concat(content);

    if (!data || data.last !== false || content.length === 0) break;
    page += 1;
    if (page > 500) break;
  }

  return items;
}

export const api = {
  baseUrl: BASE_URL,

  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      auth: false,
      notifyError: false,
      body: { email, password },
    });
  },

  register(payload) {
    return request("/auth/registrar", {
      method: "POST",
      auth: false,
      notifyError: false,
      body: payload,
    });
  },

  me() {
    return request("/auth/me");
  },

  clientes: {
    list(q) {
      return getAll("/clientes", { q, sort: "nome" });
    },
    get(id) {
      return request(`/clientes/${id}`);
    },
    create(payload) {
      return request("/clientes", { method: "POST", body: payload });
    },
    update(id, payload) {
      return request(`/clientes/${id}`, { method: "PUT", body: payload });
    },
    deactivate(id) {
      return request(`/clientes/${id}`, { method: "DELETE" });
    },
  },

  veiculos: {
    list() {
      return getAll("/veiculos", { sort: "modelo" });
    },
    create(clienteId, payload) {
      return request(`/clientes/${clienteId}/veiculos`, {
        method: "POST",
        body: payload,
      });
    },
    update(id, payload) {
      return request(`/veiculos/${id}`, { method: "PUT", body: payload });
    },
    deactivate(id) {
      return request(`/veiculos/${id}`, { method: "DELETE" });
    },
  },

  ordens: {
    list(params = {}) {
      return getAll("/ordens-servico", { ...params, sort: "numero,desc" });
    },
    get(numero) {
      return request(`/ordens-servico/${numero}`);
    },
    create(payload) {
      return request("/ordens-servico", { method: "POST", body: payload });
    },
    update(numero, payload) {
      return request(`/ordens-servico/${numero}`, { method: "PUT", body: payload });
    },
    changeStatus(numero, status, observacao) {
      return request(`/ordens-servico/${numero}/status`, {
        method: "PATCH",
        body: { status, observacao },
      });
    },
    addServico(numero, payload) {
      return request(`/ordens-servico/${numero}/servicos`, {
        method: "POST",
        body: payload,
      });
    },
    updateServico(numero, itemId, payload) {
      return request(`/ordens-servico/${numero}/servicos/${itemId}`, {
        method: "PUT",
        body: payload,
      });
    },
    removeServico(numero, itemId) {
      return request(`/ordens-servico/${numero}/servicos/${itemId}`, {
        method: "DELETE",
      });
    },
    addPeca(numero, payload) {
      return request(`/ordens-servico/${numero}/pecas`, {
        method: "POST",
        body: payload,
      });
    },
    updatePeca(numero, itemId, payload) {
      return request(`/ordens-servico/${numero}/pecas/${itemId}`, {
        method: "PUT",
        body: payload,
      });
    },
    removePeca(numero, itemId) {
      return request(`/ordens-servico/${numero}/pecas/${itemId}`, {
        method: "DELETE",
      });
    },
    historico(numero) {
      return request(`/ordens-servico/${numero}/historico`);
    },
  },

  servicos: {
    list(q = "") {
      return request(`/servicos${query({ q })}`);
    },
    create(payload) {
      return request("/servicos", { method: "POST", body: payload });
    },
    update(id, payload) {
      return request(`/servicos/${id}`, { method: "PUT", body: payload });
    },
    remove(id) {
      return request(`/servicos/${id}`, { method: "DELETE" });
    },
    pecasSugeridas(id, { notifyError = true } = {}) {
      return request(`/servicos/${id}/pecas-sugeridas`, { notifyError });
    },
    salvarPecasSugeridas(id, pecaIds) {
      return request(`/servicos/${id}/pecas-sugeridas`, {
        method: "PUT",
        body: { pecaIds },
      });
    },
  },

  pecas: {
    list(q = "") {
      return request(`/pecas${query({ q })}`);
    },
    create(payload) {
      return request("/pecas", { method: "POST", body: payload });
    },
    update(id, payload) {
      return request(`/pecas/${id}`, { method: "PUT", body: payload });
    },
    remove(id) {
      return request(`/pecas/${id}`, { method: "DELETE" });
    },
    movimentar(id, payload) {
      return request(`/pecas/${id}/movimentacoes`, {
        method: "POST",
        body: payload,
      });
    },
    movimentacoes(id, limite = 200) {
      return request(`/pecas/${id}/movimentacoes${query({ limite })}`);
    },
  },

  estoque: {
    movimentacoes(limite = 200) {
      return request(`/estoque/movimentacoes${query({ limite })}`);
    },
  },

  mecanicos: {
    list() {
      return request("/mecanicos");
    },
  },

  usuarios: {
    list({ busca, ativo, executaOs } = {}) {
      return request(`/usuarios${query({ busca, ativo, executaOs })}`);
    },
    get(id) {
      return request(`/usuarios/${id}`);
    },
    create(payload) {
      return request("/usuarios", { method: "POST", body: payload });
    },
    update(id, payload) {
      return request(`/usuarios/${id}`, { method: "PUT", body: payload });
    },
    changeStatus(id, ativo) {
      return request(`/usuarios/${id}/status`, {
        method: "PATCH",
        body: { ativo },
      });
    },
    resetPassword(id) {
      return request(`/usuarios/${id}/reset-senha`, { method: "POST" });
    },
  },

  boxes: {
    list({ incluirInativos = false } = {}) {
      return request(`/boxes${query({ incluirInativos: incluirInativos || undefined })}`);
    },
    create(payload) {
      return request("/boxes", { method: "POST", body: payload });
    },
    update(id, payload) {
      return request(`/boxes/${id}`, { method: "PUT", body: payload });
    },
    remove(id) {
      return request(`/boxes/${id}`, { method: "DELETE" });
    },
  },

  oficina: {
    get() {
      return request("/oficina");
    },
    update(payload) {
      return request("/oficina", { method: "PUT", body: payload });
    },
  },

  agendamentos: {
    list({ inicio, fim, status } = {}) {
      return request(`/agendamentos${query({ inicio, fim, status })}`);
    },
    create(payload) {
      return request("/agendamentos", { method: "POST", body: payload });
    },
    update(id, payload) {
      return request(`/agendamentos/${id}`, { method: "PUT", body: payload });
    },
    changeStatus(id, status) {
      return request(`/agendamentos/${id}/status`, { method: "PATCH", body: { status } });
    },
    remove(id) {
      return request(`/agendamentos/${id}`, { method: "DELETE" });
    },
  },

  pagamentos: {
    list() {
      return request("/pagamentos");
    },
    create(payload) {
      return request("/pagamentos", { method: "POST", body: payload });
    },
    changeStatus(id, status) {
      return request(`/pagamentos/${id}/status`, { method: "PATCH", body: { status } });
    },
    remove(id) {
      return request(`/pagamentos/${id}`, { method: "DELETE" });
    },
  },

  despesas: {
    list() {
      return request("/despesas");
    },
    create(payload) {
      return request("/despesas", { method: "POST", body: payload });
    },
    changeStatus(id, status) {
      return request(`/despesas/${id}/status`, { method: "PATCH", body: { status } });
    },
    remove(id) {
      return request(`/despesas/${id}`, { method: "DELETE" });
    },
  },

  notificacoes: {
    list({ somenteNaoLidas = false, limite = 20 } = {}) {
      return request(`/notificacoes${query({ somenteNaoLidas: somenteNaoLidas || undefined, limite })}`);
    },
    contador() {
      return request("/notificacoes/nao-lidas/contador");
    },
    markRead(id) {
      return request(`/notificacoes/${id}/lida`, { method: "PATCH" });
    },
    markAllRead() {
      return request("/notificacoes/lidas", { method: "PATCH" });
    },
  },
};

export default api;
