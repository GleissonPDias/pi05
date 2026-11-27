import { toISODate } from "../utils/dates";

/**
 * Dados do modo demonstração para Agenda e Financeiro.
 *
 * Mesma interface de `api.agendamentos`, `api.pagamentos` e `api.despesas`
 * (list, create, update, changeStatus, remove), mas tudo fica só na memória do
 * navegador: ao recarregar a página os dados voltam ao exemplo inicial.
 * Assim as telas podem ser apresentadas sem depender da API.
 */

const DAY = 86_400_000;
let seq = 900;
const nextId = () => {
  seq += 1;
  return seq;
};

/** Data de hoje + N dias, no horário informado (fuso local), em ISO. */
function at(days, hour, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Date(date.getTime() + days * DAY).toISOString();
}

const dateIn = (days) => toISODate(new Date(Date.now() + days * DAY));

function slot(id, days, hour, minute, durationMin, titulo, extra = {}) {
  const inicio = at(days, hour, minute);
  return {
    id,
    titulo,
    descricao: null,
    inicio,
    fim: new Date(new Date(inicio).getTime() + durationMin * 60_000).toISOString(),
    mecanicoId: null,
    boxId: null,
    status: days < 0 ? "CONCLUIDO" : "AGENDADO",
    ...extra,
  };
}

function seedAgenda() {
  return [
    slot(101, -1, 9, 0, 120, "REVISÃO 40.000 KM — JEEP RENEGADE (KXZ-9810)", { mecanicoId: "MEC-01", boxId: "BOX-01" }),
    slot(102, 0, 8, 30, 60, "TROCA DE ÓLEO E FILTROS — HONDA CIVIC (ABC-1234)", {
      mecanicoId: "MEC-02",
      boxId: "BOX-03",
      status: "EM_ANDAMENTO",
    }),
    slot(103, 0, 10, 0, 90, "DIAGNÓSTICO ELÉTRICO — VW T-CROSS (QWE-4F21)", {
      mecanicoId: "MEC-04",
      boxId: "BOX-04",
      status: "CONFIRMADO",
      descricao: "CLIENTE RELATA LUZ DA BATERIA ACESA NO PAINEL.",
    }),
    slot(104, 0, 14, 0, 120, "PASTILHAS E DISCOS DE FREIO — VW T-CROSS (BRA-2E19)", {
      mecanicoId: "MEC-01",
      boxId: "BOX-01",
    }),
    slot(105, 0, 16, 30, 60, "ALINHAMENTO E BALANCEAMENTO — COROLLA (FGH-7J88)", {
      mecanicoId: "MEC-02",
      boxId: "BOX-06",
      status: "CONFIRMADO",
    }),
    slot(106, 1, 9, 0, 240, "TROCA DE EMBREAGEM — FORD RANGER (RTY-3K45)", {
      mecanicoId: "MEC-03",
      boxId: "BOX-02",
      status: "CONFIRMADO",
    }),
    slot(107, 1, 13, 30, 60, "REVISÃO DO AR-CONDICIONADO — ONIX (JKL-5M67)", { mecanicoId: "MEC-04", boxId: "BOX-03" }),
    slot(108, 2, 8, 0, 120, "COXIM DO MOTOR — CHEVROLET ONIX (MNO-1P23)", { mecanicoId: "MEC-03", boxId: "BOX-05" }),
    slot(109, 3, 10, 30, 60, "INSPEÇÃO PRÉ-VIAGEM — HB20 (STU-8V90)", { mecanicoId: "MEC-02", boxId: "BOX-04" }),
    slot(110, 5, 9, 0, 180, "REVISÃO 60.000 KM — TOYOTA HILUX (XYZ-2W34)", { mecanicoId: "MEC-01", boxId: "BOX-02" }),
    slot(111, 9, 15, 0, 90, "SUSPENSÃO DIANTEIRA — FIAT ARGO (PQR-6S78)", { mecanicoId: "MEC-02", boxId: "BOX-06" }),
    slot(112, 18, 8, 30, 60, "TROCA DE CORREIA DENTADA — GOL (LMN-4T56)", { mecanicoId: "MEC-03" }),
  ];
}

function entry(id, descricao, valor, venceEm, status, extra = {}) {
  return {
    id,
    descricao,
    valor,
    vencimento: dateIn(venceEm),
    status,
    observacoes: null,
    pagoEm: status === "PAGO" ? at(Math.min(venceEm, 0), 11) : null,
    ...extra,
  };
}

function seedPagamentos() {
  return [
    entry(201, "OS #1042 — REVISÃO COMPLETA HONDA CIVIC", 1850, 0, "PENDENTE", { formaPagamento: "PIX", parcelas: 1 }),
    entry(202, "OS #1038 — TROCA DE EMBREAGEM FORD RANGER", 4850, 3, "PENDENTE", {
      formaPagamento: "CARTAO_CREDITO",
      parcelas: 3,
      observacoes: "PARCELA 1 DE 3",
    }),
    entry(203, "OS #1035 — DISCOS E PASTILHAS VW T-CROSS", 1290, -4, "PENDENTE", { formaPagamento: "BOLETO", parcelas: 1 }),
    entry(204, "OS #1031 — ALINHAMENTO E BALANCEAMENTO", 260, -1, "PAGO", { formaPagamento: "DINHEIRO", parcelas: 1 }),
    entry(205, "OS #1029 — DIAGNÓSTICO ELÉTRICO ONIX", 450, -2, "PAGO", { formaPagamento: "PIX", parcelas: 1 }),
    entry(206, "OS #1027 — REVISÃO 40.000 KM RENEGADE", 2380, -5, "PAGO", { formaPagamento: "CARTAO_DEBITO", parcelas: 1 }),
    entry(207, "OS #1044 — COXIM DO MOTOR CHEVROLET ONIX", 870, 7, "PENDENTE", { formaPagamento: "PIX", parcelas: 1 }),
    entry(208, "OS #1019 — SUSPENSÃO DIANTEIRA ARGO", 1640, -9, "CANCELADO", {
      formaPagamento: "TRANSFERENCIA",
      parcelas: 1,
      observacoes: "CLIENTE DESISTIU DO SERVIÇO",
    }),
  ];
}

function seedDespesas() {
  return [
    entry(301, "ALUGUEL DO GALPÃO", 6500, 5, "PENDENTE", { categoria: "Aluguel" }),
    entry(302, "COMPRA DE PASTILHAS E DISCOS — AUTOPEÇAS CENTRAL", 2140, 1, "PENDENTE", {
      categoria: "Fornecedores de peças",
    }),
    entry(303, "CONTA DE ENERGIA", 980, -2, "PENDENTE", { categoria: "Energia e água" }),
    entry(304, "ÓLEO 5W30 (LOTE 40 L) — DISTRIBUIDORA LUBRIX", 1360, -3, "PAGO", { categoria: "Fornecedores de peças" }),
    entry(305, "MANUTENÇÃO DO ELEVADOR BOX 02", 720, -6, "PAGO", { categoria: "Manutenção" }),
    entry(306, "DAS — SIMPLES NACIONAL", 1890, 12, "PENDENTE", { categoria: "Impostos" }),
  ];
}

/** Coleção em memória com a mesma interface do cliente da API. */
function collection(seed, { filter, defaults = {} } = {}) {
  let items = seed();
  const clone = (item) => ({ ...item });
  const find = (id) => items.find((item) => String(item.id) === String(id));
  const missing = () => Promise.reject(new Error("Registro não encontrado."));

  return {
    async list(params = {}) {
      return items.filter((item) => !filter || filter(item, params)).map(clone);
    },
    async create(payload) {
      const created = { ...defaults, ...payload, id: nextId() };
      items = [...items, created];
      return clone(created);
    },
    async update(id, payload) {
      const current = find(id);
      if (!current) return missing();
      const updated = { ...current, ...payload };
      items = items.map((item) => (item === current ? updated : item));
      return clone(updated);
    },
    async changeStatus(id, status) {
      const current = find(id);
      if (!current) return missing();
      const pagoEm = status === "PAGO" ? new Date().toISOString() : current.pagoEm;
      const updated = { ...current, status, pagoEm };
      items = items.map((item) => (item === current ? updated : item));
      return clone(updated);
    },
    async remove(id) {
      if (!find(id)) return missing();
      items = items.filter((item) => String(item.id) !== String(id));
    },
  };
}

/** Agendamentos entre `inicio` e `fim` (mesmo filtro da API). */
const inRange = (item, { inicio, fim }) =>
  (!inicio || new Date(item.fim) > new Date(inicio)) && (!fim || new Date(item.inicio) < new Date(fim));

export const demoApi = {
  agendamentos: collection(seedAgenda, { filter: inRange, defaults: { status: "AGENDADO" } }),
  pagamentos: collection(seedPagamentos, { defaults: { status: "PENDENTE" } }),
  despesas: collection(seedDespesas, { defaults: { status: "PENDENTE" } }),
};
