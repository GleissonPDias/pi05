import { normalize } from "../ordemUtils";
import { WARRANTIES } from "../constants";

/** Valor-hora de referência da oficina (usado para sugerir preços). */
export const LABOR_RATE = 160;

export const PAGE_SIZE = 8;

const DAY = 86_400_000;

/**
 * Uso de cada serviço: Map(código -> { count90, revenue90, total, lastUsed }).
 * - count90 / revenue90: OS (não canceladas) abertas nos últimos 90 dias
 * - total: quantas vezes aparece em OS e orçamentos (qualquer data)
 */
export function serviceUsage(orders, quotes = []) {
  const usage = new Map();
  const get = (code) => {
    if (!usage.has(code)) usage.set(code, { count90: 0, revenue90: 0, total: 0, lastUsed: null });
    return usage.get(code);
  };
  const now = Date.now();

  orders.forEach((order) => {
    order.services.forEach((line) => {
      if (!line.code) return;
      const item = get(line.code);
      item.total += 1;
      if (order.status !== "cancelada" && now - new Date(order.openedAt) <= 90 * DAY) {
        item.count90 += 1;
        item.revenue90 += Number(line.price || 0);
      }
      if (!item.lastUsed || order.openedAt > item.lastUsed) item.lastUsed = order.openedAt;
    });
  });
  quotes.forEach((quote) => quote.services.forEach((line) => line.code && (get(line.code).total += 1)));
  return usage;
}

/** Valor por hora do serviço (null quando não há tempo). */
export function hourlyRate(service) {
  return service.hours > 0 ? service.price / service.hours : null;
}

export function filterServices(services, { search, category, status }) {
  const text = normalize(search.trim());
  return services.filter((service) => {
    if (category && service.category !== category) return false;
    if (status !== "todos" && service.status !== status) return false;
    if (!text) return true;
    return normalize(`${service.code} ${service.description} ${service.detail} ${service.category}`).includes(text);
  });
}

/** Indicadores do topo. */
export function computeServiceStats(services, orders, usage) {
  const active = services.filter((service) => service.status === "ativo");
  const top = [...usage.entries()]
    .filter(([code]) => services.some((service) => service.code === code))
    .sort((a, b) => b[1].count90 - a[1].count90)[0];
  const topService = top ? services.find((service) => service.code === top[0]) : null;

  const now = Date.now();
  const laborMonth = orders
    .filter((order) => order.status === "entregue" && now - new Date(order.deliveredAt) <= 30 * DAY)
    .reduce((sum, order) => sum + order.services.reduce((acc, line) => acc + Number(line.price || 0), 0), 0);

  const rates = active.map(hourlyRate).filter((rate) => rate && rate > 0);
  const avgRate = rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;

  return {
    active: active.length,
    inactive: services.length - active.length,
    topService,
    topCount: top ? top[1].count90 : 0,
    laborMonth,
    avgRate,
  };
}

export const warrantyOptions = Object.entries(WARRANTIES).map(([value, label]) => ({ value, label }));

export const CSV_HEADERS = ["Código", "Serviço", "Detalhe", "Categoria", "Tempo padrão (h)", "Mão de obra (R$)", "Valor/hora (R$)", "Garantia", "Situação", "Uso 90 dias"];

export function toCsvRows(services, usage) {
  const money = (value) => (value ?? 0).toFixed(2).replace(".", ",");
  return services.map((service) => [
    service.code,
    service.description,
    service.detail,
    service.category,
    String(service.hours).replace(".", ","),
    money(service.price),
    money(hourlyRate(service)),
    WARRANTIES[service.warranty] ?? "",
    service.status === "ativo" ? "Ativo" : "Inativo",
    usage.get(service.code)?.count90 ?? 0,
  ]);
}

/** Validação do formulário de serviço. */
export function validateService(values, { services, currentCode }) {
  const errors = {};
  const description = values.description.trim();
  if (description.length < 5) errors.description = "Descreva o serviço (mínimo de 5 caracteres).";
  else if (
    services.some((service) => service.code !== currentCode && normalize(service.description) === normalize(description))
  ) {
    errors.description = "Já existe um serviço com esta descrição.";
  }
  if (!values.category) errors.category = "Selecione a categoria.";
  if (!(Number(values.hours) > 0)) errors.hours = "Informe o tempo padrão (em horas).";
  return errors;
}
