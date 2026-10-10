import { PARTS_CATALOG } from "./catalogo";
import { currentOperator } from "./user";
import { ordensMock } from "./ordens";

/*
 * Movimentações de estoque fictícias.
 * TODO: substituir por chamadas à API (Spring Boot).
 *
 * - type: entrada | saida | ajuste | devolucao
 * - qty: quantidade com sinal (+ entra, − sai) · balance: saldo após o movimento
 * - document: NF, OS ou motivo · orderNumber: OS relacionada (saídas)
 *
 * As saídas vêm das OS já entregues (mocks/ordens.js). Uma entrada de compra
 * anterior completa o histórico de cada peça.
 */

const DAY = 86_400_000;
const iso = (ms) => new Date(ms).toISOString();

function buildMovements() {
  const exits = [];
  ordensMock
    .filter((order) => order.status === "entregue")
    .forEach((order) =>
      order.parts.forEach((line) => {
        if (!PARTS_CATALOG.some((part) => part.code === line.code)) return;
        exits.push({
          code: line.code,
          at: order.deliveredAt,
          type: "saida",
          qty: -line.qty,
          unitCost: null,
          document: `OS #${order.number}`,
          orderNumber: order.number,
          note: "Baixa automática na entrega",
        });
      }),
    );

  const all = [];
  PARTS_CATALOG.forEach((part, index) => {
    const partExits = exits.filter((exit) => exit.code === part.code);
    const used = partExits.reduce((sum, exit) => sum - exit.qty, 0);
    const firstExit = partExits.reduce((min, exit) => (exit.at < min ? exit.at : min), iso(Date.now()));
    const purchaseAt = iso(new Date(firstExit).getTime() - (3 + (index % 5)) * DAY);
    const entries = [];

    if (part.stock + used > 0) {
      entries.push({
        code: part.code,
        at: purchaseAt,
        type: "entrada",
        qty: part.stock + used,
        unitCost: part.cost,
        document: `NF ${48210 + index * 7}`,
        supplierId: part.supplierId,
        note: "Compra de reposição",
      });
    }

    [...entries, ...partExits]
      .sort((a, b) => a.at.localeCompare(b.at))
      .reduce((balance, movement) => {
        const next = balance + movement.qty;
        all.push({ ...movement, balance: next });
        return next;
      }, 0);
  });

  return all
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((movement, index) => ({ id: `MV-${String(index + 1).padStart(4, "0")}`, by: currentOperator, supplierId: null, ...movement }));
}

export const movimentacoesMock = buildMovements();
