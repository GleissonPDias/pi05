import { useCallback, useEffect, useState } from "react";
import { getWorkshop } from "../services/workshop";
import { api, isDemo } from "../services/api";
import { orcamentosMock } from "../mocks/orcamentos";
import { currentOperator } from "../mocks/user";

const DAY = 86_400_000;
let eventSeq = 0;

function makeEvent(text, tone = "blue") {
  eventSeq += 1;
  return { id: `QE${Date.now()}-${eventSeq}`, at: new Date().toISOString(), by: currentOperator, text, tone };
}

const formatId = (number) => `ORC-${String(number).padStart(4, "0")}`;
const now = () => new Date().toISOString();
const validUntilFrom = (start, days) => new Date(new Date(start).getTime() + days * DAY).toISOString();

function mapItem(item) {
  return {
    id: String(item.id),
    code: item.codigo ?? "",
    description: item.descricao ?? "",
    quantity: Number(item.quantidade ?? 1),
    qty: Number(item.quantidade ?? 1),
    unitPrice: Number(item.valorUnitario ?? 0),
    price: Number(item.valorUnitario ?? 0),
    hours: item.tempoEstimadoHoras != null ? Number(item.tempoEstimadoHoras) : null,
    pecaId: item.pecaId ? String(item.pecaId) : null,
    servicoId: item.servicoId ? String(item.servicoId) : null,
    type: item.tipo,
    done: false,
    mechanicId: null,
  };
}

function mapOrcamento(dto) {
  const number = dto.numero;
  const issuedAt = dto.emitidoEm ?? dto.criadoEm ?? now();
  const validityDays = dto.validadeDias ?? 7;
  const validUntil = dto.validade
    ? new Date(dto.validade).toISOString()
    : validUntilFrom(issuedAt, validityDays);
  return {
    id: formatId(number),
    backendId: dto.id,
    number,
    clientId: String(dto.clienteId),
    clientName: dto.clienteNome ?? "",
    vehicleId: String(dto.veiculoId),
    vehiclePlate: dto.veiculoPlaca ?? "",
    vehicleModel: dto.veiculoModelo ?? "",
    sellerId: dto.criadoPor ? String(dto.criadoPor) : "",
    type: dto.tipo ?? "",
    title: dto.titulo ?? "",
    notes: dto.observacoes ?? "",
    validityDays,
    parts: (dto.itens ?? []).filter((i) => i.tipo === "PECA").map(mapItem),
    services: (dto.itens ?? []).filter((i) => i.tipo === "SERVICO").map(mapItem),
    discount: { type: (dto.descontoTipo ?? "VALOR").toLowerCase(), value: Number(dto.desconto ?? 0) },
    status: (dto.status ?? "RASCUNHO").toLowerCase(),
    issuedAt,
    validUntil,
    sentAt: dto.emitidoEm ?? null,
    sentChannel: dto.canalEnvio ?? null,
    viewedAt: null,
    decidedAt: dto.aprovadoEm ?? dto.rejeitadoEm ?? null,
    decisionChannel: null,
    rejectReason: dto.motivoRejeicao ?? "",
    orderNumber: dto.ordemServicoId ?? null,
    convertedAt: dto.status === "CONVERTIDO" ? (dto.atualizadoEm ?? null) : null,
    timeline: [],
    updatedAt: dto.atualizadoEm ?? issuedAt,
    updatedBy: dto.criadoPorNome ?? "",
  };
}

function toItens(quote) {
  const parts = (quote.parts ?? []).map((line) => ({
    tipo: "PECA",
    pecaId: line.pecaId ? Number(line.pecaId) : null,
    codigo: line.code ?? null,
    descricao: (line.description ?? "").toUpperCase(),
    quantidade: Number(line.qty ?? line.quantity ?? 1),
    valorUnitario: Number(line.unitPrice ?? line.price ?? 0),
  }));
  const services = (quote.services ?? []).map((line) => ({
    tipo: "SERVICO",
    servicoId: line.servicoId ? Number(line.servicoId) : null,
    codigo: line.code ?? null,
    descricao: (line.description ?? "").toUpperCase(),
    quantidade: Number(line.qty ?? line.quantity ?? 1),
    valorUnitario: Number(line.unitPrice ?? line.price ?? 0),
    tempoEstimadoHoras: line.hours != null ? Number(line.hours) : null,
  }));
  return [...parts, ...services];
}

function toPayload(data) {
  return {
    clienteId: Number(data.clientId),
    veiculoId: Number(data.vehicleId),
    titulo: data.title?.trim() ? data.title.trim().toUpperCase() : null,
    tipo: data.type?.trim() ? data.type.trim().toUpperCase() : null,
    observacoes: data.notes?.trim() ? data.notes.trim().toUpperCase() : null,
    validade: data.validUntil ? data.validUntil.slice(0, 10) : null,
    validadeDias: data.validityDays ?? getWorkshop()?.validadeOrcamentoDias ?? 7,
    desconto: Number(data.discount?.value ?? 0),
    descontoTipo: (data.discount?.type ?? "valor").toUpperCase(),
    canalEnvio: null,
    itens: toItens(data),
  };
}

function backendIdOf(quote, quotes) {
  if (quote?.backendId) return quote.backendId;
  const found = quotes?.find((q) => q.id === quote?.id);
  return found?.backendId ?? Number(String(quote?.id ?? "").replace(/\D/g, ""));
}

export function useOrcamentosState() {
  const demo = isDemo();
  const [quotes, setQuotes] = useState(() => (demo ? orcamentosMock : []));
  const [loaded, setLoaded] = useState(demo);

  useEffect(() => {
    if (demo) {
      queueMicrotask(() => {
        setQuotes(orcamentosMock);
        setLoaded(true);
      });
      return;
    }
    let ativo = true;
    api.orcamentos
      .list()
      .then((lista) => {
        if (!ativo) return;
        setQuotes((Array.isArray(lista) ? lista : []).map(mapOrcamento));
        setLoaded(true);
      })
      .catch(() => {
        if (ativo) setLoaded(true);
      });
    return () => {
      ativo = false;
    };
  }, [demo]);

  const patch = (id, updater) =>
    setQuotes((current) =>
      current.map((quote) =>
        quote.id === id ? { ...quote, ...updater(quote), updatedAt: now() } : quote,
      ),
    );

  const reload = useCallback(async () => {
    if (demo) return;
    try {
      const lista = await api.orcamentos.list();
      setQuotes((Array.isArray(lista) ? lista : []).map(mapOrcamento));
    } catch {
      // banner global
    }
  }, [demo]);

  const createQuote = useCallback(
    async (data) => {
      if (demo) {
        const number = quotes.reduce((max, quote) => Math.max(max, quote.number), 0) + 1;
        const issuedAt = now();
        const defaultValidity = getWorkshop()?.validadeOrcamentoDias ?? 7;
        const quote = {
          parts: [],
          services: [],
          discount: { type: "valor", value: 0 },
          notes: "",
          validityDays: defaultValidity,
          sentAt: null,
          sentChannel: null,
          viewedAt: null,
          decidedAt: null,
          decisionChannel: null,
          rejectReason: "",
          orderNumber: null,
          convertedAt: null,
          ...data,
          id: formatId(number),
          number,
          status: "rascunho",
          issuedAt,
          validUntil: validUntilFrom(issuedAt, data.validityDays ?? defaultValidity),
          timeline: [makeEvent(`Orçamento criado por ${currentOperator}`, "slate")],
          updatedAt: issuedAt,
          updatedBy: currentOperator,
        };
        setQuotes((current) => [quote, ...current]);
        return quote;
      }
      const created = await api.orcamentos.create(toPayload(data));
      const quote = mapOrcamento(created);
      setQuotes((current) => [quote, ...current]);
      return quote;
    },
    [demo, quotes],
  );

  const updateQuote = useCallback(async (id, data) => {
    if (demo) {
      patch(id, (quote) => ({
        ...data,
        validUntil: validUntilFrom(quote.issuedAt, data.validityDays ?? quote.validityDays),
      }));
      return;
    }
    const quote = quotes.find((q) => q.id === id);
    const bid = backendIdOf(quote, quotes);
    await api.orcamentos.update(bid, toPayload({ ...data, clientId: data.clientId ?? quote?.clientId, vehicleId: data.vehicleId ?? quote?.vehicleId }));
    await reload();
  }, [demo, quotes, reload]);

  const sendQuote = useCallback(async (quoteOrId, channel = "whatsapp") => {
    const id = typeof quoteOrId === "object" && quoteOrId !== null ? quoteOrId.id : quoteOrId;
    if (demo) {
      patch(id, () => ({
        status: "enviado",
        sentAt: now(),
        sentChannel: channel,
      }));
      return;
    }
    const quote = typeof quoteOrId === "object" && quoteOrId !== null ? quoteOrId : quotes.find((q) => q.id === quoteOrId);
    const bid = backendIdOf(quote, quotes);
    await api.orcamentos.changeStatus(bid, "ENVIADO", { canal: channel });
    await reload();
  }, [demo, quotes, reload]);

  const approveQuote = useCallback(async (id) => {
    if (demo) {
      patch(id, () => ({ status: "aprovado", decidedAt: now() }));
      return;
    }
    const quote = quotes.find((q) => q.id === id);
    const bid = backendIdOf(quote, quotes);
    await api.orcamentos.changeStatus(bid, "APROVADO");
    await reload();
  }, [demo, quotes, reload]);

  const rejectQuote = useCallback(async (id, reason) => {
    if (demo) {
      patch(id, () => ({ status: "rejeitado", decidedAt: now(), rejectReason: reason }));
      return;
    }
    const quote = quotes.find((q) => q.id === id);
    const bid = backendIdOf(quote, quotes);
    await api.orcamentos.changeStatus(bid, "REJEITADO", { motivo: reason });
    await reload();
  }, [demo, quotes, reload]);

  const convertQuote = useCallback(async (id, orderNumber) => {
    if (demo) {
      patch(id, () => ({ orderNumber, convertedAt: now(), status: "convertido" }));
      return;
    }
    const quote = quotes.find((q) => q.id === id);
    const bid = backendIdOf(quote, quotes);
    await api.orcamentos.convert(bid, Number(String(orderNumber).replace(/\D/g, "")));
    await reload();
  }, [demo, quotes, reload]);

  const duplicateQuote = useCallback(
    async (id) => {
      const source = quotes.find((quote) => quote.id === id);
      if (demo) {
        const copy = (lines, prefix) => lines.map((line, index) => ({ ...line, id: `${prefix}${Date.now()}${index}`, done: false }));
        const created = await createQuote({
          clientId: source.clientId,
          vehicleId: source.vehicleId,
          sellerId: source.sellerId,
          type: source.type,
          title: source.title,
          notes: source.notes,
          validityDays: source.validityDays,
          discount: { ...source.discount },
          parts: copy(source.parts, "QP"),
          services: copy(source.services, "QS"),
        });
        return created;
      }
      const created = await createQuote({
        clientId: source.clientId,
        vehicleId: source.vehicleId,
        type: source.type,
        title: source.title,
        notes: source.notes,
        validityDays: source.validityDays,
        discount: { ...source.discount },
        parts: source.parts,
        services: source.services,
      });
      return created;
    },
    [demo, quotes, createQuote],
  );

  const deleteQuote = useCallback(async (id) => {
    if (demo) {
      setQuotes((current) => current.filter((quote) => quote.id !== id));
      return;
    }
    const quote = quotes.find((q) => q.id === id);
    const bid = backendIdOf(quote, quotes);
    await api.orcamentos.remove(bid);
    setQuotes((current) => current.filter((quote) => quote.id !== id));
  }, [demo, quotes]);

  const addQuoteEvent = useCallback((id, text, tone) => {
    if (demo) {
      patch(id, (quote) => ({ timeline: [...quote.timeline, makeEvent(text, tone)] }));
      return;
    }
    patch(id, (quote) => ({ timeline: [...quote.timeline, makeEvent(text, tone)] }));
  }, []);

  return {
    quotes,
    loaded,
    createQuote,
    updateQuote,
    sendQuote,
    approveQuote,
    rejectQuote,
    convertQuote,
    duplicateQuote,
    deleteQuote,
    addQuoteEvent,
    reload,
  };
}
