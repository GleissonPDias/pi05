import { useCallback, useState } from "react";
import { ordensMock } from "../mocks/ordens";
import { currentOperator } from "../mocks/user";
import { STATUS } from "../pages/OrdensServico/constants";

let eventSeq = 0;

/** Registro da linha do tempo da OS. */
function makeEvent(text, tone = "blue") {
  eventSeq += 1;
  return { id: `E${Date.now()}-${eventSeq}`, at: new Date().toISOString(), by: currentOperator, text, tone };
}

const stamp = () => ({ updatedAt: new Date().toISOString(), updatedBy: currentOperator });

/**
 * Ordens de serviço e suas operações (usada pelo AppProviders).
 *
 * Rascunhos: as edições da página de detalhes ficam em `drafts[número]` (só os
 * campos alterados) até o usuário clicar em "Salvar". Assim nada se perde ao
 * trocar de tela, e as mudanças de etapa (que são gravadas na hora) não são
 * sobrescritas pelo rascunho.
 *
 * Hoje tudo fica apenas em memória (some ao recarregar a página).
 * TODO: ao integrar com a API (Spring Boot), troque o corpo de cada função por
 * uma chamada HTTP mantendo as assinaturas. Sugestão de rotas:
 * POST /ordens · PATCH /ordens/{numero} · POST /ordens/{numero}/status
 */
export function useOrdensState() {
  const [orders, setOrders] = useState(ordensMock);
  const [drafts, setDrafts] = useState({});

  const patchOrder = (number, updater) =>
    setOrders((current) =>
      current.map((order) => (order.number === number ? { ...order, ...updater(order), ...stamp() } : order)),
    );

  /** Abre uma nova OS e devolve o registro criado. */
  const createOrder = useCallback(
    (data) => {
      const number = orders.reduce((max, order) => Math.max(max, order.number), 1000) + 1;
      const order = {
        title: "",
        internalNotes: "",
        mileageOut: null,
        inspection: { done: false, customerAgreed: false, belongings: "", notes: "", damages: [], photos: [], checklist: {} },
        diagnosis: { text: "", validated: false },
        parts: [],
        services: [],
        discount: { type: "valor", value: 0 },
        payment: { method: "", installments: 1 },
        warranty: "90d-5000",
        customerNotes: "",
        approval: { status: "pendente", channel: null, sentAt: null, decidedAt: null, viewedAt: null },
        readyAt: null,
        deliveredAt: null,
        canceledAt: null,
        cancelReason: "",
        ...data,
        number,
        status: "aberta",
        openedAt: new Date().toISOString(),
        openedBy: currentOperator,
        timeline: [makeEvent(`OS aberta por ${currentOperator}`, "slate")],
        ...stamp(),
      };
      setOrders((current) => [order, ...current]);
      return order;
    },
    [orders],
  );

  /** Altera campos da OS (opcionalmente registrando na linha do tempo). */
  const updateOrder = useCallback((number, data, logText) => {
    patchOrder(number, (order) => ({
      ...data,
      timeline: logText ? [...order.timeline, makeEvent(logText)] : order.timeline,
    }));
  }, []);

  /** Muda a etapa da OS. `extra` traz dados da mudança (ex.: entrega, motivo). */
  const changeStatus = useCallback((number, status, extra = {}, logText) => {
    const now = new Date().toISOString();
    patchOrder(number, (order) => ({
      ...extra,
      status,
      readyAt: status === "pronta" ? now : order.readyAt,
      deliveredAt: status === "entregue" ? now : order.deliveredAt,
      canceledAt: status === "cancelada" ? now : order.canceledAt,
      timeline: [
        ...order.timeline,
        makeEvent(
          logText ?? `Etapa alterada: ${STATUS[order.status].label} → ${STATUS[status].label}`,
          status === "cancelada" ? "red" : status === "pronta" || status === "entregue" ? "green" : "blue",
        ),
      ],
    }));
  }, []);

  /** Só registra um acontecimento na linha do tempo. */
  const addEvent = useCallback((number, text, tone) => {
    patchOrder(number, (order) => ({ timeline: [...order.timeline, makeEvent(text, tone)] }));
  }, []);

  /** Guarda alterações ainda não salvas (aceita objeto ou função). */
  const setDraft = useCallback((number, patch) => {
    setDrafts((current) => {
      const previous = current[number] ?? {};
      const next = typeof patch === "function" ? patch(previous) : patch;
      return { ...current, [number]: { ...previous, ...next } };
    });
  }, []);

  const discardDraft = useCallback((number) => {
    setDrafts((current) => {
      const next = { ...current };
      delete next[number];
      return next;
    });
  }, []);

  /** Grava o rascunho na OS. */
  const saveDraft = useCallback(
    (number) => {
      const draft = drafts[number];
      if (!draft) return;
      updateOrder(number, draft, "Alterações da OS salvas");
      discardDraft(number);
    },
    [drafts, updateOrder, discardDraft],
  );

  return {
    orders,
    drafts,
    createOrder,
    updateOrder,
    changeStatus,
    addEvent,
    setDraft,
    discardDraft,
    saveDraft,
  };
}
