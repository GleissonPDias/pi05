import { useCallback, useEffect, useMemo, useState } from "react";
import { api, isDemo } from "../services/api";
import { registerParts } from "../services/catalogs";
import {
  mapFornecedor,
  mapMovimentacao,
  mapPeca,
  movimentacaoPayload,
  pecaCreatePayload,
  pecaUpdatePayload,
} from "../services/mappers";
import {
  KEYS,
  readList,
  readMap,
  writeList,
  writeMap,
} from "../services/storage";
import { PARTS_CATALOG, SUPPLIERS } from "../mocks/catalogo";
import { movimentacoesMock } from "../mocks/estoque";
import { currentOperator } from "../mocks/user";

let seq = 0;
const now = () => new Date().toISOString();
const round = (value) => Math.round(value * 100) / 100;
const stamp = () => ({ updatedAt: now(), updatedBy: currentOperator });

/** Persiste apenas o que a API ainda não guarda (pedidos em aberto). */
function persistPartOverlay(part) {
  if (isDemo() || !part?.code) return;
  writeMap(KEYS.parts, {
    ...readMap(KEYS.parts),
    [part.code]: {
      onOrder: part.onOrder ?? null,
      updatedAt: part.updatedAt ?? now(),
      updatedBy: part.updatedBy ?? currentOperator,
    },
  });
}

/**
 * Estoque (almoxarifado): peças e movimentações (usado pelo AppProviders).
 *
 * Cadastro, edição, exclusão lógica e movimentações usam a API. O saldo é
 * aplicado no banco pelo trigger da V4 (SELECT ... FOR UPDATE), inclusive
 * para a baixa automática das peças na entrega da OS.
 */
export function useEstoqueState() {
  const [parts, setParts] = useState(() => (isDemo() ? PARTS_CATALOG : []));
  const [suppliers, setSuppliers] = useState(() => (isDemo() ? SUPPLIERS : []));
  const [movements, setMovements] = useState(() => (isDemo() ? movimentacoesMock : []));
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));

  const partsByCode = useMemo(() => new Map(parts.map((part) => [part.code, part])), [parts]);

  const load = useCallback(async () => {
    if (isDemo()) {
      registerParts(PARTS_CATALOG);
      setParts(PARTS_CATALOG);
      setSuppliers(SUPPLIERS);
      setMovements(movimentacoesMock);
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [dtos, overlays, locals, deleted, apiMovements, storedMovements, apiSuppliers] = await Promise.all([
        api.pecas.list(),
        Promise.resolve(readMap(KEYS.parts)),
        Promise.resolve(readList(KEYS.localParts)),
        Promise.resolve(readList(KEYS.deletedParts)),
        api.estoque.movimentacoes(200).catch(() => []),
        Promise.resolve(readList(KEYS.movements)),
        api.fornecedores.list().catch(() => []),
      ]);

      const deletedSet = new Set(deleted.map(String));
      const merged = new Map();

      dtos.forEach((dto) => {
        const code = dto.codigo ?? String(dto.id);
        if (deletedSet.has(String(code))) return;
        merged.set(String(code), mapPeca(dto, overlays[String(code)] ?? {}));
      });

      locals.forEach((part) => {
        if (part?.code && !deletedSet.has(String(part.code))) {
          merged.set(String(part.code), part);
        }
      });

      const list = [...merged.values()];
      registerParts(list);
      setSuppliers((Array.isArray(apiSuppliers) ? apiSuppliers : []).map(mapFornecedor));
      setParts(list);

      const localMovements = Array.isArray(storedMovements) ? storedMovements : [];
      const remoteMovements = Array.isArray(apiMovements)
        ? apiMovements.map(mapMovimentacao)
        : [];
      setMovements(
        remoteMovements.length || !localMovements.length
          ? remoteMovements
          : localMovements,
      );
      setSource("api");
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Adia o primeiro carregamento para não atualizar estado no corpo do efeito.
    queueMicrotask(load);
  }, [load]);

  const persistMovements = (list) => {
    if (!isDemo()) writeList(KEYS.movements, list);
  };

  const makeMovement = (data) => {
    seq += 1;
    return {
      id: `MV-N${Date.now()}${seq}`,
      at: now(),
      by: currentOperator,
      unitCost: null,
      supplierId: null,
      orderNumber: null,
      note: "",
      document: "",
      ...data,
    };
  };

  /** Cadastra uma peça (com saldo inicial opcional). */
  const createPart = useCallback(
    async (data) => {
      const { stock = 0, ...rest } = data;

      if (isDemo()) {
        const part = { onOrder: null, status: "ativo", ...rest, stock, ...stamp() };
        const next = [...parts, part];
        setParts(next);
        registerParts(next);
        persistPartOverlay(part);

        if (stock > 0) {
          const movement = makeMovement({
            code: part.code,
            type: "entrada",
            qty: stock,
            balance: stock,
            unitCost: part.cost,
            document: "Saldo inicial",
            note: "Cadastro da peça",
          });
          setMovements((current) => {
            const list = [...current, movement];
            persistMovements(list);
            return list;
          });
        }
        return part;
      }

      const dto = await api.pecas.create(pecaCreatePayload({ ...rest, stock }));
      const part = { ...mapPeca(dto), onOrder: null, ...stamp() };
      const next = [...parts, part];
      setParts(next);
      registerParts(next);
      persistPartOverlay(part);
      return part;
    },
    [parts],
  );

  const updatePart = useCallback(
    async (code, data) => {
      const current = partsByCode.get(code);
      if (!current) return null;
      const merged = { ...current, ...data, ...stamp() };

      if (isDemo() || !current.apiId) {
        const next = parts.map((part) => (part.code === code ? merged : part));
        setParts(next);
        registerParts(next);
        persistPartOverlay(merged);
        return merged;
      }

      const dto = await api.pecas.update(current.apiId, pecaUpdatePayload(merged));
      const part = { ...mapPeca(dto), ...stamp() };
      const next = parts.map((item) => (item.code === code ? part : item));
      setParts(next);
      registerParts(next);
      persistPartOverlay(part);
      return part;
    },
    [parts, partsByCode],
  );

  const deletePart = useCallback(
    async (code) => {
      const current = partsByCode.get(code);

      if (!isDemo() && current?.apiId) {
        await api.pecas.remove(current.apiId);
      }

      const next = parts.filter((part) => part.code !== code);
      setParts(next);
      registerParts(next);

      setMovements((currentList) => {
        const list = currentList.filter((movement) => movement.code !== code);
        persistMovements(list);
        return list;
      });

      if (!isDemo()) {
        writeList(
          KEYS.localParts,
          readList(KEYS.localParts).filter((item) => item.code !== code),
        );
        writeList(KEYS.deletedParts, [
          ...new Set([...readList(KEYS.deletedParts).map(String), code]),
        ]);
      }
    },
    [parts, partsByCode],
  );

  /**
   * Registra uma movimentação e atualiza o saldo.
   * - entrada / devolucao: soma `qty` · saida: subtrai `qty`
   * - ajuste: `qty` é a NOVA contagem física (inventário)
   * Retorna o movimento gravado (ou null se a peça não existir).
   */
  const registerMovement = useCallback(
    async ({ code, type, qty, unitCost, supplierId, document, note, ...extra }) => {
      const part = partsByCode.get(code);
      if (!part) return null;

      if (isDemo() || !part.apiId) {
        const delta = type === "ajuste" ? qty - part.stock : type === "saida" ? -qty : qty;
        const balance = Math.max(0, part.stock + delta);
        const patch = { stock: balance };

        if (type === "entrada" && unitCost) {
          const totalQty = Math.max(0, part.stock) + qty;
          patch.cost = round((Math.max(0, part.stock) * part.cost + qty * unitCost) / totalQty);
        }
        if (type === "entrada" && part.onOrder) {
          const remaining = part.onOrder.qty - qty;
          patch.onOrder = remaining > 0 ? { ...part.onOrder, qty: remaining } : null;
        }

        const movement = makeMovement({
          code,
          type,
          qty: delta,
          balance,
          unitCost: unitCost ?? null,
          supplierId: supplierId ?? null,
          document: document ?? "",
          note: note ?? "",
          ...extra,
        });
        const nextPart = { ...part, ...patch, ...stamp() };
        const next = parts.map((item) => (item.code === code ? nextPart : item));
        setParts(next);
        registerParts(next);
        persistPartOverlay(nextPart);
        setMovements((current) => {
          const list = [...current, movement];
          persistMovements(list);
          return list;
        });
        return movement;
      }

      const response = await api.pecas.movimentar(
        part.apiId,
        movimentacaoPayload({ type, qty, unitCost, supplierId, document, note }),
      );
      const movement = mapMovimentacao(response);
      const balance = Number(response.saldoAtual ?? response.saldoPosterior ?? part.stock);
      const patch = { stock: balance };

      if (type === "entrada" && unitCost) {
        const totalQty = Math.max(0, part.stock) + Number(qty);
        patch.cost = round((Math.max(0, part.stock) * part.cost + Number(qty) * unitCost) / totalQty);
      }
      if (type === "entrada" && part.onOrder) {
        const remaining = part.onOrder.qty - Number(qty);
        patch.onOrder = remaining > 0 ? { ...part.onOrder, qty: remaining } : null;
      }

      const nextPart = { ...part, ...patch, ...stamp() };
      const next = parts.map((item) => (item.code === code ? nextPart : item));
      setParts(next);
      registerParts(next);
      persistPartOverlay(nextPart);
      setMovements((current) => [...current, movement]);
      return movement;
    },
    [parts, partsByCode],
  );

  /** Baixa automática das peças de uma OS entregue. Retorna quantas linhas baixou. */
  const consumeForOrder = useCallback(
    async (order) => {
      let lowered = 0;

      if (isDemo()) {
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

        const next = parts.map((part) => {
          if (!balances.has(part.code)) return part;
          const updated = { ...part, stock: balances.get(part.code), ...stamp() };
          persistPartOverlay(updated);
          return updated;
        });
        setParts(next);
        registerParts(next);
        setMovements((current) => {
          const list = [...current, ...created];
          persistMovements(list);
          return list;
        });
        return created.length;
      }

      const balances = new Map();
      const created = [];

      for (const line of order.parts) {
        const part = line.code ? partsByCode.get(line.code) : null;
        const pecaId = part?.apiId ?? line.pecaId;
        if (!pecaId) continue;

        try {
          const response = await api.pecas.movimentar(
            pecaId,
            movimentacaoPayload({
              type: "saida",
              qty: line.qty,
              document: `OS #${order.number}`,
              note: "Baixa automática na entrega",
            }),
          );
          const movement = mapMovimentacao(response);
          created.push(movement);
          if (line.code) {
            balances.set(line.code, Number(response.saldoAtual ?? movement.balance));
          }
          lowered += 1;
        } catch (movementError) {
          setError(movementError);
        }
      }

      if (!created.length) return 0;

      const next = parts.map((part) => {
        if (!balances.has(part.code)) return part;
        const updated = { ...part, stock: balances.get(part.code), ...stamp() };
        persistPartOverlay(updated);
        return updated;
      });
      setParts(next);
      registerParts(next);
      setMovements((current) => [...current, ...created]);
      return lowered;
    },
    [parts, partsByCode],
  );

  /** Registra pedidos de compra enviados: items = [{ code, qty }]. */
  const placeOrder = useCallback(
    (items, supplierId) => {
      const orderedAt = now();
      const next = parts.map((part) => {
        const item = items.find((entry) => entry.code === part.code);
        if (!item) return part;
        const qty = (part.onOrder?.qty ?? 0) + item.qty;
        const updated = { ...part, onOrder: { qty, supplierId, orderedAt }, ...stamp() };
        persistPartOverlay(updated);
        return updated;
      });
      setParts(next);
      registerParts(next);
    },
    [parts],
  );

  return {
    parts,
    suppliers,
    partsByCode,
    movements,
    createPart,
    updatePart,
    deletePart,
    registerMovement,
    consumeForOrder,
    placeOrder,
    loading,
    error,
    source,
    reload: load,
  };
}
