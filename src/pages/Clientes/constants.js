/** Quantidade de clientes por página na listagem. */
export const PAGE_SIZE = 7;

export const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Com OS em Aberto" },
  { value: "inactive", label: "Inativos" },
];

export const CLASSIFICATIONS = [
  { value: "novo", label: "Cliente Novo" },
  { value: "regular", label: "Cliente Regular" },
  { value: "vip", label: "Cliente VIP / Frequente" },
  { value: "frota", label: "Frota / Corporativo" },
];

export const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

export const DEACTIVATION_REASONS = [
  "Cadastro duplicado ou inconsistente",
  "Cliente solicitou a exclusão do cadastro (LGPD)",
  "Cliente sem movimentação há muito tempo",
  "Cadastro criado por engano",
  "Outro motivo",
].map((reason) => ({ value: reason, label: reason }));

export const STATES = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapá"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceará"],
  ["DF", "Distrito Federal"],
  ["ES", "Espírito Santo"],
  ["GO", "Goiás"],
  ["MA", "Maranhão"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Pará"],
  ["PB", "Paraíba"],
  ["PR", "Paraná"],
  ["PE", "Pernambuco"],
  ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "São Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"],
].map(([value, name]) => ({ value, label: `${value} - ${name}` }));
