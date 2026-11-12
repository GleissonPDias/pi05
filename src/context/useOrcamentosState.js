import { useCallback, useEffect, useState } from "react";
import { isDemo } from "../services/api";
import { api } from "../services/api";
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
    unitPrice: Number(item.valorUnitario ?? 0),
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
    number,
    clientId: String(dto.clienteId),
    vehicleId: String(dto.veiculoId),
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
    descricao: line.description ?? "",
    quantidade: Number(line.quantity ?? 1),
    valorUnitario: Number(line.unitPrice ?? 0),
  }));
  const services = (quote.services ?? []).map((line) => ({
    tipo: "SERVICO",
    servicoId: line.servicoId ? Number(line.servicoId) : null,
    codigo: line.code ?? null,
    descricao: line.description ?? "",
    quantidade: Number(line.quantity ?? 1),
    valorUnitario: Number(line.unitPrice ?? 0),
  }));
  return [...parts, ...services];
}

function toPayload(data) {
  return {
    clienteId: Number(data.clientId),
    veiculoId: Number(data.vehicleId),
    titulo: data.title?.trim() || null,
    tipo: data.type?.trim() || null,
    observacoes: data.notes?.trim() || null,
    validade: data.validUntil ? data.validUntil.slice(0, 10) : null,
    validadeDias: data.validityDays ?? 7,
    desconto: Number(data.discount?.value ?? 0),
    descontoTipo: (data.discount?.type ?? "valor").toUpperCase(),
    canalEnvio: null,
    itens: toItens(data),
  };
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
        const quote = {
          parts: [],
          services: [],
          discount: { type: "valor", value: 0 },
          notes: "",
          validityDays: 7,
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
          validUntil: validUntilFrom(issuedAt, data.validityDays ?? 7),
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
    const number = Number(String(id).replace(/\D/g, ""));
    await api.orcamentos.update(number, toPayload({ ...data, clientId: data.clientId ?? quotes.find((q) => q.id === id)?.clientId, vehicleId: data.vehicleId ?? quotes.find((q) => q.id === id)?.vehicleId }));
    await reload();
  }, [demo, quotes, reload]);

  const sendQuote = useCallback(async (id, channel = "whatsapp") => {
    if (demo) {
      patch(id, () => ({
        status: "enviado",
        sentAt: now(),
        sentChannel: channel,
      }));
      return;
    }
    const number = Number(String(id).replace(/\D/g, ""));
    await api.orcamentos.changeStatus(number, "ENVIADO");
    await reload();
  }, [demo, reload]);

  const approveQuote = useCallback(async (id) => {
    if (demo) {
      patch(id, () => ({ status: "aprovado", decidedAt: now() }));
      return;
    }
    const number = Number(String(id).replace(/\D/g, ""));
    await api.orcamentos.changeStatus(number, "APROVADO");
    await reload();
  }, [demo, reload]);

  const rejectQuote = useCallback(async (id, reason) => {
    if (demo) {
      patch(id, () => ({ status: "rejeitado", decidedAt: now(), rejectReason: reason }));
      return;
    }
    const number = Number(String(id).replace(/\D/g, ""));
    await api.orcamentos.changeStatus(number, "REJEITADO");
    await reload();
  }, [demo, reload]);

  const convertQuote = useCallback(async (id, orderNumber) => {
    if (demo) {
      patch(id, () => ({ orderNumber, convertedAt: now(), status: "convertido" }));
      return;
    }
    const number = Number(String(id).replace(/\D/g, ""));
    await api.orcamentos.convert(number, Number(String(orderNumber).replace(/\D/g, "")));
    await reload();
  }, [demo, reload]);

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
    const number = Number(String(id).replace(/\D/g, ""));
    await api.orcamentos.remove(number);
    setQuotes((current) => current.filter((quote) => quote.id !== id));
  }, [demo]);

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
