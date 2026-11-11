import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { toISODate } from "../../utils/dates";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Data de referência de um lançamento pago: `pagoEm` ou, na falta, o vencimento. */
function paidKey(item) {
  if (item.pagoEm) return toISODate(new Date(item.pagoEm));
  return item.vencimento ?? null;
}

/**
 * Fluxo financeiro dos últimos 7 dias a partir dos lançamentos pagos/recebidos.
 * A variação compara com os 7 dias anteriores.
 */
export function buildWeeklyFinance(pagamentos, despesas, today = new Date()) {
  const received = new Map();
  const spent = new Map();
  const addTo = (map, key, value) => map.set(key, (map.get(key) ?? 0) + value);

  pagamentos
    .filter((item) => item.status === "PAGO")
    .forEach((item) => addTo(received, paidKey(item), Number(item.valor) || 0));
  despesas
    .filter((item) => item.status === "PAGO")
    .forEach((item) => addTo(spent, paidKey(item), Number(item.valor) || 0));

  const dayAt = (offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    return { key: toISODate(date), name: DAY_NAMES[date.getDay()] };
  };

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const { key, name } = dayAt(offset);
    days.push({
      day: name,
      revenue: Math.round(received.get(key) ?? 0),
      expenses: Math.round(spent.get(key) ?? 0),
    });
  }

  const sumRange = (map, from, to) => {
    let total = 0;
    for (let offset = from; offset <= to; offset += 1) total += map.get(dayAt(offset).key) ?? 0;
    return total;
  };

  const revenue = sumRange(received, 0, 6);
  const expenses = sumRange(spent, 0, 6);
  const previousRevenue = sumRange(received, 7, 13);
  const revenueGrowth = previousRevenue > 0 ? Math.round(((revenue - previousRevenue) / previousRevenue) * 1000) / 10 : 0;

  return {
    summary: {
      revenue: Math.round(revenue),
      revenueGrowth,
      expenses: Math.round(expenses),
      balance: Math.round(revenue - expenses),
    },
    days,
  };
}

/** Carrega pagamentos e despesas (somente administrador, modo API). */
export function useWeeklyFinance(enabled) {
  const [finance, setFinance] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    queueMicrotask(async () => {
      try {
        const [pagamentos, despesas] = await Promise.all([api.pagamentos.list(), api.despesas.list()]);
        if (active) {
          setFinance(
            buildWeeklyFinance(
              Array.isArray(pagamentos) ? pagamentos : [],
              Array.isArray(despesas) ? despesas : [],
            ),
          );
        }
      } catch {
        // O banner global já mostra o erro da API; o card mostra zeros.
      }
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return finance ?? buildWeeklyFinance([], []);
}
