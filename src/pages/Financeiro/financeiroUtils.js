import { daysSince, formatDate, toISODate } from "../../utils/dates";
import { formatBRL } from "../../utils/format";

export const KIND = {
  RECEBER: "receber",
  PAGAR: "pagar",
};

export const KIND_CONFIG = {
  [KIND.RECEBER]: {
    label: "A receber",
    singular: "Recebimento",
    newLabel: "Novo recebimento",
    paidLabel: "Recebido",
    paidAction: "Marcar como recebido",
    paidVerb: "recebido",
    emptyTitle: "Nenhum recebimento encontrado",
    emptyText: "Ajuste os filtros ou registre um novo recebimento.",
  },
  [KIND.PAGAR]: {
    label: "A pagar",
    singular: "Despesa",
    newLabel: "Nova despesa",
    paidLabel: "Pago",
    paidAction: "Marcar como pago",
    paidVerb: "pago",
    emptyTitle: "Nenhuma despesa encontrada",
    emptyText: "Ajuste os filtros ou registre uma nova despesa.",
  },
};

export const STATUS_LABEL = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
};

export const STATUS_VARIANT = {
  PENDENTE: "blue",
  PAGO: "green",
  CANCELADO: "slate",
  ESTORNADO: "red",
};

export const FORMAS_PAGAMENTO = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

export const formaLabel = (value) => FORMAS_PAGAMENTO.find((item) => item.value === value)?.label ?? value ?? "—";

export const CATEGORIAS_DESPESA = [
  "Fornecedores de peças",
  "Aluguel",
  "Energia e água",
  "Salários e encargos",
  "Impostos",
  "Manutenção",
  "Outros",
];

/** Chips de situação. "vencido" = pendente com vencimento anterior a hoje. */
export const STATUS_CHIPS = [
  { key: "todos", label: "Todos" },
  { key: "PENDENTE", label: "Pendentes", dot: "bg-blue-500" },
  { key: "vencido", label: "Vencidos", dot: "bg-red-500" },
  { key: "PAGO", label: "Pagos", dot: "bg-emerald-500" },
  { key: "CANCELADO", label: "Cancelados", dot: "bg-slate-400" },
];

/** Período pelo vencimento. */
export const PERIODS = [
  { value: "todos", label: "Todo o período" },
  { value: "7d", label: "Próximos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "30d", label: "Próximos 30 dias" },
];

/** Lançamentos por página. */
export const PAGE_SIZE = 8;

const dueDate = (item) => (item.vencimento ? String(item.vencimento).slice(0, 10) : "");

export function emptyLancamento(kind) {
  return {
    descricao: "",
    valor: 0,
    vencimento: toISODate(new Date()),
    status: "PENDENTE",
    observacoes: "",
    formaPagamento: "PIX",
    parcelas: 1,
    categoria: kind === KIND.PAGAR ? CATEGORIAS_DESPESA[0] : "",
  };
}

/** Valores do formulário -> payload de `CriarPagamentoDTO` / `CriarDespesaDTO`. */
export function lancamentoPayload(kind, values) {
  const base = {
    descricao: values.descricao.trim().toUpperCase(),
    valor: Number(values.valor),
    vencimento: values.vencimento || null,
    status: values.status,
    observacoes: values.observacoes.trim() ? values.observacoes.trim().toUpperCase() : null,
    pagoEm: values.status === "PAGO" ? new Date().toISOString() : null,
  };
  if (kind === KIND.RECEBER) {
    return { ...base, formaPagamento: values.formaPagamento, parcelas: Number(values.parcelas) || 1 };
  }
  return { ...base, categoria: values.categoria.trim() || null };
}

export function validateLancamento(values) {
  const errors = {};
  if (!values.descricao.trim()) errors.descricao = "Informe a descrição.";
  if (!(Number(values.valor) > 0)) errors.valor = "O valor deve ser maior que zero.";
  if (!values.vencimento) errors.vencimento = "Informe o vencimento.";
  const parcelas = Number(values.parcelas);
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 36) errors.parcelas = "Use de 1 a 36 parcelas.";
  return errors;
}

/** Lançamentos vencidos e ainda pendentes. */
export function isOverdue(item) {
  const due = dueDate(item);
  return item.status === "PENDENTE" && Boolean(due) && due < toISODate(new Date());
}

/** Soma de pendentes, pagos e vencidos de uma lista. */
export function totalsByStatus(items) {
  return items.reduce(
    (acc, item) => {
      const value = Number(item.valor) || 0;
      if (item.status === "PENDENTE") acc.pending += value;
      if (item.status === "PAGO") acc.paid += value;
      if (isOverdue(item)) {
        acc.overdue += value;
        acc.overdueCount += 1;
      }
      return acc;
    },
    { pending: 0, paid: 0, overdue: 0, overdueCount: 0 },
  );
}

/**
 * Texto e cor da coluna de vencimento:
 * "Vencido há 4 dias" (vermelho) · "Vence hoje" / "Vence amanhã" (âmbar) · "Em 5 dias" · "Pago em 20/11".
 */
export function dueInfo(item) {
  if (item.status === "PAGO") {
    const paidAt = item.pagoEm ? toISODate(new Date(item.pagoEm)) : null;
    return { text: paidAt ? `Pago em ${formatDate(paidAt)}` : "Quitado", tone: "green" };
  }
  if (item.status !== "PENDENTE") return { text: STATUS_LABEL[item.status] ?? item.status, tone: "slate" };
  const due = dueDate(item);
  if (!due) return { text: "Sem vencimento", tone: "slate" };
  const late = daysSince(due);
  if (late > 0) return { text: `Vencido há ${late} ${late === 1 ? "dia" : "dias"}`, tone: "red" };
  if (late === 0) return { text: "Vence hoje", tone: "amber" };
  if (late === -1) return { text: "Vence amanhã", tone: "amber" };
  return { text: `Em ${-late} dias`, tone: "slate" };
}

function inPeriod(item, period) {
  if (period === "todos") return true;
  const due = dueDate(item);
  if (!due) return false;
  const today = new Date();
  const todayIso = toISODate(today);
  if (period === "mes") return due.slice(0, 7) === todayIso.slice(0, 7);
  const days = period === "7d" ? 7 : 30;
  const limit = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
  // Próximos N dias também mostram os vencidos ainda em aberto (precisam de atenção).
  return due <= limit && (due >= todayIso || isOverdue(item));
}

const normalizeText = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Aplica busca, período e (opcionalmente) a situação. */
export function filterLancamentos(items, { search = "", period = "todos", status = "todos" } = {}) {
  const term = normalizeText(search.trim());
  return items.filter((item) => {
    if (!inPeriod(item, period)) return false;
    if (status === "vencido" && !isOverdue(item)) return false;
    if (!["todos", "vencido"].includes(status) && item.status !== status) return false;
    if (!term) return true;
    return [item.descricao, item.categoria, item.observacoes, formaLabel(item.formaPagamento)].some((field) =>
      normalizeText(field).includes(term),
    );
  });
}

export function countByStatus(items) {
  return STATUS_CHIPS.reduce((acc, chip) => {
    acc[chip.key] = filterLancamentos(items, { status: chip.key }).length;
    return acc;
  }, {});
}

const sortRank = (item) => {
  if (isOverdue(item)) return 0;
  if (item.status === "PENDENTE") return 1;
  if (item.status === "PAGO") return 2;
  return 3;
};

/**
 * Ordem da lista: vencidos, pendentes (do vencimento mais próximo ao mais distante)
 * e, por último, pagos e cancelados (do mais recente ao mais antigo).
 */
export function sortLancamentos(items) {
  return [...items].sort((a, b) => {
    const rank = sortRank(a) - sortRank(b);
    if (rank) return rank;
    return sortRank(a) <= 1 ? dueDate(a).localeCompare(dueDate(b)) : dueDate(b).localeCompare(dueDate(a));
  });
}

export const CSV_HEADERS = ["Tipo", "Descrição", "Categoria / forma", "Vencimento", "Valor", "Situação", "Observações"];

export function toCsvRows(kind, items) {
  return items.map((item) => [
    KIND_CONFIG[kind].singular,
    item.descricao,
    kind === KIND.PAGAR ? item.categoria ?? "" : formaLabel(item.formaPagamento),
    formatDate(dueDate(item)),
    formatBRL(Number(item.valor) || 0),
    isOverdue(item) ? "Vencido" : STATUS_LABEL[item.status] ?? item.status,
    item.observacoes ?? "",
  ]);
}
