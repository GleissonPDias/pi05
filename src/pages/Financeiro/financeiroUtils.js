import { toISODate } from "../../utils/dates";

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
    emptyText: "Nenhum recebimento neste filtro.",
  },
  [KIND.PAGAR]: {
    label: "A pagar",
    singular: "Despesa",
    newLabel: "Nova despesa",
    paidLabel: "Pago",
    paidAction: "Marcar como pago",
    emptyText: "Nenhuma despesa neste filtro.",
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

export const CATEGORIAS_DESPESA = [
  "Fornecedores de peças",
  "Aluguel",
  "Energia e água",
  "Salários e encargos",
  "Impostos",
  "Manutenção",
  "Outros",
];

export const STATUS_FILTERS = [
  { value: "todos", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "PAGO", label: "Pagos" },
  { value: "CANCELADO", label: "Cancelados" },
];

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
    descricao: values.descricao.trim(),
    valor: Number(values.valor),
    vencimento: values.vencimento || null,
    status: values.status,
    observacoes: values.observacoes.trim() || null,
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
  return errors;
}

/** Soma os valores de um conjunto de lançamentos por status. */
export function totalsByStatus(items) {
  return items.reduce(
    (acc, item) => {
      const value = Number(item.valor) || 0;
      if (item.status === "PENDENTE") acc.pending += value;
      if (item.status === "PAGO") acc.paid += value;
      return acc;
    },
    { pending: 0, paid: 0 },
  );
}

/** Lançamentos vencidos e ainda pendentes (para destacar na tabela). */
export function isOverdue(item) {
  return item.status === "PENDENTE" && item.vencimento && item.vencimento < toISODate(new Date());
}
