/** Peças por página no inventário e movimentações por página no histórico. */
export const PAGE_SIZE = 8;
export const MOVEMENTS_PAGE_SIZE = 12;

export const UNITS = ["un", "kit", "par", "jogo", "L", "galão", "carga", "m"].map((unit) => ({ value: unit, label: unit }));

/** Situação da peça no inventário. */
export const STOCK_STATUS = {
  normal: { label: "Estoque Normal", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-600" },
  baixo: { label: "Estoque Baixo", badge: "bg-slate-200 text-slate-700", dot: "bg-slate-500", bar: "bg-slate-500" },
  critico: { label: "Crítico / Falta", badge: "bg-red-100 text-red-700", dot: "bg-red-500", bar: "bg-red-500" },
  inativo: { label: "Inativa", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-300", bar: "bg-slate-300" },
};

/** Filtros rápidos (chips) do inventário. */
export const STATUS_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "baixo", label: "Estoque Baixo", icon: "alert" },
  { key: "critico", label: "Sem Estoque", icon: "x" },
  { key: "pedido", label: "Pedido em Andamento", icon: "truck" },
  { key: "inativo", label: "Inativas", icon: "off" },
];

export const MOVEMENT_TYPES = {
  entrada: { label: "Entrada", badge: "bg-emerald-100 text-emerald-800", sign: "+" },
  saida: { label: "Saída", badge: "bg-red-100 text-red-700", sign: "−" },
  ajuste: { label: "Ajuste de inventário", badge: "bg-amber-100 text-amber-900", sign: "±" },
  devolucao: { label: "Devolução", badge: "bg-blue-100 text-blue-800", sign: "+" },
};

export const EXIT_REASONS = [
  "Uso interno da oficina",
  "Venda no balcão",
  "Perda / avaria",
  "Devolução ao fornecedor (garantia)",
  "Outro motivo",
].map((reason) => ({ value: reason, label: reason }));

export const ADJUST_REASONS = [
  "Contagem de inventário",
  "Correção de lançamento",
  "Furto / extravio",
  "Outro motivo",
].map((reason) => ({ value: reason, label: reason }));

/** Markup padrão sugerido para peças novas (%). */
export const DEFAULT_MARKUP = 90;
