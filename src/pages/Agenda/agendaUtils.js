const pad = (n) => String(n).padStart(2, "0");

export const AGENDA_STATUS = {
  AGENDADO: { label: "Agendado", variant: "blue" },
  CONFIRMADO: { label: "Confirmado", variant: "green" },
  EM_ANDAMENTO: { label: "Em andamento", variant: "indigo" },
  CONCLUIDO: { label: "Concluído", variant: "green" },
  CANCELADO: { label: "Cancelado", variant: "slate" },
  NAO_COMPARECEU: { label: "Não compareceu", variant: "red" },
};

/** Próxima etapa usual de um agendamento (botão principal da linha). */
export const NEXT_STATUS = {
  AGENDADO: { value: "CONFIRMADO", label: "Confirmar" },
  CONFIRMADO: { value: "EM_ANDAMENTO", label: "Iniciar" },
  EM_ANDAMENTO: { value: "CONCLUIDO", label: "Concluir" },
};

export const PERIODS = [
  { value: "hoje", label: "Hoje", short: "Hoje", days: 1 },
  { value: "7dias", label: "Próximos 7 dias", short: "7 dias", days: 7 },
  { value: "30dias", label: "Próximos 30 dias", short: "30 dias", days: 30 },
];

/** Intervalo [início do dia atual, início do dia + N] em ISO, no fuso local. */
export function periodRange(periodValue) {
  const period = PERIODS.find((item) => item.value === periodValue) ?? PERIODS[1];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + period.days);
  return { inicio: start.toISOString(), fim: end.toISOString() };
}

/** ISO -> "AAAA-MM-DDTHH:mm" para <input type="datetime-local">. */
export function toLocalInput(iso) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "AAAA-MM-DDTHH:mm" (local) -> ISO com fuso. */
export function fromLocalInput(local) {
  return new Date(local).toISOString();
}

export function dayKey(iso) {
  return toLocalInput(iso).slice(0, 10);
}

export function formatDayHeading(key) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

export function formatTimeRange(startIso, endIso) {
  const time = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${time(startIso)} – ${time(endIso)}`;
}

/** Agrupa os agendamentos por dia, em ordem cronológica. */
export function groupByDay(items) {
  const groups = new Map();
  [...items]
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
    .forEach((item) => {
      const key = dayKey(item.inicio);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
  return [...groups.entries()];
}

/** Durações sugeridas no formulário (minutos). */
export const DURATIONS = [30, 60, 90, 120, 180, 240, 480];

export function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

/** Id de mecânico/box: número na API, texto ("MEC-01") no modo demonstração. */
const toId = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return /^\d+$/.test(String(value)) ? Number(value) : String(value);
};

export function emptyAgendamento() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const local = toLocalInput(start.toISOString());
  return {
    titulo: "",
    descricao: "",
    data: local.slice(0, 10),
    hora: local.slice(11, 16),
    duracao: "60",
    mecanicoId: "",
    boxId: "",
    status: "AGENDADO",
  };
}

export function agendamentoToValues(item) {
  const local = toLocalInput(item.inicio);
  const minutes = Math.max(15, Math.round((new Date(item.fim) - new Date(item.inicio)) / 60_000));
  return {
    titulo: item.titulo ?? "",
    descricao: item.descricao ?? "",
    data: local.slice(0, 10),
    hora: local.slice(11, 16),
    duracao: String(minutes),
    mecanicoId: item.mecanicoId ? String(item.mecanicoId) : "",
    boxId: item.boxId ? String(item.boxId) : "",
    status: item.status ?? "AGENDADO",
  };
}

/** Início e fim (ISO) a partir de data + hora + duração do formulário. */
export function valuesRange(values) {
  if (!values.data || !values.hora) return null;
  const start = new Date(`${values.data}T${values.hora}`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + Number(values.duracao || 0) * 60_000);
  return { inicio: start.toISOString(), fim: end.toISOString() };
}

export function agendamentoPayload(values, { isEdit = false } = {}) {
  const range = valuesRange(values);
  const payload = {
    titulo: values.titulo.trim().toUpperCase(),
    descricao: values.descricao.trim() ? values.descricao.trim().toUpperCase() : null,
    inicio: range.inicio,
    fim: range.fim,
    mecanicoId: toId(values.mecanicoId),
    boxId: toId(values.boxId),
  };
  if (isEdit || values.status !== "AGENDADO") payload.status = values.status;
  return payload;
}

export function validateAgendamento(values) {
  const errors = {};
  if (!values.titulo.trim()) errors.titulo = "Informe o serviço ou o veículo do agendamento.";
  if (!values.data) errors.data = "Informe a data.";
  if (!values.hora) errors.hora = "Informe o horário.";
  if (!(Number(values.duracao) > 0)) errors.duracao = "Escolha a duração.";
  return errors;
}

const ACTIVE = ["AGENDADO", "CONFIRMADO", "EM_ANDAMENTO"];

/**
 * Outros agendamentos ativos que ocupam o mesmo mecânico ou box no mesmo horário.
 * Retorna [{ item, reason: "mecanico" | "box" }].
 */
export function findConflicts(values, items, ignoreId) {
  const range = valuesRange(values);
  if (!range) return [];
  const start = new Date(range.inicio);
  const end = new Date(range.fim);
  return items
    .filter((item) => String(item.id) !== String(ignoreId ?? ""))
    .filter((item) => ACTIVE.includes(item.status))
    .filter((item) => new Date(item.inicio) < end && new Date(item.fim) > start)
    .flatMap((item) => {
      const reasons = [];
      if (values.mecanicoId && String(item.mecanicoId ?? "") === String(values.mecanicoId)) reasons.push({ item, reason: "mecanico" });
      if (values.boxId && String(item.boxId ?? "") === String(values.boxId)) reasons.push({ item, reason: "box" });
      return reasons;
    });
}

/** Status ainda "vivos" (contam como horário ocupado). */
export const isActive = (item) => ACTIVE.includes(item.status);

/** Horário ativo que está acontecendo agora. */
export function isHappening(item) {
  const now = Date.now();
  return isActive(item) && new Date(item.inicio).getTime() <= now && new Date(item.fim).getTime() > now;
}

export const isToday = (iso) => dayKey(iso) === dayKey(new Date().toISOString());

/** Chips de situação da lista. */
export const STATUS_CHIPS = [
  { key: "todos", label: "Todos" },
  { key: "AGENDADO", label: "A confirmar", dot: "bg-blue-500" },
  { key: "CONFIRMADO", label: "Confirmados", dot: "bg-emerald-500" },
  { key: "EM_ANDAMENTO", label: "Em andamento", dot: "bg-indigo-500" },
  { key: "CONCLUIDO", label: "Concluídos", dot: "bg-emerald-700" },
  { key: "CANCELADO", label: "Cancelados", dot: "bg-slate-400" },
];

/** Os N dias do período (para a faixa de dias da semana). */
export function periodDays(periodValue) {
  const period = PERIODS.find((item) => item.value === periodValue) ?? PERIODS[1];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: period.days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: toLocalInput(date.toISOString()).slice(0, 10),
      weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      day: date.getDate(),
    };
  });
}
