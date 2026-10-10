import { BOXES, MECHANICS } from "../../mocks/oficina";
import { formatBRL } from "../../utils/format";
import { maskPlate } from "../../utils/masks";
import {
  ACTIVE_STATUSES,
  DELIVERED_WINDOW_DAYS,
  LEAD_TIME_GOAL,
  PAYMENT_METHODS,
  PRIORITIES,
  SERVICE_TYPES,
  STATUS,
  WARRANTIES,
} from "./constants";

const DAY = 86_400_000;

export const mechanicsById = new Map(MECHANICS.map((m) => [m.id, m]));
export const boxesById = new Map(BOXES.map((b) => [b.id, b]));

export const formatOrderNumber = (number) => `#${number}`;
export const isActive = (order) => ACTIVE_STATUSES.includes(order.status);
export const isClosed = (order) => !isActive(order);

/** "Rafael Sampaio" ou "" */
export function mechanicName(id) {
  return mechanicsById.get(id)?.name ?? "";
}

/** "Box 03" ou "" */
export function boxName(id) {
  return boxesById.get(id)?.name ?? "";
}

/** Primeiro nome: "Rafael Sampaio" -> "Rafael" */
export function firstName(name = "") {
  return name.split(" ")[0];
}

/** Título exibido no quadro: o resumo da OS ou o tipo de atendimento. */
export function orderTitle(order) {
  return order.title || SERVICE_TYPES[order.type] || "Atendimento";
}

/* ----------------------------------------------------------------------------
 * Valores
 * -------------------------------------------------------------------------- */

const round = (value) => Math.round(value * 100) / 100;

/** Totais da OS: peças, mão de obra, desconto e total final. */
export function orderTotals(order) {
  const parts = round(order.parts.reduce((sum, line) => sum + line.qty * line.unitPrice, 0));
  const labor = round(order.services.reduce((sum, line) => sum + Number(line.price || 0), 0));
  const subtotal = round(parts + labor);
  const { type, value } = order.discount ?? { type: "valor", value: 0 };
  const rawDiscount = type === "percentual" ? (subtotal * Number(value || 0)) / 100 : Number(value || 0);
  const discount = round(Math.min(Math.max(rawDiscount, 0), subtotal));
  const hours = order.services.reduce((sum, line) => sum + Number(line.hours || 0), 0);
  return { parts, labor, subtotal, discount, total: round(subtotal - discount), hours };
}

/** "3x de R$ 560,00 sem juros no cartão de crédito" */
export function paymentCondition(order) {
  const { method, installments } = order.payment ?? {};
  if (!method) return "Forma de pagamento a definir.";
  const { total } = orderTotals(order);
  if (method === "credito" && installments > 1) {
    return `${installments}x de ${formatBRL(total / installments)} sem juros no cartão de crédito.`;
  }
  return `À vista via ${PAYMENT_METHODS[method].toLowerCase()}.`;
}

export const warrantyLabel = (key) => WARRANTIES[key] ?? "—";

/* ----------------------------------------------------------------------------
 * Progresso e estoque
 * -------------------------------------------------------------------------- */

export function servicesProgress(order) {
  const total = order.services.length;
  const done = order.services.filter((line) => line.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function quotedProgress(order) {
  const total = order.parts.length;
  const quoted = order.parts.filter((line) => line.quoted).length;
  return { quoted, total, pct: total ? Math.round((quoted / total) * 100) : 0 };
}

/**
 * Situação da peça no almoxarifado (partsByCode vem de useEstoque()):
 * - ok: pronta entrega · baixo: estoque abaixo do mínimo após a baixa
 * - encomenda: quantidade insuficiente · avulsa: fora do catálogo
 */
export function partStock(line, partsByCode) {
  const item = partsByCode.get(line.code);
  if (!item) return { state: "avulsa", stock: null, note: "" };
  if (item.stock < line.qty) return { state: "encomenda", stock: item.stock, note: item.note };
  if (item.stock - line.qty < item.minStock) return { state: "baixo", stock: item.stock, note: item.note };
  return { state: "ok", stock: item.stock, note: item.note };
}

/** Peças que ainda não chegaram (sem estoque suficiente). */
export function missingParts(order, partsByCode) {
  return order.parts.filter((line) => partStock(line, partsByCode).state === "encomenda");
}

/* ----------------------------------------------------------------------------
 * Datas
 * -------------------------------------------------------------------------- */

/** Tempo curto para os cards: "Agora", "Há 25min", "Há 3h", "Ontem", "Há 4d". */
export function timeShort(isoDateTime) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDateTime)) / 60_000));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Ontem" : `Há ${days}d`;
}

/** Tempo até a data: "em 5h", "em 2d", "há 3h" (atrasado). */
export function timeUntil(isoDateTime) {
  const minutes = Math.round((new Date(isoDateTime) - Date.now()) / 60_000);
  const abs = Math.abs(minutes);
  const text = abs < 60 ? `${abs}min` : abs < 1440 ? `${Math.floor(abs / 60)}h` : `${Math.floor(abs / 1440)}d`;
  return minutes >= 0 ? `em ${text}` : `há ${text}`;
}

export function isOverdue(order) {
  return isActive(order) && order.status !== "pronta" && Boolean(order.expectedAt) && new Date(order.expectedAt) < Date.now();
}

/** "14/10/2026 às 08:30" */
export function formatDateTimeShort(isoDateTime) {
  if (!isoDateTime) return "—";
  const date = new Date(isoDateTime);
  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Valor para <input type="datetime-local"> (fuso local). */
export function toDateTimeLocal(isoDateTime) {
  if (!isoDateTime) return "";
  const date = new Date(isoDateTime);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : null;
}

/* ----------------------------------------------------------------------------
 * Fluxo de etapas
 * -------------------------------------------------------------------------- */

/**
 * Diz se a OS pode ir para a etapa `status`.
 * Retorna { ok, reason } ou { ok: true, action: "cancel" | "deliver" } quando a
 * mudança precisa de um pop-up (cancelamento ou entrega).
 */
export function canMoveTo(order, status) {
  if (order.status === status) return { ok: false, reason: "" };
  if (isClosed(order)) {
    return { ok: false, reason: `A OS ${formatOrderNumber(order.number)} já foi encerrada e não pode mudar de etapa.` };
  }

  const progress = servicesProgress(order);

  switch (status) {
    case "cancelada":
      return { ok: true, action: "cancel" };
    case "aprovacao":
      return order.services.length || order.parts.length
        ? { ok: true }
        : { ok: false, reason: "Adicione peças ou serviços ao orçamento antes de enviá-lo para aprovação." };
    case "execucao":
      if (!order.services.length) return { ok: false, reason: "Adicione ao menos um serviço antes de iniciar a execução." };
      if (order.approval.status !== "aprovado") {
        return { ok: false, reason: "Registre a aprovação do orçamento (aba Fechamento) antes de iniciar a execução." };
      }
      return { ok: true };
    case "aguardando_pecas":
      return order.parts.length ? { ok: true } : { ok: false, reason: "A OS não tem peças para aguardar." };
    case "pronta":
      if (!progress.total) return { ok: false, reason: "Adicione os serviços executados antes de finalizar." };
      return progress.done === progress.total
        ? { ok: true }
        : { ok: false, reason: `Conclua todos os serviços antes de finalizar (${progress.done}/${progress.total} concluídos).` };
    case "entregue":
      if (progress.total && progress.done < progress.total) {
        return { ok: false, reason: `Conclua todos os serviços antes da entrega (${progress.done}/${progress.total} concluídos).` };
      }
      return { ok: true, action: "deliver" };
    default:
      return { ok: true };
  }
}

/* ----------------------------------------------------------------------------
 * Busca, filtros e indicadores
 * -------------------------------------------------------------------------- */

export function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Enriquece as OS com veículo e cliente (para busca, cards e exportação). */
export function withRelations(orders, vehiclesById, clientsById) {
  return orders.map((order) => ({
    ...order,
    vehicle: vehiclesById.get(order.vehicleId) ?? null,
    client: clientsById.get(order.clientId) ?? null,
  }));
}

function matchesSearch(order, query) {
  const text = normalize(query.trim().replace(/^#/, ""));
  if (!text) return true;
  if (String(order.number).includes(text)) return true;

  const haystack = normalize(
    [
      order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "",
      order.client?.name,
      orderTitle(order),
      order.complaint,
    ].join(" "),
  );
  if (haystack.includes(text)) return true;

  const compact = text.replace(/[^a-z0-9]/g, "");
  return compact.length >= 3 && normalize(order.vehicle?.plate).replace(/[^a-z0-9]/g, "").includes(compact);
}

/**
 * Filtros da tela.
 * - status: "ativas" | "todas" | uma etapa (usado só na lista)
 * - board: true aplica a janela de entregas recentes do quadro
 */
export function filterOrders(orders, { search, mechanic, priority, hideCanceled, status = "todas", board = false }) {
  const recentLimit = Date.now() - DELIVERED_WINDOW_DAYS * DAY;

  return orders.filter((order) => {
    if (hideCanceled && order.status === "cancelada") return false;
    if (mechanic && order.mechanicId !== mechanic) return false;
    if (priority && order.priority !== priority) return false;
    if (status === "ativas" && !isActive(order)) return false;
    if (status !== "ativas" && status !== "todas" && order.status !== status) return false;
    if (board && order.status === "entregue" && new Date(order.deliveredAt) < recentLimit) return false;
    if (board && order.status === "cancelada" && new Date(order.canceledAt) < recentLimit) return false;
    return matchesSearch(order, search);
  });
}

/** Boxes ocupados por OS no pátio: Map(boxId -> OS). */
export function boxUsage(orders) {
  return new Map(
    orders
      .filter((order) => order.boxId && isActive(order) && order.status !== "pronta")
      .map((order) => [order.boxId, order]),
  );
}

/** Indicadores do topo e do rodapé. */
export function computeOrderStats(orders) {
  const now = Date.now();
  const active = orders.filter(isActive);
  const delivered30 = orders.filter(
    (order) => order.status === "entregue" && now - new Date(order.deliveredAt) <= 30 * DAY,
  );
  const leadTime = delivered30.length
    ? delivered30.reduce((sum, order) => sum + (new Date(order.deliveredAt) - new Date(order.openedAt)), 0) /
      delivered30.length /
      DAY
    : 0;

  const opened90 = orders.filter((order) => now - new Date(order.openedAt) <= 90 * DAY && order.status !== "cancelada");
  const rework = opened90.length
    ? (opened90.filter((order) => order.type === "garantia").length / opened90.length) * 100
    : 0;

  const boxes = boxUsage(orders);

  return {
    active: active.length,
    canceled: orders.filter((order) => order.status === "cancelada").length,
    leadTime,
    leadTimeDelta: leadTime - LEAD_TIME_GOAL,
    wipValue: active.reduce((sum, order) => sum + orderTotals(order).total, 0),
    rework,
    reworkLabel: rework <= 2 ? "SLA Excelente" : rework <= 5 ? "Dentro da meta" : "Acima da meta",
    boxesBusy: boxes.size,
    boxesTotal: BOXES.length,
    waitingParts: orders.filter((order) => order.status === "aguardando_pecas").length,
    overdue: active.filter(isOverdue).length,
  };
}

/* ----------------------------------------------------------------------------
 * Mensagens e exportação
 * -------------------------------------------------------------------------- */

/** Texto do orçamento para enviar pelo WhatsApp. */
export function buildQuoteMessage(order, vehicle, client) {
  const totals = orderTotals(order);
  const lines = [
    `Olá, ${firstName(client?.name)}! Aqui é da oficina Salvô. 🚗`,
    `Segue o orçamento da OS ${formatOrderNumber(order.number)} — ${vehicle.brand} ${vehicle.model} (${maskPlate(vehicle.plate)}):`,
    "",
    ...order.services.map((line) => `• ${line.description}: ${formatBRL(line.price)}`),
    ...order.parts.map((line) => `• ${line.qty}x ${line.description}: ${formatBRL(line.qty * line.unitPrice)}`),
    "",
    totals.discount ? `Desconto: -${formatBRL(totals.discount)}` : null,
    `*Total: ${formatBRL(totals.total)}*`,
    `Garantia: ${warrantyLabel(order.warranty)}`,
    "",
    "Podemos seguir com o serviço? Responda *SIM* para aprovar.",
  ];
  return lines.filter((line) => line !== null).join("\n");
}

/** Aviso de veículo pronto. */
export function buildReadyMessage(order, vehicle, client) {
  return [
    `Olá, ${firstName(client?.name)}! Seu ${vehicle.brand} ${vehicle.model} (${maskPlate(vehicle.plate)}) está pronto para retirada. ✅`,
    `OS ${formatOrderNumber(order.number)} — total ${formatBRL(orderTotals(order).total)}.`,
    "Estamos abertos de segunda a sexta, das 8h às 18h, e sábado das 8h às 12h.",
  ].join("\n");
}

export function whatsappLink(phone, text) {
  return `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
}

export const CSV_HEADERS = [
  "OS",
  "Abertura",
  "Etapa",
  "Prioridade",
  "Placa",
  "Veículo",
  "Cliente",
  "Tipo de atendimento",
  "Mecânico",
  "Box",
  "Previsão de entrega",
  "Peças (R$)",
  "Mão de obra (R$)",
  "Desconto (R$)",
  "Total (R$)",
];

export function toCsvRows(orders) {
  const money = (value) => value.toFixed(2).replace(".", ",");
  return orders.map((order) => {
    const totals = orderTotals(order);
    return [
      order.number,
      formatDateTimeShort(order.openedAt),
      STATUS[order.status].label,
      PRIORITIES[order.priority].label,
      order.vehicle ? maskPlate(order.vehicle.plate) : "",
      order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "",
      order.client?.name ?? "",
      SERVICE_TYPES[order.type] ?? "",
      mechanicName(order.mechanicId),
      boxName(order.boxId),
      order.expectedAt ? formatDateTimeShort(order.expectedAt) : "",
      money(totals.parts),
      money(totals.labor),
      money(totals.discount),
      money(totals.total),
    ];
  });
}

/** "Hoje, 17:30" · "Amanhã, 09:00" · "12/10, 17:00" */
export function formatForecast(isoDateTime) {
  if (!isoDateTime) return "A definir";
  const date = new Date(isoDateTime);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return `Hoje, ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Amanhã, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

/** A vistoria tem todos os itens preenchidos? Quantos pedem atenção? */
export function inspectionSummary(inspection) {
  const values = Object.values(inspection.checklist ?? {});
  return {
    checked: values.length,
    flagged: values.filter((value) => value !== "ok").length + (inspection.damages?.length ?? 0),
  };
}

/**
 * Próximo passo sugerido para a OS (botão de destaque no resumo).
 * Retorna { label, status } para mudar de etapa ou { label, tab } para abrir uma aba.
 */
export function nextStep(order) {
  switch (order.status) {
    case "aberta":
      return order.inspection.done
        ? { label: "Iniciar Orçamento", status: "orcamento" }
        : { label: "Fazer Vistoria de Entrada", tab: "vistoria" };
    case "orcamento":
      return { label: "Enviar para Aprovação", tab: "fechamento" };
    case "aprovacao":
      return { label: "Registrar Aprovação", tab: "fechamento" };
    case "execucao": {
      const { done, total } = servicesProgress(order);
      return done === total && total
        ? { label: "Finalizar Serviços", status: "pronta" }
        : { label: `Acompanhar Serviços (${done}/${total})`, tab: "diagnostico" };
    }
    case "aguardando_pecas":
      return { label: "Peças Chegaram — Retomar", status: "execucao" };
    case "pronta":
      return { label: "Registrar Entrega", status: "entregue" };
    default:
      return null;
  }
}

let idSeq = 0;
/** Identificador local para linhas novas (a API definirá o id definitivo). */
export function createId(prefix) {
  idSeq += 1;
  return `${prefix}${Date.now().toString(36)}${idSeq}`;
}

/** Junta peças novas às existentes: mesmo código soma a quantidade. */
export function mergeParts(existing, lines) {
  const result = [...existing];
  lines.forEach((line) => {
    const index = line.code ? result.findIndex((item) => item.code === line.code) : -1;
    if (index >= 0) result[index] = { ...result[index], qty: result[index].qty + line.qty };
    else result.push(line);
  });
  return result;
}
