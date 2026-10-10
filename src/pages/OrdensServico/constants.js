/** Quantidade de OS por página na visão em lista. */
export const PAGE_SIZE = 8;

/** Meta de lead time (dias entre a abertura e a entrega). */
export const LEAD_TIME_GOAL = 3;

/**
 * Etapas da OS, na ordem do fluxo da oficina.
 * - dot: cor do marcador · badge: cores da etiqueta · accent: borda do card no quadro
 * - active: a OS ainda está no pátio
 */
export const STATUS = {
  aberta: { label: "Aberta", short: "Aberta", dot: "bg-slate-500", badge: "bg-slate-200 text-slate-800", active: true },
  orcamento: { label: "Em Orçamento", short: "Orçamento", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-900", active: true },
  aprovacao: { label: "Aguard. Aprovação", short: "Aprovação", dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-800", active: true },
  execucao: { label: "Em Execução", short: "Execução", dot: "bg-blue-600", badge: "bg-blue-600 text-white", accent: "border-l-4 border-l-blue-600", active: true },
  aguardando_pecas: { label: "Aguard. Peças", short: "Peças", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-900", accent: "border-l-4 border-l-orange-500", active: true },
  pronta: { label: "Pronta p/ Retirada", short: "Pronta", dot: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-900", accent: "border-l-4 border-l-emerald-600", active: true },
  entregue: { label: "Entregue", short: "Entregue", dot: "bg-teal-700", badge: "bg-teal-100 text-teal-900", active: false },
  cancelada: { label: "Cancelada", short: "Cancelada", dot: "bg-red-600", badge: "bg-red-100 text-red-800", active: false },
};

export const STATUS_ORDER = Object.keys(STATUS);
export const ACTIVE_STATUSES = STATUS_ORDER.filter((key) => STATUS[key].active);

/** No quadro, "Entregue" mostra só as entregas recentes (em dias). */
export const DELIVERED_WINDOW_DAYS = 3;

export const PRIORITIES = {
  baixa: { label: "Baixa", badge: "bg-slate-100 text-slate-600" },
  normal: { label: "Normal", badge: "bg-slate-200 text-slate-700" },
  alta: { label: "Alta", badge: "bg-amber-100 text-amber-900" },
  urgente: { label: "Urgente", badge: "bg-red-100 text-red-700" },
};

export const SERVICE_TYPES = {
  revisao: "Revisão Preventiva",
  corretiva: "Manutenção Corretiva",
  diagnostico: "Diagnóstico / Avaliação",
  garantia: "Garantia / Retorno",
  eletrica: "Elétrica & Injeção",
  pneus: "Pneus, Alinhamento & Balanceamento",
  arcondicionado: "Ar-Condicionado",
};

export const CHANNELS = {
  balcao: "Balcão (presencial)",
  agendamento: "Agendamento",
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  portal: "Portal Web",
  guincho: "Guincho / Reboque",
  frota: "Contrato de Frota",
};

/** Nível de combustível na entrada (índice 0 a 4). */
export const FUEL_LEVELS = ["Reserva", "1/4", "1/2", "3/4", "Cheio"];

/** Itens conferidos na vistoria de entrada. */
export const CHECKLIST_ITEMS = [
  { key: "farois", label: "Faróis e luz alta" },
  { key: "lanternas", label: "Lanternas e luz de freio" },
  { key: "setas", label: "Setas e pisca-alerta" },
  { key: "limpadores", label: "Limpadores e esguicho" },
  { key: "pneus", label: "Pneus (desgaste e calibragem)" },
  { key: "estepe", label: "Estepe" },
  { key: "ferramentas", label: "Macaco, chave de roda e triângulo" },
  { key: "documento", label: "Documento do veículo (CRLV)" },
  { key: "multimidia", label: "Rádio / Multimídia" },
  { key: "arCondicionado", label: "Ar-condicionado" },
  { key: "vidros", label: "Vidros e travas elétricas" },
  { key: "painel", label: "Painel sem luzes de alerta" },
];

export const CHECKLIST_STATES = {
  ok: { label: "OK", active: "bg-emerald-600 text-white", dot: "bg-emerald-500" },
  atencao: { label: "Atenção", active: "bg-amber-500 text-white", dot: "bg-amber-500" },
  avaria: { label: "Avaria", active: "bg-red-600 text-white", dot: "bg-red-500" },
};

/** Áreas da carroceria (mapa de avarias). */
export const DAMAGE_AREAS = {
  parachoqueDianteiro: "Para-choque dianteiro",
  capo: "Capô",
  parabrisa: "Para-brisa",
  paralamaDE: "Para-lama dianteiro esq.",
  paralamaDD: "Para-lama dianteiro dir.",
  portaDE: "Porta dianteira esq.",
  portaDD: "Porta dianteira dir.",
  teto: "Teto",
  portaTE: "Porta traseira esq.",
  portaTD: "Porta traseira dir.",
  lateralTE: "Lateral traseira esq.",
  lateralTD: "Lateral traseira dir.",
  vidroTraseiro: "Vidro traseiro",
  tampaTraseira: "Tampa traseira / porta-malas",
  parachoqueTraseiro: "Para-choque traseiro",
};

export const DAMAGE_TYPES = {
  risco: "Risco",
  amassado: "Amassado",
  trincado: "Trincado / quebrado",
  pintura: "Pintura danificada",
};

export const PAYMENT_METHODS = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  boleto: "Boleto",
  faturado: "Faturado (frota / 30 dias)",
};

export const WARRANTIES = {
  "90d-3000": "90 dias / 3.000 km",
  "90d-5000": "90 dias / 5.000 km",
  "6m-10000": "6 meses / 10.000 km",
  "12m-20000": "12 meses / 20.000 km",
  sem: "Sem garantia (peças fornecidas pelo cliente)",
};

export const APPROVAL_CHANNELS = {
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  telefone: "Telefone",
  email: "E-mail",
  portal: "Portal Web",
};

export const CANCEL_REASONS = [
  "Orçamento recusado pelo cliente",
  "Cliente desistiu do serviço",
  "Cliente levou o veículo para outra oficina",
  "Peça indisponível no mercado",
  "OS aberta em duplicidade",
  "Outro motivo",
].map((reason) => ({ value: reason, label: reason }));

/** Abas da página de detalhes (o valor vai para a URL: ?aba=...). */
export const TABS = [
  { key: "dados", label: "1. Dados Iniciais" },
  { key: "vistoria", label: "2. Vistoria & Checklist" },
  { key: "diagnostico", label: "3. Diagnóstico & Serviços" },
  { key: "fechamento", label: "4. Fechamento & Valores" },
];

/** Transforma um objeto { valor: rótulo } em opções de <select>. */
export function toOptions(map) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}
