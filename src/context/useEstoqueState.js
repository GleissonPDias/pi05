import { useCallback, useMemo, useState } from "react";
import { PARTS_CATALOG } from "../mocks/catalogo";
import { movimentacoesMock } from "../mocks/estoque";
import { currentOperator } from "../mocks/user";

let seq = 0;
const now = () => new Date().toISOString();
const round = (value) => Math.round(value * 100) / 100;

/**
 * Estoque (almoxarifado): peças e movimentações (usado pelo AppProviders).
 *
 * Toda alteração de quantidade passa por registerMovement, que grava o
 * histórico (entrada, saída, ajuste de inventário ou devolução) e recalcula o
 * custo médio nas entradas.
 *
 * TODO: ao integrar com a API (Spring Boot), troque o corpo das funções por
 * chamadas HTTP mantendo as assinaturas. Sugestão de rotas:
 * GET/POST/PUT/DELETE /pecas · POST /estoque/movimentacoes · POST /compras/pedidos
 */
export function useEstoqueState() {
  const [parts, setParts] = useState(PARTS_CATALOG);
  const [movements, setMovements] = useState(movimentacoesMock);

  const partsByCode = useMemo(() => new Map(parts.map((part) => [part.code, part])), [parts]);

  const stamp = () => ({ updatedAt: now(), updatedBy: currentOperator });

  const makeMovement = (data) => {
    seq += 1;
    return { id: `MV-N${Date.now()}${seq}`, at: now(), by: currentOperator, unitCost: null, supplierId: null, orderNumber: null, note: "", document: "", ...data };
  };

  /** Cadastra uma peça (com saldo inicial opcional). */
  const createPart = useCallback((data) => {
    const { stock = 0, ...rest } = data;
    const part = { onOrder: null, status: "ativo", ...rest, stock, ...stamp() };
    setParts((current) => [...current, part]);
    if (stock > 0) {
      setMovements((current) => [
        ...current,
        makeMovement({ code: part.code, type: "entrada", qty: stock, balance: stock, unitCost: part.cost, document: "Saldo inicial", note: "Cadastro da peça" }),
      ]);
    }
    return part;
  }, []);

  const updatePart = useCallback((code, data) => {
    setParts((current) => current.map((part) => (part.code === code ? { ...part, ...data, ...stamp() } : part)));
  }, []);

  const deletePart = useCallback((code) => {
    setParts((current) => current.filter((part) => part.code !== code));
    setMovements((current) => current.filter((movement) => movement.code !== code));
  }, []);

  /**
   * Registra uma movimentação e atualiza o saldo.
   * - entrada / devolucao: soma `qty` · saida: subtrai `qty`
   * - ajuste: `qty` é a NOVA contagem física (inventário)
   * Retorna o movimento gravado (ou null se a peça não existir).
   */
  const registerMovement = useCallback(
    ({ code, type, qty, unitCost, ...extra }) => {
      const part = partsByCode.get(code);
      if (!part) return null;

      const delta = type === "ajuste" ? qty - part.stock : type === "saida" ? -qty : qty;
      const balance = Math.max(0, part.stock + delta);
      const patch = { stock: balance };

      if (type === "entrada" && unitCost) {
        // Custo médio ponderado
        const totalQty = Math.max(0, part.stock) + qty;
        patch.cost = round((Math.max(0, part.stock) * part.cost + qty * unitCost) / totalQty);
      }
      if (type === "entrada" && part.onOrder) {
        const remaining = part.onOrder.qty - qty;
        patch.onOrder = remaining > 0 ? { ...part.onOrder, qty: remaining } : null;
      }

      const movement = makeMovement({ code, type, qty: delta, balance, unitCost: unitCost ?? null, ...extra });
      setParts((current) => current.map((item) => (item.code === code ? { ...item, ...patch, ...stamp() } : item)));
      setMovements((current) => [...current, movement]);
      return movement;
    },
    [partsByCode],
  );

  /** Baixa automática das peças de uma OS entregue. Retorna quantas linhas baixou. */
  const consumeForOrder = useCallback(
    (order) => {
      const balances = new Map();
      const created = [];
      order.parts.forEach((line) => {
        const part = line.code && partsByCode.get(line.code);
        if (!part) return;
        const balance = Math.max(0, (balances.get(line.code) ?? part.stock) - line.qty);
        balances.set(line.code, balance);
        created.push(
          makeMovement({
            code: line.code,
            type: "saida",
            qty: -line.qty,
            balance,
            document: `OS #${order.number}`,
            orderNumber: order.number,
            note: "Baixa automática na entrega",
          }),
        );
      });
      if (!created.length) return 0;
      setParts((current) =>
        current.map((part) => (balances.has(part.code) ? { ...part, stock: balances.get(part.code), ...stamp() } : part)),
      );
      setMovements((current) => [...current, ...created]);
      return created.length;
    },
    [partsByCode],
  );

  /** Registra pedidos de compra enviados: items = [{ code, qty }]. */
  const placeOrder = useCallback((items, supplierId) => {
    const orderedAt = now();
    setParts((current) =>
      current.map((part) => {
        const item = items.find((entry) => entry.code === part.code);
        if (!item) return part;
        const qty = (part.onOrder?.qty ?? 0) + item.qty;
        return { ...part, onOrder: { qty, supplierId, orderedAt }, ...stamp() };
      }),
    );
  }, []);

  return { parts, partsByCode, movements, createPart, updatePart, deletePart, registerMovement, consumeForOrder, placeOrder };
}
