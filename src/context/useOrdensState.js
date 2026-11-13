import { useCallback, useEffect, useRef, useState } from "react";
import { api, isDemo } from "../services/api";
import { loadCatalogs, partApiId, serviceApiId } from "../services/catalogs";
import {
  mapOrdem,
  mapOsPeca,
  mapOsServico,
  ordemCreatePayload,
  osHeaderPayload,
  osPecaPayload,
  osPecaUpdatePayload,
  osServicoPayload,
  osServicoUpdatePayload,
  orderOverlayFrom,
  statusToApi,
} from "../services/mappers";
import { KEYS, readMap, writeMap } from "../services/storage";
import { ordensMock } from "../mocks/ordens";
import { currentOperator } from "../mocks/user";
import { STATUS } from "../pages/OrdensServico/constants";

let eventSeq = 0;

/** Registro da linha do tempo da OS. */
function makeEvent(text, tone = "blue") {
  eventSeq += 1;
  return {
    id: `E${Date.now()}-${eventSeq}`,
    at: new Date().toISOString(),
    by: currentOperator,
    text,
    tone,
  };
}

const stamp = () => ({
  updatedAt: new Date().toISOString(),
  updatedBy: currentOperator,
});

const statusLabel = (status) => STATUS[status]?.label ?? status;

function withItems(order) {
  return {
    ...order,
    parts: order.parts ?? [],
    services: order.services ?? [],
  };
}

/** Converte uma linha local para o payload de serviço da API. */
function servicePayload(line) {
  return osServicoPayload({
    ...line,
    serviceId: line.serviceId ?? serviceApiId(line.code),
  });
}

/** Converte uma linha local para o payload de peça da API. */
function partPayload(line) {
  return osPecaPayload({
    ...line,
    pecaId: line.pecaId ?? partApiId(line.code),
  });
}

/**
 * Reaplica os overlays locais (código, detalhe, concluído/cotado) nos itens
 * devolvidos pela API, casando pela posição/descrição.
 */
function applyItemOverlays(mapped, target, kind) {
  const pool = [...(target ?? [])];
  return (mapped ?? []).map((item, index) => {
    let local = pool[index];
    if (!local || local.description !== item.description) {
      const found = pool.findIndex((line) => line.description === item.description);
      if (found >= 0) local = pool[found];
    }
    if (!local) return item;

    if (kind === "service") {
      return {
        ...item,
        code: local.code ?? item.code,
        detail: local.detail ?? item.detail,
        done: local.done ?? item.done,
      };
    }
    return {
      ...item,
      code: local.code ?? item.code,
      unit: local.unit ?? item.unit,
      quoted: local.quoted ?? item.quoted,
    };
  });
}

/**
 * Ordens de serviço e suas operações (usada pelo AppProviders).
 *
 * Rascunhos: as edições da página de detalhes ficam em `drafts[número]` (só os
 * campos alterados) até o usuário clicar em "Salvar".
 *
 * No modo API:
 * - lista/resumo vêm de `GET /ordens-servico` e o detalhe de cada OS de
 *   `GET /ordens-servico/{numero}` (itens e totais);
 * - criação, mudança de etapa e itens usam os endpoints do backend;
 * - campos sem endpoint (título, tipo, box, pagamento, vistoria...) ficam em
 *   overlays locais;
 * - erros nunca são lançados para chamadas antigas: ficam em `error` e no
 *   banner global da API.
 */
export function useOrdensState() {
  const [orders, setOrders] = useState(() => (isDemo() ? ordensMock : []));
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));
  const ordersRef = useRef(orders);

  const commit = useCallback((updater) => {
    const next =
      typeof updater === "function" ? updater(ordersRef.current) : updater;
    ordersRef.current = next;
    setOrders(next);
    return next;
  }, []);

  const persistOverlay = useCallback((order) => {
    if (isDemo()) return;
    writeMap(KEYS.orders, {
      ...readMap(KEYS.orders),
      [String(order.number)]: orderOverlayFrom(order),
    });
  }, []);

  const load = useCallback(async () => {
    if (isDemo()) {
      commit(ordensMock);
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loadCatalogs();
      const summaries = await api.ordens.list();
      const details = await Promise.all(
        summaries.map((summary) =>
          api.ordens.get(summary.numero).catch(() => null),
        ),
      );
      const overlays = readMap(KEYS.orders);
      const list = details
        .filter(Boolean)
        .map((dto) => mapOrdem(dto, overlays[String(dto.numero)] ?? {}));

      commit(list);
      setSource("api");
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [commit]);

  useEffect(() => {
    // Adia o primeiro carregamento para não atualizar estado no corpo do efeito.
    queueMicrotask(load);
  }, [load]);

  const mergeOrder = (order, data, logText) => {
    const next = withItems({ ...order, ...data });
    if (logText) next.timeline = [...(order.timeline ?? []), makeEvent(logText)];
    return { ...next, ...stamp() };
  };

  /** Grava o cabeçalho na API (campos que antes ficavam só em overlay). */
  const pushHeader = useCallback(async (order) => {
    if (isDemo()) return null;
    return api.ordens.update(order.number, osHeaderPayload(order));
  }, []);

  /** Atualiza o estado local + overlay e devolve a OS resultante. */
  const applyOrder = useCallback(
    (number, data, logText) => {
      const current = ordersRef.current.find((order) => order.number === number);
      if (!current) return null;
      const next = mergeOrder(current, data, logText);
      persistOverlay(next);
      commit((list) =>
        list.map((order) => (order.number === number ? next : order)),
      );
      return next;
    },
    [commit, persistOverlay],
  );

  /** Abre uma nova OS e devolve o registro criado (ou null). */
  const createOrder = useCallback(
    async (data) => {
      if (isDemo()) {
        const number =
          ordersRef.current.reduce((max, order) => Math.max(max, order.number), 1000) + 1;
        const order = {
          title: "",
          internalNotes: "",
          mileageOut: null,
          inspection: {
            done: false,
            customerAgreed: false,
            belongings: "",
            notes: "",
            damages: [],
            checklist: {},
          },
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
        commit((current) => [order, ...current]);
        return order;
      }

      try {
        await loadCatalogs();
        const dto = await api.ordens.create(ordemCreatePayload(data));
        const number = dto.numero;

        const { services: dataServices = [], parts: dataParts = [], ...metadata } = data;

        for (const line of dataServices) {
          try {
            await api.ordens.addServico(number, servicePayload(line));
          } catch (itemError) {
            setError(itemError);
          }
        }
        for (const line of dataParts) {
          try {
            await api.ordens.addPeca(number, partPayload(line));
          } catch (itemError) {
            setError(itemError);
          }
        }

        const detail = await api.ordens.get(number);
        const base = mapOrdem(detail, {});
        const order = withItems({
          ...base,
          ...metadata,
          number,
          services: applyItemOverlays(
            detail.servicos?.map((item) => mapOsServico(item)) ?? [],
            dataServices,
            "service",
          ),
          parts: applyItemOverlays(
            detail.pecas?.map((item) => mapOsPeca(item)) ?? [],
            dataParts,
            "part",
          ),
          ...stamp(),
        });

        persistOverlay(order);
        commit((current) => [order, ...current]);
        return order;
      } catch (createError) {
        setError(createError);
        return null;
      }
    },
    [commit, persistOverlay],
  );

  /** Altera campos da OS (opcionalmente registrando na linha do tempo). */
  const updateOrder = useCallback(
    (number, data, logText) => {
      const next = applyOrder(number, data, logText);
      if (!next) return false;
      if (!isDemo()) {
        // Persiste o cabeçalho em segundo plano; o erro vai para o banner.
        pushHeader(next).catch((headerError) => setError(headerError));
      }
      return true;
    },
    [applyOrder, pushHeader],
  );

  /** Muda a etapa da OS. `extra` traz dados da mudança (ex.: entrega, motivo). */
  const changeStatus = useCallback(
    async (number, status, extra = {}, logText) => {
      const current = ordersRef.current.find((order) => order.number === number);
      if (!current) return false;

      const now = new Date().toISOString();
      const patch = {
        ...extra,
        status,
        readyAt: status === "pronta" ? now : current.readyAt,
        deliveredAt: status === "entregue" ? now : current.deliveredAt,
        canceledAt: status === "cancelada" ? now : current.canceledAt,
      };
      const text =
        logText ??
        `Etapa alterada: ${statusLabel(current.status)} → ${statusLabel(status)}`;

      if (isDemo()) {
        updateOrder(number, patch, text);
        return true;
      }

      try {
        await api.ordens.changeStatus(
          number,
          statusToApi(status),
          extra?.cancelReason ?? logText ?? undefined,
        );
        updateOrder(number, patch, text);
        return true;
      } catch (statusError) {
        setError(statusError);
        return false;
      }
    },
    [updateOrder],
  );

  /** Só registra um acontecimento na linha do tempo. */
  const addEvent = useCallback(
    (number, text, tone) => {
      const current = ordersRef.current.find((order) => order.number === number);
      if (!current) return false;
      const next = {
        ...current,
        timeline: [...(current.timeline ?? []), makeEvent(text, tone)],
        ...stamp(),
      };
      persistOverlay(next);
      commit((list) =>
        list.map((order) => (order.number === number ? next : order)),
      );
      return true;
    },
    [commit, persistOverlay],
  );

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

  /** Sincroniza os itens da OS com o backend (PUT para alterações, POST para novos). */
  const syncItems = useCallback(async (number, stored, targetServices, targetParts) => {
    const storedServices = new Map(
      stored.services.map((line) => [String(line.id), line]),
    );
    const targetServiceIds = new Set(targetServices.map((line) => String(line.id)));

    for (const line of stored.services) {
      if (!targetServiceIds.has(String(line.id))) {
        await api.ordens.removeServico(number, line.id).catch(() => {});
      }
    }
    for (const line of targetServices) {
      const previous = storedServices.get(String(line.id));
      if (!previous) {
        await api.ordens.addServico(number, servicePayload(line));
        continue;
      }

      const changed =
        Number(previous.qty) !== Number(line.qty) ||
        Number(previous.unitPrice) !== Number(line.unitPrice) ||
        Number(previous.hours) !== Number(line.hours) ||
        String(previous.mechanicId ?? "") !== String(line.mechanicId ?? "") ||
        previous.description !== line.description ||
        previous.code !== line.code ||
        Boolean(previous.done) !== Boolean(line.done) ||
        Number(previous.discount ?? 0) !== Number(line.discount ?? 0) ||
        previous.discountType !== line.discountType;

      if (!changed) continue;
      await api.ordens.updateServico(number, line.id, osServicoUpdatePayload(line));
    }

    const storedParts = new Map(stored.parts.map((line) => [String(line.id), line]));
    const targetPartIds = new Set(targetParts.map((line) => String(line.id)));

    for (const line of stored.parts) {
      if (!targetPartIds.has(String(line.id))) {
        await api.ordens.removePeca(number, line.id).catch(() => {});
      }
    }
    for (const line of targetParts) {
      const previous = storedParts.get(String(line.id));
      if (!previous) {
        await api.ordens.addPeca(number, partPayload(line));
        continue;
      }

      const changed =
        Number(previous.qty) !== Number(line.qty) ||
        Number(previous.unitPrice) !== Number(line.unitPrice) ||
        previous.description !== line.description ||
        previous.code !== line.code ||
        Boolean(previous.quoted) !== Boolean(line.quoted) ||
        Boolean(previous.installed) !== Boolean(line.installed) ||
        String(previous.unit ?? "") !== String(line.unit ?? "") ||
        Number(previous.discount ?? 0) !== Number(line.discount ?? 0) ||
        previous.discountType !== line.discountType;

      if (!changed) continue;
      await api.ordens.updatePeca(number, line.id, osPecaUpdatePayload(line));
    }
  }, []);

  /** Grava o rascunho na OS. */
  const saveDraft = useCallback(
    async (number) => {
      const draft = drafts[number];
      if (!draft) return false;

      if (isDemo()) {
        updateOrder(number, draft, "Alterações da OS salvas");
        discardDraft(number);
        return true;
      }

      const current = ordersRef.current.find((order) => order.number === number);
      if (!current) return false;

      const { services: draftServices, parts: draftParts, ...metadata } = draft;
      const targetServices = draftServices ?? current.services;
      const targetParts = draftParts ?? current.parts;

      const next = applyOrder(number, metadata, "Alterações da OS salvas");
      if (!next) return false;

      try {
        await pushHeader(next);
        await syncItems(number, current, targetServices, targetParts);
        const detail = await api.ordens.get(number);
        const overlay = readMap(KEYS.orders)[String(number)] ?? {};
        const base = mapOrdem(detail, overlay);
        const order = withItems({
          ...base,
          services: applyItemOverlays(base.services, targetServices, "service"),
          parts: applyItemOverlays(base.parts, targetParts, "part"),
          ...stamp(),
        });
        persistOverlay(order);
        commit((list) =>
          list.map((item) => (item.number === number ? order : item)),
        );
        discardDraft(number);
        return true;
      } catch (saveError) {
        setError(saveError);
        return false;
      }
    },
    [drafts, updateOrder, applyOrder, pushHeader, discardDraft, syncItems, persistOverlay, commit],
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
    loading,
    error,
    source,
    reload: load,
  };
}
