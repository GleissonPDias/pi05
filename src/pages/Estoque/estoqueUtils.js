import { SUPPLIERS } from "../../mocks/catalogo";
import { WORKSHOP } from "../../mocks/oficina";
import { formatBRL } from "../../utils/format";
import { ACTIVE_STATUSES } from "../OrdensServico/constants";
import { normalize } from "../OrdensServico/ordemUtils";

const DAY = 86_400_000;

export const suppliersById = new Map(SUPPLIERS.map((supplier) => [supplier.id, supplier]));

/** Peças reservadas por OS em andamento: Map(código -> quantidade). */
export function reservedByCode(orders) {
  const reserved = new Map();
  orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .forEach((order) =>
      order.parts.forEach((line) => {
        if (line.code) reserved.set(line.code, (reserved.get(line.code) ?? 0) + line.qty);
      }),
    );
  return reserved;
}

/**
 * Situação da peça considerando o que já está reservado para OS em andamento.
 * - critico: nada disponível · baixo: disponível no ponto de pedido ou abaixo
 */
export function stockStatus(part, reserved = 0) {
  const available = part.stock - reserved;
  if (part.status === "inativo") return { key: "inativo", available, toRestock: 0 };
  const toRestock = Math.max(0, part.minStock - available);
  if (available <= 0) return { key: "critico", available, toRestock: Math.max(toRestock, 1) };
  if (available <= part.minStock) return { key: "baixo", available, toRestock };
  return { key: "normal", available, toRestock: 0 };
}

/** Markup sobre o custo (%): 190 -> 380 = +100% */
export function markup(part) {
  return part.cost > 0 ? ((part.price - part.cost) / part.cost) * 100 : 0;
}

/** Margem bruta sobre a venda (%): 190 -> 380 = 50% */
export function grossMargin(part) {
  return part.price > 0 ? ((part.price - part.cost) / part.price) * 100 : 0;
}

/** Quantidade sugerida para compra (até o estoque ideal, descontando pedidos em aberto). */
export function suggestedQty(part, reserved = 0) {
  const available = part.stock - reserved;
  const target = Math.max(part.maxStock || 0, part.minStock * 2, 1);
  return Math.max(1, target - available - (part.onOrder?.qty ?? 0));
}

export function filterParts(parts, reserved, { search, status, category, supplier }) {
  const text = normalize(search.trim());
  return parts.filter((part) => {
    const current = stockStatus(part, reserved.get(part.code));
    if (status === "inativo") {
      if (part.status !== "inativo") return false;
    } else if (status !== "todos" && part.status === "inativo") {
      return false;
    }
    if (status === "baixo" && current.key !== "baixo") return false;
    if (status === "critico" && current.key !== "critico") return false;
    if (status === "pedido" && !part.onOrder) return false;
    if (category && part.category !== category) return false;
    if (supplier && part.supplierId !== supplier) return false;
    if (!text) return true;
    return normalize(
      [part.code, part.oem, part.description, part.brand, part.application, part.location, suppliersById.get(part.supplierId)?.name].join(" "),
    ).includes(text);
  });
}

/** Contadores dos chips. */
export function countParts(parts, reserved) {
  const counts = { todos: parts.length, baixo: 0, critico: 0, pedido: 0, inativo: 0 };
  parts.forEach((part) => {
    const status = stockStatus(part, reserved.get(part.code)).key;
    if (status === "baixo" || status === "critico" || status === "inativo") counts[status] += 1;
    if (part.onOrder) counts.pedido += 1;
  });
  return counts;
}

/** Indicadores do topo. */
export function computeStockStats(parts, reserved) {
  const active = parts.filter((part) => part.status !== "inativo");
  const statuses = active.map((part) => stockStatus(part, reserved.get(part.code)).key);
  const normal = statuses.filter((key) => key === "normal").length;
  return {
    total: parts.length,
    active: active.length,
    totalCost: active.reduce((sum, part) => sum + Math.max(0, part.stock) * part.cost, 0),
    projectedSale: active.reduce((sum, part) => sum + Math.max(0, part.stock) * part.price, 0),
    normal,
    normalPct: active.length ? (normal / active.length) * 100 : 0,
    low: statuses.filter((key) => key === "baixo").length,
    critical: statuses.filter((key) => key === "critico").length,
    reservedValue: [...reserved.entries()].reduce((sum, [code, qty]) => {
      const part = active.find((item) => item.code === code);
      return part ? sum + qty * part.cost : sum;
    }, 0),
  };
}

/** Consumo da peça (saídas) nos últimos `days` dias e cobertura em dias. */
export function consumption(part, movements, days = 90) {
  const since = Date.now() - days * DAY;
  const exits = movements
    .filter((movement) => movement.code === part.code && movement.qty < 0 && new Date(movement.at) >= since)
    .reduce((sum, movement) => sum - movement.qty, 0);
  const perDay = exits / days;
  return {
    exits,
    monthly: perDay * 30,
    coverageDays: perDay > 0 ? Math.floor(Math.max(0, part.stock) / perDay) : null,
  };
}

/** Mensagem de pedido de compra para o fornecedor (WhatsApp). */
export function buildPurchaseMessage(supplier, items) {
  return [
    `Olá, ${supplier.contact}! Aqui é da ${WORKSHOP.name}.`,
    "Gostaria de cotar/pedir os itens abaixo:",
    "",
    ...items.map((item) => `• ${item.qty} ${item.part.unit} — ${item.part.description} (${item.part.brand}${item.part.oem ? `, OEM ${item.part.oem}` : ""}) [${item.part.code}]`),
    "",
    `Valor de referência: ${formatBRL(items.reduce((sum, item) => sum + item.qty * item.part.cost, 0))}`,
    "Pode confirmar preço e prazo de entrega? Obrigado!",
  ].join("\n");
}

export const CSV_HEADERS = ["Código", "OEM", "Descrição", "Fabricante", "Categoria", "Aplicação", "Unidade", "Estoque", "Reservado", "Disponível", "Mínimo", "Máximo", "Localização", "Custo (R$)", "Venda (R$)", "Markup (%)", "Valor em estoque (R$)", "Fornecedor", "Situação"];

export function toCsvRows(parts, reserved) {
  const money = (value) => value.toFixed(2).replace(".", ",");
  return parts.map((part) => {
    const status = stockStatus(part, reserved.get(part.code));
    return [
      part.code,
      part.oem,
      part.description,
      part.brand,
      part.category,
      part.application,
      part.unit,
      part.stock,
      reserved.get(part.code) ?? 0,
      status.available,
      part.minStock,
      part.maxStock,
      part.location,
      money(part.cost),
      money(part.price),
      markup(part).toFixed(1).replace(".", ","),
      money(Math.max(0, part.stock) * part.cost),
      suppliersById.get(part.supplierId)?.name ?? "",
      status.key,
    ];
  });
}
