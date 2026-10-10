/** Quantidade de orçamentos por página. */
export const PAGE_SIZE = 6;

/** Orçamentos enviados há mais tempo que isso, sem resposta, pedem follow-up. */
export const FOLLOW_UP_HOURS = 48;

/**
 * Situação comercial exibida na tela (calculada a partir do status gravado):
 * - aguardando: enviado e dentro da validade · vencido: enviado e fora da validade
 * - convertido: aprovado e já transformado em OS
 */
export const QUOTE_STATUS = {
  rascunho: { label: "Rascunho", badge: "bg-slate-200 text-slate-700", dot: "bg-slate-500" },
  aguardando: { label: "Aguardando Resposta", badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500" },
  aprovado: { label: "Aprovado pelo Cliente", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  convertido: { label: "Convertido em OS", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-600" },
  rejeitado: { label: "Rejeitado pelo Cliente", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  vencido: { label: "Vencido", badge: "bg-slate-200 text-slate-600", dot: "bg-slate-400" },
};

/** Filtros rápidos (chips). "aprovado" inclui os convertidos. */
export const STATUS_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "Aguardando Resposta", dot: "bg-indigo-500" },
  { key: "aprovado", label: "Aprovados", dot: "bg-emerald-500" },
  { key: "rejeitado", label: "Rejeitados", dot: "bg-red-500" },
  { key: "vencido", label: "Vencidos", dot: "bg-slate-400" },
  { key: "rascunho", label: "Rascunhos", dot: "bg-slate-600" },
];

export const PERIODS = [
  { value: "mes", label: "Este mês" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "todos", label: "Todo o período" },
];

export const VALIDITY_OPTIONS = [3, 7, 15, 30].map((days) => ({ value: String(days), label: `${days} dias` }));

export const REJECT_REASONS = [
  "Preço da mão de obra",
  "Preço das peças genuínas",
  "Prazo de execução",
  "Fechou com outra oficina",
  "Vai adiar o serviço",
  "Vendeu o veículo",
  "Outro motivo",
].map((reason) => ({ value: reason, label: reason }));

export const RESPONSE_CHANNELS = {
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  telefone: "Telefone",
  email: "E-mail",
};
