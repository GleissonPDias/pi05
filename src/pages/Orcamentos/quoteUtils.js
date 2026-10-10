import { formatBRL } from "../../utils/format";
import { maskPlate } from "../../utils/masks";
import { normalize, orderTotals, warrantyLabel } from "../OrdensServico/ordemUtils";
import { FOLLOW_UP_HOURS, QUOTE_STATUS } from "./constants";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Situação exibida (ver QUOTE_STATUS). */
export function displayStatus(quote) {
  if (quote.status === "enviado") return new Date(quote.validUntil) < Date.now() ? "vencido" : "aguardando";
  if (quote.status === "aprovado") return quote.orderNumber ? "convertido" : "aprovado";
  return quote.status;
}

/** Totais (mesma regra das OS: peças + mão de obra − desconto). */
export const quoteTotals = (quote) => orderTotals(quote);

/** Pode editar itens e condições? (rascunho, aguardando ou vencido) */
export const isEditable = (quote) => ["rascunho", "aguardando", "vencido"].includes(displayStatus(quote));

/** Enviado há mais de 48h sem resposta (e ainda válido). */
export function needsFollowUp(quote) {
  return displayStatus(quote) === "aguardando" && Date.now() - new Date(quote.sentAt) > FOLLOW_UP_HOURS * HOUR;
}

/** Resumo exibido na lista: título ou o primeiro serviço. */
export function quoteTitle(quote) {
  return quote.title || quote.services[0]?.description || quote.parts[0]?.description || "Orçamento";
}

const shortDate = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const days = (ms) => Math.max(0, Math.ceil(ms / DAY));

/**
 * Linha de validade: { text, tone }
 * "Válido até 28/10 (5 dias)" · "Expira em 1 dia (24/10)" · "Vencido há 4 dias (20/10)" · "Finalizado em 18/10"
 */
export function validityInfo(quote) {
  const status = displayStatus(quote);
  if (["aprovado", "convertido", "rejeitado"].includes(status)) {
    return { text: `Finalizado em ${shortDate(quote.decidedAt)}`, tone: "slate", icon: "done" };
  }
  if (status === "rascunho") return { text: `Validade de ${quote.validityDays} dias após o envio`, tone: "slate", icon: "draft" };
  const diff = new Date(quote.validUntil) - Date.now();
  if (diff < 0) {
    const late = days(-diff);
    return { text: `Vencido há ${late} ${late === 1 ? "dia" : "dias"} (${shortDate(quote.validUntil)})`, tone: "red", icon: "expired" };
  }
  const left = days(diff);
  if (left <= 2) return { text: `Expira em ${left} ${left === 1 ? "dia" : "dias"} (${shortDate(quote.validUntil)})`, tone: "amber", icon: "soon" };
  return { text: `Válido até ${shortDate(quote.validUntil)} (${left} dias)`, tone: "green", icon: "ok" };
}

/* ----------------------------------------------------------------------------
 * Filtros e indicadores
 * -------------------------------------------------------------------------- */

/** Início do período (null = todo o período). */
export function periodStart(period) {
  const now = new Date();
  if (period === "mes") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (period === "30d") return Date.now() - 30 * DAY;
  if (period === "90d") return Date.now() - 90 * DAY;
  return null;
}

/** Período anterior de mesmo tamanho (para comparação). */
function previousRange(period) {
  const now = new Date();
  if (period === "mes") {
    return [new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(), new Date(now.getFullYear(), now.getMonth(), 1).getTime()];
  }
  const size = period === "30d" ? 30 * DAY : period === "90d" ? 90 * DAY : null;
  return size ? [Date.now() - 2 * size, Date.now() - size] : null;
}

export function inPeriod(quote, period) {
  const start = periodStart(period);
  return start === null || new Date(quote.issuedAt).getTime() >= start;
}

/** Junta cliente e veículo ao orçamento. */
export function withRelations(quotes, vehiclesById, clientsById) {
  return quotes.map((quote) => ({
    ...quote,
    vehicle: vehiclesById.get(quote.vehicleId) ?? null,
    client: clientsById.get(quote.clientId) ?? null,
  }));
}

export function filterQuotes(quotes, { search, status, seller, period, followUp }) {
  const text = normalize(search.trim());
  const compact = text.replace(/[^a-z0-9]/g, "");
  return quotes.filter((quote) => {
    if (!inPeriod(quote, period)) return false;
    if (seller && quote.sellerId !== seller) return false;
    const current = displayStatus(quote);
    if (status === "aprovado" && !["aprovado", "convertido"].includes(current)) return false;
    if (status !== "todos" && status !== "aprovado" && current !== status) return false;
    if (followUp && !needsFollowUp(quote)) return false;
    if (!text) return true;
    const haystack = normalize(
      [quote.id, quote.number, quote.client?.name, quote.vehicle?.brand, quote.vehicle?.model, quoteTitle(quote)].join(" "),
    );
    if (haystack.includes(text)) return true;
    return compact.length >= 3 && normalize(quote.vehicle?.plate).replace(/[^a-z0-9]/g, "").includes(compact);
  });
}

/** Contadores dos chips (respeitando período, vendedor e busca). */
export function countByStatus(quotes) {
  const counts = { todos: quotes.length, aguardando: 0, aprovado: 0, rejeitado: 0, vencido: 0, rascunho: 0 };
  quotes.forEach((quote) => {
    const status = displayStatus(quote);
    counts[status === "convertido" ? "aprovado" : status] += 1;
  });
  return counts;
}

/** Indicadores do topo e funil (sobre os orçamentos do período). */
export function computeQuoteStats(allQuotes, { period, seller }) {
  const scoped = allQuotes.filter((quote) => !seller || quote.sellerId === seller);
  const quotes = scoped.filter((quote) => inPeriod(quote, period) && quote.status !== "rascunho");
  const total = quotes.reduce((sum, quote) => sum + quoteTotals(quote).total, 0);

  const range = previousRange(period);
  const previousTotal = range
    ? scoped
        .filter((quote) => quote.status !== "rascunho")
        .filter((quote) => {
          const time = new Date(quote.issuedAt).getTime();
          return time >= range[0] && time < range[1];
        })
        .reduce((sum, quote) => sum + quoteTotals(quote).total, 0)
    : 0;

  const byStatus = (list) => quotes.filter((quote) => list.includes(displayStatus(quote)));
  const approved = byStatus(["aprovado", "convertido"]);
  const finished = byStatus(["aprovado", "convertido", "rejeitado", "vencido"]);
  const decided = quotes.filter((quote) => quote.decidedAt && quote.sentAt);
  const pending = byStatus(["aguardando"]);

  return {
    total,
    change: previousTotal ? ((total - previousTotal) / previousTotal) * 100 : null,
    conversion: finished.length ? (approved.length / finished.length) * 100 : 0,
    finished: finished.length,
    approvedCount: approved.length,
    ticket: approved.length ? approved.reduce((sum, quote) => sum + quoteTotals(quote).total, 0) / approved.length : 0,
    responseHours: decided.length
      ? decided.reduce((sum, quote) => sum + (new Date(quote.decidedAt) - new Date(quote.sentAt)), 0) / decided.length / HOUR
      : 0,
    funnel: {
      sent: quotes.length,
      viewed: quotes.filter((quote) => quote.viewedAt || quote.decidedAt).length,
      approved: approved.length,
      converted: byStatus(["convertido"]).length,
    },
    pipeline: pending.reduce((sum, quote) => sum + quoteTotals(quote).total, 0),
    pendingCount: pending.length,
    followUps: quotes.filter(needsFollowUp).length,
  };
}

/* ----------------------------------------------------------------------------
 * Mensagens e exportação
 * -------------------------------------------------------------------------- */

const firstName = (name = "") => name.split(" ")[0];

export function buildProposalMessage(quote) {
  const totals = quoteTotals(quote);
  const { vehicle, client } = quote;
  return [
    `Olá, ${firstName(client?.name)}! Aqui é da oficina Salvô. 🚗`,
    `Segue a proposta ${quote.id} para o seu ${vehicle.brand} ${vehicle.model} (${maskPlate(vehicle.plate)}):`,
    "",
    ...quote.services.map((line) => `• ${line.description}: ${formatBRL(line.price)}`),
    ...quote.parts.map((line) => `• ${line.qty}x ${line.description}: ${formatBRL(line.qty * line.unitPrice)}`),
    "",
    totals.discount ? `Desconto: -${formatBRL(totals.discount)}` : null,
    `*Total: ${formatBRL(totals.total)}*`,
    `Válido até ${new Date(quote.validUntil).toLocaleDateString("pt-BR")}.`,
    "",
    "Responda *SIM* para aprovar e agendarmos o serviço.",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function buildFollowUpMessage(quote) {
  return [
    `Olá, ${firstName(quote.client?.name)}! Tudo bem?`,
    `Passando para saber se conseguiu avaliar a proposta ${quote.id} (${quoteTitle(quote)}), no valor de ${formatBRL(quoteTotals(quote).total)}.`,
    "Se tiver qualquer dúvida, estamos à disposição. Podemos agendar?",
  ].join("\n");
}

export { warrantyLabel };

export const CSV_HEADERS = ["Orçamento", "Emissão", "Validade", "Situação", "Cliente", "Placa", "Veículo", "Resumo", "Peças (R$)", "Mão de obra (R$)", "Desconto (R$)", "Total (R$)", "Motivo da rejeição", "OS gerada"];

export function toCsvRows(quotes) {
  const money = (value) => value.toFixed(2).replace(".", ",");
  return quotes.map((quote) => {
    const totals = quoteTotals(quote);
    return [
      quote.id,
      new Date(quote.issuedAt).toLocaleDateString("pt-BR"),
      new Date(quote.validUntil).toLocaleDateString("pt-BR"),
      QUOTE_STATUS[displayStatus(quote)].label,
      quote.client?.name ?? "",
      quote.vehicle ? maskPlate(quote.vehicle.plate) : "",
      quote.vehicle ? `${quote.vehicle.brand} ${quote.vehicle.model}` : "",
      quoteTitle(quote),
      money(totals.parts),
      money(totals.labor),
      money(totals.discount),
      money(totals.total),
      quote.rejectReason,
      quote.orderNumber ? `#${quote.orderNumber}` : "",
    ];
  });
}
