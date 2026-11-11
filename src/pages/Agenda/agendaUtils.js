const pad = (n) => String(n).padStart(2, "0");

export const AGENDA_STATUS = {
  AGENDADO: { label: "Agendado", variant: "blue" },
  CONFIRMADO: { label: "Confirmado", variant: "green" },
  EM_ANDAMENTO: { label: "Em andamento", variant: "blue" },
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
  { value: "hoje", label: "Hoje", days: 1 },
  { value: "7dias", label: "Próximos 7 dias", days: 7 },
  { value: "30dias", label: "Próximos 30 dias", days: 30 },
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

export function emptyAgendamento() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    titulo: "",
    descricao: "",
    inicio: toLocalInput(start.toISOString()),
    fim: toLocalInput(end.toISOString()),
    mecanicoId: "",
    boxId: "",
    status: "AGENDADO",
  };
}

export function agendamentoToValues(item) {
  return {
    titulo: item.titulo ?? "",
    descricao: item.descricao ?? "",
    inicio: toLocalInput(item.inicio),
    fim: toLocalInput(item.fim),
    mecanicoId: item.mecanicoId ? String(item.mecanicoId) : "",
    boxId: item.boxId ? String(item.boxId) : "",
    status: item.status ?? "AGENDADO",
  };
}

export function agendamentoPayload(values, { isEdit = false } = {}) {
  const payload = {
    titulo: values.titulo.trim(),
    descricao: values.descricao.trim() || null,
    inicio: fromLocalInput(values.inicio),
    fim: fromLocalInput(values.fim),
    mecanicoId: values.mecanicoId ? Number(values.mecanicoId) : null,
    boxId: values.boxId ? Number(values.boxId) : null,
  };
  if (isEdit || values.status !== "AGENDADO") payload.status = values.status;
  return payload;
}

export function validateAgendamento(values) {
  const errors = {};
  if (!values.titulo.trim()) errors.titulo = "Informe o título do agendamento.";
  if (!values.inicio) errors.inicio = "Informe o início.";
  if (!values.fim) errors.fim = "Informe o fim.";
  if (values.inicio && values.fim && new Date(values.fim) <= new Date(values.inicio)) {
    errors.fim = "O fim deve ser depois do início.";
  }
  return errors;
}
