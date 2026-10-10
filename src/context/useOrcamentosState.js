import { useCallback, useState } from "react";
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

const CHANNEL_TEXT = { whatsapp: "WhatsApp", presencial: "presencialmente", telefone: "telefone", email: "e-mail" };

/**
 * Orçamentos e suas operações (usado pelo AppProviders).
 *
 * TODO: ao integrar com a API (Spring Boot), troque o corpo das funções por
 * chamadas HTTP mantendo as assinaturas. Sugestão de rotas:
 * POST /orcamentos · PUT /orcamentos/{id} · POST /orcamentos/{id}/enviar ·
 * POST /orcamentos/{id}/aprovar · POST /orcamentos/{id}/rejeitar ·
 * POST /orcamentos/{id}/converter (cria a OS)
 */
export function useOrcamentosState() {
  const [quotes, setQuotes] = useState(orcamentosMock);

  const patch = (id, updater) =>
    setQuotes((current) =>
      current.map((quote) =>
        quote.id === id ? { ...quote, ...updater(quote), updatedAt: now(), updatedBy: currentOperator } : quote,
      ),
    );

  /** Cria um orçamento (rascunho) e devolve o registro. */
  const createQuote = useCallback(
    (data) => {
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
    },
    [quotes],
  );

  /** Altera dados (itens, validade...). A validade é recalculada a partir da emissão. */
  const updateQuote = useCallback((id, data, logText) => {
    patch(id, (quote) => ({
      ...data,
      validUntil: validUntilFrom(quote.issuedAt, data.validityDays ?? quote.validityDays),
      timeline: logText ? [...quote.timeline, makeEvent(logText)] : quote.timeline,
    }));
  }, []);

  /**
   * Envia (ou reenvia) a proposta. Se já tinha vencido, a validade recomeça
   * a contar a partir de agora.
   */
  const sendQuote = useCallback((id, channel = "whatsapp") => {
    patch(id, (quote) => {
      const expired = new Date(quote.validUntil) < Date.now();
      const restart = expired || quote.status === "rascunho";
      return {
        status: "enviado",
        sentAt: now(),
        sentChannel: channel,
        issuedAt: restart ? now() : quote.issuedAt,
        validUntil: restart ? validUntilFrom(now(), quote.validityDays) : quote.validUntil,
        timeline: [
          ...quote.timeline,
          makeEvent(
            `${quote.sentAt ? "Proposta reenviada" : "Proposta enviada"} ao cliente via ${CHANNEL_TEXT[channel]}${expired ? " (validade renovada)" : ""}`,
            "indigo",
          ),
        ],
      };
    });
  }, []);

  const approveQuote = useCallback((id, channel) => {
    patch(id, (quote) => ({
      status: "aprovado",
      decidedAt: now(),
      decisionChannel: channel,
      timeline: [...quote.timeline, makeEvent(`Proposta aprovada pelo cliente (${CHANNEL_TEXT[channel]})`, "green")],
    }));
  }, []);

  const rejectQuote = useCallback((id, reason, channel) => {
    patch(id, (quote) => ({
      status: "rejeitado",
      decidedAt: now(),
      decisionChannel: channel,
      rejectReason: reason,
      timeline: [...quote.timeline, makeEvent(`Proposta rejeitada: ${reason}`, "red")],
    }));
  }, []);

  /** Registra a OS criada a partir do orçamento. */
  const convertQuote = useCallback((id, orderNumber) => {
    patch(id, (quote) => ({
      orderNumber,
      convertedAt: now(),
      timeline: [...quote.timeline, makeEvent(`Convertido na OS #${orderNumber}`, "blue")],
    }));
  }, []);

  const addQuoteEvent = useCallback((id, text, tone) => {
    patch(id, (quote) => ({ timeline: [...quote.timeline, makeEvent(text, tone)] }));
  }, []);

  /** Cria um rascunho copiando cliente, veículo e itens. */
  const duplicateQuote = useCallback(
    (id) => {
      const source = quotes.find((quote) => quote.id === id);
      const copy = (lines, prefix) => lines.map((line, index) => ({ ...line, id: `${prefix}${Date.now()}${index}`, done: false }));
      return createQuote({
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
    },
    [quotes, createQuote],
  );

  const deleteQuote = useCallback((id) => {
    setQuotes((current) => current.filter((quote) => quote.id !== id));
  }, []);

  return {
    quotes,
    createQuote,
    updateQuote,
    sendQuote,
    approveQuote,
    rejectQuote,
    convertQuote,
    duplicateQuote,
    deleteQuote,
    addQuoteEvent,
  };
}
