import { displayStatus, quoteTitle, quoteTotals } from "../../pages/Orcamentos/quoteUtils";
import { formatBRL } from "../../utils/format";
import { formatTimeAgo } from "../../utils/dates";

/**
 * Avisos do sino de notificações, montados a partir dos dados da oficina:
 * - agenda: próximos horários de hoje e de amanhã
 * - orçamentos: novos (últimos 3 dias), perto de vencer (até 2 dias) e vencidos (últimos 7 dias)
 * - sistema: notificações da API (`/notificacoes`)
 *
 * Cada aviso tem um `id` estável; o que já foi lido fica guardado no navegador.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const CATEGORIES = [
  { key: "todas", label: "Todas" },
  { key: "agenda", label: "Agenda" },
  { key: "orcamentos", label: "Orçamentos" },
  { key: "sistema", label: "Sistema" },
];

const time = (date) => date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function startOfDay(ms, plusDays = 0) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + plusDays);
  return date.getTime();
}

/** "Agora", "Hoje às 14:00", "Amanhã às 09:30". */
function agendaWhen(start, now) {
  if (start.getTime() <= now) return "Acontecendo agora";
  if (start.getTime() < startOfDay(now, 1)) {
    const minutes = Math.round((start.getTime() - now) / MINUTE);
    if (minutes <= 60) return `Em ${minutes} min (${time(start)})`;
    return `Hoje às ${time(start)}`;
  }
  return `Amanhã às ${time(start)}`;
}

function agendaNotifications(agenda, mechanicName, now) {
  const until = startOfDay(now, 2);
  return agenda
    .filter((item) => ["AGENDADO", "CONFIRMADO"].includes(item.status))
    .filter((item) => {
      const start = new Date(item.inicio).getTime();
      const end = new Date(item.fim).getTime();
      return end > now && start < until;
    })
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
    .map((item) => {
      const start = new Date(item.inicio);
      const toConfirm = item.status === "AGENDADO";
      const mechanic = mechanicName(item.mecanicoId);
      return {
        id: `agenda:${item.id}:${item.inicio}`,
        category: "agenda",
        kind: toConfirm ? "agenda-confirm" : "agenda",
        title: agendaWhen(start, now),
        message: [item.titulo, mechanic].filter(Boolean).join(" · "),
        meta: toConfirm ? "Aguardando confirmação do cliente" : "Horário confirmado",
        at: item.inicio,
        link: "/agenda",
        priority: start.getTime() - now < 2 * HOUR ? 0 : 2,
      };
    });
}

function quoteNotifications(quotes, clientName, now) {
  const result = [];
  quotes.forEach((quote) => {
    const status = displayStatus(quote);
    const client = quote.clientName || clientName(quote.clientId) || "Cliente";
    const link = `/orcamentos?busca=${encodeURIComponent(quote.id)}`;
    const total = formatBRL(quoteTotals(quote).total);
    const validUntil = new Date(quote.validUntil).getTime();

    if (status === "aguardando" && validUntil - now <= 2 * DAY) {
      const left = Math.ceil((validUntil - now) / DAY);
      const hoursLeft = Math.max(1, Math.round((validUntil - now) / HOUR));
      result.push({
        id: `orc-expira:${quote.id}:${quote.validUntil}`,
        category: "orcamentos",
        kind: "quote-expiring",
        title: `${quote.id} expira ${hoursLeft < 24 ? `em ${hoursLeft} h` : `em ${left} ${left === 1 ? "dia" : "dias"}`}`,
        message: `${client} · ${total}`,
        meta: "Ligue ou reenvie a proposta antes do vencimento",
        at: quote.validUntil,
        link,
        priority: 1,
      });
    }

    if (status === "vencido" && now - validUntil <= 7 * DAY) {
      result.push({
        id: `orc-vencido:${quote.id}:${quote.validUntil}`,
        category: "orcamentos",
        kind: "quote-expired",
        title: `${quote.id} venceu ${formatTimeAgo(quote.validUntil)}`,
        message: `${client} · ${total}`,
        meta: "Reenvie com nova validade se o cliente ainda tiver interesse",
        at: quote.validUntil,
        link,
        priority: 3,
      });
    }

    const issued = new Date(quote.issuedAt).getTime();
    if (now - issued <= 3 * DAY && !["convertido", "rejeitado"].includes(status)) {
      result.push({
        id: `orc-novo:${quote.id}`,
        category: "orcamentos",
        kind: "quote-new",
        title: `Novo orçamento ${quote.id}`,
        message: `${client} · ${quoteTitle(quote)} · ${total}`,
        meta: status === "rascunho" ? "Rascunho — ainda não enviado ao cliente" : `Lançado ${formatTimeAgo(quote.issuedAt)}`,
        at: quote.issuedAt,
        link,
        priority: 4,
      });
    }
  });
  return result;
}

function systemNotifications(items) {
  return items.map((item) => ({
    id: `api:${item.id}`,
    apiId: item.id,
    apiRead: Boolean(item.lida),
    category: "sistema",
    kind: "system",
    title: item.titulo,
    message: item.mensagem ?? "",
    meta: item.criadoEm ? formatTimeAgo(item.criadoEm) : "",
    at: item.criadoEm,
    link: item.link?.startsWith("/") ? item.link : null,
    priority: 5,
  }));
}

/** Junta e ordena os avisos: o que pede ação primeiro, depois o mais recente. */
export function buildNotifications({
  agenda = [],
  quotes = [],
  system = [],
  mechanicName = () => null,
  clientName = () => null,
  now = Date.now(),
}) {
  return [
    ...agendaNotifications(agenda, mechanicName, now),
    ...quoteNotifications(quotes, clientName, now),
    ...systemNotifications(system),
  ].sort((a, b) => a.priority - b.priority || Math.abs(new Date(a.at) - now) - Math.abs(new Date(b.at) - now));
}

/* ---------------------------------------------------------------------------
 * Avisos lidos (guardados só neste navegador)
 * ------------------------------------------------------------------------- */

const READ_KEY = "salvo.notifications.read.v1";
const MAX_READ = 300;

export function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveReadIds(ids) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-MAX_READ)));
  } catch {
    // Sem armazenamento (modo privado): o estado de lido vale só nesta sessão.
  }
}
