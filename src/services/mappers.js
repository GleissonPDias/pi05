import { currentOperator } from "../mocks/user";
import { toISODate } from "../utils/dates";
import { onlyDigits } from "../utils/masks";
import { getPartByApiId, getServiceByApiId, getPartByCode } from "./catalogs";

/* ----------------------------------------------------------------------------
 * Utilidades
 * -------------------------------------------------------------------------- */

const nowIso = () => new Date().toISOString();

export function toNumberId(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeStatus(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

const READ_STATUS = {
  ABERTA: "aberta",
  EM_ORCAMENTO: "orcamento",
  EM_DIAGNOSTICO: "orcamento",
  AGUARDANDO_APROVACAO: "aprovacao",
  AGUARDANDO_PECA: "aguardando_pecas",
  EM_EXECUCAO: "execucao",
  EM_TESTE: "pronta",
  PRONTA: "pronta",
  CONCLUIDA: "entregue",
  ENTREGUE: "entregue",
  CANCELADA: "cancelada",
};

const WRITE_STATUS = {
  aberta: "ABERTA",
  orcamento: "EM_ORCAMENTO",
  aprovacao: "AGUARDANDO_APROVACAO",
  aguardando_pecas: "AGUARDANDO_PECA",
  execucao: "EM_EXECUCAO",
  pronta: "PRONTA",
  entregue: "ENTREGUE",
  cancelada: "CANCELADA",
};

export function statusFromApi(value) {
  return READ_STATUS[normalizeStatus(value)] ?? "aberta";
}

export function statusToApi(value) {
  return WRITE_STATUS[value] ?? "ABERTA";
}

const CLASSIFICATION_FROM_API = {
  FROTA: "frota",
  VIP: "vip",
  NOVO: "novo",
  REGULAR: "regular",
};

function classificationFromApi(value) {
  const key = normalizeStatus(value);
  if (CLASSIFICATION_FROM_API[key]) return CLASSIFICATION_FROM_API[key];
  if (key.includes("FROTA")) return "frota";
  if (key.includes("VIP")) return "vip";
  if (key.includes("NOVO")) return "novo";
  return "regular";
}

function classificationToApi(value) {
  if (!value) return null;
  return String(value).toUpperCase();
}

function priorityFromApi(value) {
  return String(value ?? "NORMAL").toLowerCase();
}

function priorityToApi(value) {
  return String(value ?? "normal").toUpperCase();
}

/* Garantia: o front usa chaves como "90d-5000"; a API guarda tipo + dias + km. */
const WARRANTY_KEYS = ["90d-3000", "90d-5000", "6m-10000", "12m-20000", "sem"];

const WARRANTY_DAYS_KM = {
  "90d-3000": { days: 90, km: 3000 },
  "90d-5000": { days: 90, km: 5000 },
  "6m-10000": { days: 180, km: 10000 },
  "12m-20000": { days: 365, km: 20000 },
};

function warrantyFromApi(dto) {
  const tipo = String(dto.garantiaTipo ?? "").trim().toLowerCase();
  if (tipo && WARRANTY_KEYS.includes(tipo)) return tipo;

  const days = Number(dto.garantiaDias);
  const km = Number(dto.garantiaKm);
  const match = Object.entries(WARRANTY_DAYS_KM).find(
    ([, span]) => span.days === days && span.km === km,
  );
  if (match) return match[0];

  return "90d-5000";
}

function discountTypeFromApi(value) {
  return String(value ?? "").toUpperCase() === "PERCENTUAL" ? "percentual" : "valor";
}

function approvalFromApi(dto, advanced) {
  const statusKey = String(dto.aprovacaoStatus ?? "").toUpperCase();
  let status = "pendente";

  if (statusKey === "APROVADO") status = "aprovado";
  else if (statusKey === "RECUSADO") status = "recusado";
  else if (dto.aprovacaoEnviadaEm) status = "enviado";
  else if (advanced) status = "aprovado";

  return {
    status,
    channel: dto.aprovacaoCanal ? String(dto.aprovacaoCanal).toLowerCase() : null,
    sentAt: dto.aprovacaoEnviadaEm ?? null,
    decidedAt: dto.aprovacaoDecididaEm ?? null,
    viewedAt: dto.aprovacaoVisualizadaEm ?? null,
  };
}

const emptyAddress = () => ({
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
});

export const emptyInspection = () => ({
  done: false,
  customerAgreed: false,
  belongings: "",
  notes: "",
  damages: [],
  checklist: {},
});

export const defaultApproval = () => ({
  status: "pendente",
  channel: null,
  sentAt: null,
  decidedAt: null,
  viewedAt: null,
});

export function inspectionFromApproval(status) {
  return { ...defaultApproval(), status };
}

/* ----------------------------------------------------------------------------
 * Cliente
 * -------------------------------------------------------------------------- */

export function mapCliente(dto, overlay = {}) {
  const id = String(dto.id);
  const address = overlay.address ?? {};

  return {
    id,
    name: dto.nome ?? "",
    email: dto.email ?? "",
    document: onlyDigits(dto.cpfCnpj),
    phone: onlyDigits(dto.telefone),
    phoneSecondary: onlyDigits(dto.telefoneSecundario),
    hasWhatsapp: overlay.hasWhatsapp ?? Boolean(dto.telefone),
    acceptsComms: overlay.acceptsComms ?? true,
    classification: classificationFromApi(dto.classificacao),
    status: dto.ativo === false ? "inativo" : "ativo",
    servicesCompleted: overlay.servicesCompleted ?? 0,
    lastVisit: overlay.lastVisit ?? null,
    address: { ...emptyAddress(), ...address },
    updatedAt: dto.criadoEm ?? overlay.updatedAt ?? nowIso(),
    updatedBy: overlay.updatedBy ?? currentOperator,
    inactiveReason: overlay.inactiveReason,
  };
}

export function clienteCreatePayload(data) {
  return {
    nome: data.name,
    cpfCnpj: data.document,
    email: data.email || null,
    telefone: data.phone,
    telefoneSecundario: data.phoneSecondary || null,
    classificacao: classificationToApi(data.classification),
  };
}

export function clienteUpdatePayload(data) {
  return {
    nome: data.name,
    email: data.email || null,
    telefone: data.phone,
    telefoneSecundario: data.phoneSecondary || null,
    classificacao: classificationToApi(data.classification),
  };
}

export function clienteOverlay(data) {
  return {
    address: data.address ?? emptyAddress(),
    hasWhatsapp: Boolean(data.hasWhatsapp),
    acceptsComms: Boolean(data.acceptsComms),
    classification: data.classification,
    updatedAt: nowIso(),
    updatedBy: currentOperator,
  };
}

/* ----------------------------------------------------------------------------
 * Veículo
 * -------------------------------------------------------------------------- */

export function mapVeiculo(dto, overlay = {}) {
  const id = String(dto.id);
  const hasOwner = Object.prototype.hasOwnProperty.call(overlay, "ownerId");

  return {
    id,
    plate: overlay.plate ?? dto.placa ?? "",
    brand: overlay.brand ?? dto.marca ?? "",
    model: overlay.model ?? dto.modelo ?? "",
    version: overlay.version ?? dto.versao ?? "",
    yearManufacture: overlay.yearManufacture ?? dto.anoFabricacao ?? null,
    yearModel: overlay.yearModel ?? dto.anoModelo ?? null,
    color: overlay.color ?? dto.cor ?? "",
    mileage: Number(overlay.mileage ?? dto.kmAtual ?? 0),
    mileageUpdatedAt: overlay.mileageUpdatedAt ?? toISODate(new Date()),
    fuel: overlay.fuel ?? dto.combustivel ?? "",
    engine: overlay.engine ?? dto.motorizacao ?? "",
    transmission: overlay.transmission ?? dto.transmissao ?? "",
    chassis: overlay.chassis ?? dto.chassi ?? "",
    ownerId: hasOwner
      ? overlay.ownerId
      : dto.clienteId !== null && dto.clienteId !== undefined
        ? String(dto.clienteId)
        : null,
    category: overlay.category ?? "",
    photoUrl: overlay.photoUrl ?? null,
    nextReviewKm: overlay.nextReviewKm ?? null,
    nextReviewDate: overlay.nextReviewDate ?? null,
    createdAt: overlay.createdAt ?? toISODate(new Date()),
    draft: overlay.draft ?? false,
    updatedAt: overlay.updatedAt ?? nowIso(),
    updatedBy: overlay.updatedBy ?? currentOperator,
  };
}

export function vehicleOverlayFrom(data) {
  return {
    plate: data.plate ?? undefined,
    brand: data.brand ?? undefined,
    model: data.model ?? undefined,
    version: data.version ?? undefined,
    yearManufacture: data.yearManufacture ?? undefined,
    yearModel: data.yearModel ?? undefined,
    color: data.color ?? undefined,
    fuel: data.fuel ?? undefined,
    engine: data.engine ?? undefined,
    transmission: data.transmission ?? undefined,
    chassis: data.chassis ?? undefined,
    mileage: data.mileage ?? undefined,
    mileageUpdatedAt: toISODate(new Date()),
    ownerId: data.ownerId ?? null,
    category: data.category ?? "",
    photoUrl: data.photoUrl ?? null,
    nextReviewKm: data.nextReviewKm ?? null,
    nextReviewDate: data.nextReviewDate ?? null,
    draft: Boolean(data.draft),
    updatedAt: nowIso(),
    updatedBy: currentOperator,
  };
}

export function veiculoCreatePayload(data) {
  return {
    placa: data.plate,
    chassi: data.chassis || null,
    marca: data.brand,
    modelo: data.model,
    versao: data.version || null,
    anoFabricacao: data.yearManufacture ?? null,
    anoModelo: data.yearModel ?? null,
    cor: data.color || null,
    combustivel: data.fuel || null,
    motorizacao: data.engine || null,
    transmissao: data.transmission || null,
    kmAtual: data.mileage ?? null,
  };
}

export function veiculoUpdatePayload(data) {
  return {
    cor: data.color || null,
    combustivel: data.fuel || null,
    motorizacao: data.engine || null,
    transmissao: data.transmission || null,
    kmAtual: data.mileage ?? null,
    versao: data.version || null,
    fotoUrl: data.photoUrl && !data.photoUrl.startsWith("blob:") ? data.photoUrl : null,
  };
}

export function veiculoOverlay(data) {
  return {
    ownerId: data.ownerId ?? null,
    category: data.category ?? "",
    photoUrl: data.photoUrl ?? null,
    nextReviewKm: data.nextReviewKm ?? null,
    nextReviewDate: data.nextReviewDate ?? null,
    mileageUpdatedAt: toISODate(new Date()),
    updatedAt: nowIso(),
    updatedBy: currentOperator,
  };
}

/* ----------------------------------------------------------------------------
 * Serviço (catálogo)
 * -------------------------------------------------------------------------- */

export function mapServico(dto, overlay = {}) {
  return {
    code: dto.codigo ?? String(dto.id),
    apiId: dto.id ?? null,
    description: dto.nome ?? "",
    detail: dto.detalhe ?? dto.descricao ?? overlay.detail ?? "",
    category: dto.categoria ?? overlay.category ?? "",
    hours: Number(dto.tempoEstimadoHoras ?? overlay.hours ?? 1),
    price: Number(dto.precoBase ?? 0),
    warranty: dto.garantiaTipo ?? overlay.warranty ?? "90d-5000",
    suggestedParts: overlay.suggestedParts ?? [],
    status: dto.ativo === false ? "inativo" : "ativo",
    updatedAt: overlay.updatedAt ?? nowIso(),
    updatedBy: overlay.updatedBy ?? currentOperator,
  };
}

export function servicoCreatePayload(data) {
  return {
    codigo: data.code || null,
    nome: data.description,
    descricao: data.detail || null,
    detalhe: data.detail || null,
    categoria: data.category || null,
    tempoEstimadoHoras: Number(data.hours) || null,
    garantiaTipo: data.warranty || null,
    precoBase: Number(data.price) || 0,
    ativo: data.status !== "inativo",
  };
}

export function servicoUpdatePayload(data) {
  const payload = servicoCreatePayload(data);
  delete payload.codigo;
  return payload;
}

/** Converte as peças sugeridas devolvidas pela API em códigos do catálogo. */
export function sugestoesFromDtos(dtos) {
  return (Array.isArray(dtos) ? dtos : [])
    .map((dto) => getPartByApiId(dto?.id)?.code ?? dto?.codigo ?? null)
    .filter(Boolean);
}

/** Converte códigos de peça da interface nos ids usados pela API. */
export function sugestoesPayload(codes) {
  const ids = (Array.isArray(codes) ? codes : [])
    .map((code) => {
      const apiId = getPartByCode(code)?.apiId;
      if (apiId !== null && apiId !== undefined) return Number(apiId);
      const numeric = Number(code);
      return Number.isFinite(numeric) ? numeric : null;
    })
    .filter((id) => id !== null);
  return [...new Set(ids)];
}

/* ----------------------------------------------------------------------------
 * Peça (catálogo)
 * -------------------------------------------------------------------------- */

export function mapPeca(dto, overlay = {}) {
  return {
    code: dto.codigo ?? String(dto.id),
    apiId: dto.id ?? null,
    description: dto.nome ?? "",
    brand: dto.fabricante ?? "",
    oem: dto.oem ?? "",
    application: dto.aplicacao ?? "",
    category: dto.categoria ?? "",
    unit: dto.unidade ?? "un",
    cost: Number(dto.precoCusto ?? 0),
    price: Number(dto.precoVenda ?? 0),
    stock: Number(dto.estoqueAtual ?? 0),
    minStock: Number(dto.estoqueMinimo ?? 0),
    maxStock: Number(dto.estoqueMaximo ?? 0),
    location: dto.localizacao ?? "",
    supplierId: dto.fornecedorId !== null && dto.fornecedorId !== undefined ? String(dto.fornecedorId) : null,
    note: dto.observacao ?? "",
    status: dto.ativo === false ? "inativo" : "ativo",
    onOrder: overlay.onOrder ?? null,
    updatedAt: overlay.updatedAt ?? nowIso(),
    updatedBy: overlay.updatedBy ?? currentOperator,
  };
}

export function pecaCreatePayload(data) {
  return {
    codigo: data.code || null,
    nome: data.description,
    descricao: data.note || null,
    fabricante: data.brand || null,
    oem: data.oem || null,
    categoria: data.category || null,
    aplicacao: data.application || null,
    unidade: data.unit || "un",
    precoCusto: Number(data.cost) || 0,
    precoVenda: Number(data.price) || 0,
    estoqueAtual: Number(data.stock) || 0,
    estoqueMinimo: Number(data.minStock) || 0,
    estoqueMaximo: Number(data.maxStock) || 0,
    localizacao: data.location || null,
    fornecedorId: toNumberId(data.supplierId),
    observacao: data.note || null,
    ativo: data.status !== "inativo",
  };
}

export function pecaUpdatePayload(data) {
  const payload = pecaCreatePayload(data);
  delete payload.codigo;
  delete payload.estoqueAtual;
  return payload;
}

const MOVEMENT_TYPE_FROM_API = {
  ENTRADA: "entrada",
  SAIDA: "saida",
  AJUSTE: "ajuste",
  DEVOLUCAO: "devolucao",
  DEVOLUCAO_FORNECEDOR: "devolucao",
};

/** DTO de movimentação da API -> formato usado nas telas de estoque. */
export function mapMovimentacao(dto) {
  const key = normalizeStatus(dto.tipo);
  const type = MOVEMENT_TYPE_FROM_API[key] ?? (key.includes("ENTRADA") ? "entrada" : key.includes("SAIDA") ? "saida" : key.includes("DEVOLU") ? "devolucao" : "ajuste");
  const direction = Number(dto.direcao ?? (type === "saida" ? -1 : 1));
  const quantity = Number(dto.quantidade ?? 0);
  const balance = Number(dto.saldoPosterior ?? dto.saldoAtual ?? 0);
  const document = dto.documento ?? "";

  return {
    id: String(dto.id),
    at: dto.criadoEm ?? nowIso(),
    by: currentOperator,
    code: dto.pecaCodigo ?? String(dto.pecaId ?? ""),
    type,
    qty: direction * quantity,
    balance,
    unitCost: dto.custoUnitario !== null && dto.custoUnitario !== undefined ? Number(dto.custoUnitario) : null,
    supplierId: dto.fornecedorId !== null && dto.fornecedorId !== undefined ? String(dto.fornecedorId) : null,
    document,
    note: dto.observacao ?? "",
    orderNumber: /^OS\s*#?(\d+)/i.exec(document)?.[1] ? Number(/^OS\s*#?(\d+)/i.exec(document)[1]) : null,
  };
}

export function movimentacaoPayload({ type, qty, unitCost, supplierId, document, note }) {
  const quantidade = type === "ajuste" ? Number(qty) || 0 : Math.abs(Number(qty) || 0);
  return {
    tipo: type,
    quantidade,
    custoUnitario: unitCost !== null && unitCost !== undefined ? Number(unitCost) : null,
    fornecedorId: toNumberId(supplierId),
    documento: document || null,
    observacao: note || null,
  };
}

/* ----------------------------------------------------------------------------
 * Ordem de serviço
 * -------------------------------------------------------------------------- */

export function mapOsServico(dto, overlay = {}) {
  const catalog = getServiceByApiId(dto.servicoId);
  const quantity = Number(dto.quantidade ?? 1);
  const unitPrice = Number(dto.valorUnitario ?? 0);
  const subtotal = Number(dto.subtotal ?? quantity * unitPrice);

  return {
    id: String(dto.id),
    code: overlay.code ?? catalog?.code ?? (dto.servicoId ? String(dto.servicoId) : ""),
    serviceId: dto.servicoId ?? null,
    description: dto.descricao ?? "",
    detail: overlay.detail ?? "",
    mechanicId:
      dto.mecanicoId !== null && dto.mecanicoId !== undefined
        ? String(dto.mecanicoId)
        : overlay.mechanicId ?? null,
    mechanicName: dto.mecanicoNome ?? null,
    hours: Number(dto.tempoEstimadoHoras ?? overlay.hours ?? 0),
    qty: quantity,
    price: subtotal,
    unitPrice,
    done: overlay.done ?? Boolean(dto.concluido),
    doneAt: dto.concluidoEm ?? overlay.doneAt ?? null,
    discount: Number(dto.desconto ?? 0),
    discountType: discountTypeFromApi(dto.descontoTipo),
  };
}

export function mapOsPeca(dto, overlay = {}) {
  const catalog = getPartByApiId(dto.pecaId);
  const quantity = Number(dto.quantidade ?? 1);

  return {
    id: String(dto.id),
    code: overlay.code ?? catalog?.code ?? (dto.pecaId ? String(dto.pecaId) : ""),
    pecaId: dto.pecaId ?? null,
    description: dto.descricao ?? "",
    unit: overlay.unit ?? dto.unidade ?? catalog?.unit ?? "un",
    qty: quantity,
    unitPrice: Number(dto.valorUnitario ?? 0),
    quoted: overlay.quoted ?? Boolean(dto.cotada),
    installed: Boolean(dto.instalada),
    installedAt: dto.instaladaEm ?? null,
    discount: Number(dto.desconto ?? 0),
    discountType: discountTypeFromApi(dto.descontoTipo),
  };
}

function defaultTimeline(order) {
  const events = [
    {
      id: "T1",
      at: order.openedAt,
      by: order.openedBy,
      text: `OS aberta por ${order.openedBy}`,
      tone: "slate",
    },
  ];

  if (order.deliveredAt) {
    events.push({
      id: "T2",
      at: order.deliveredAt,
      by: order.openedBy,
      text: "Veículo entregue ao cliente",
      tone: "green",
    });
  }
  if (order.canceledAt) {
    events.push({
      id: "T3",
      at: order.canceledAt,
      by: order.openedBy,
      text: order.cancelReason ? `OS cancelada: ${order.cancelReason}` : "OS cancelada",
      tone: "red",
    });
  }

  return events.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

export function mapOrdem(dto, overlay = {}) {
  const status = statusFromApi(dto.status);
  const advanced = ["aprovacao", "aguardando_pecas", "execucao", "pronta", "entregue"].includes(status);
  const openedAt = dto.abertaEm ?? overlay.openedAt ?? nowIso();
  const closedAt = dto.fechadaEm ?? null;

  const order = {
    number: Number(dto.numero),
    status,
    priority: overlay.priority ?? priorityFromApi(dto.prioridade),
    vehicleId:
      dto.veiculoId !== null && dto.veiculoId !== undefined
        ? String(dto.veiculoId)
        : overlay.vehicleId ?? null,
    clientId:
      dto.clienteId !== null && dto.clienteId !== undefined
        ? String(dto.clienteId)
        : overlay.clientId ?? null,
    createdById:
      dto.criadoPorId !== null && dto.criadoPorId !== undefined
        ? String(dto.criadoPorId)
        : null,
    createdByName: dto.criadoPorNome ?? null,
    type: overlay.type ?? dto.tipo ?? "corretiva",
    channel: overlay.channel ?? dto.canal ?? "balcao",
    title: overlay.title ?? dto.titulo ?? "",
    complaint: overlay.complaint ?? dto.relatoCliente ?? dto.observacoes ?? "",
    internalNotes: overlay.internalNotes ?? dto.observacoesInternas ?? "",
    mileageIn: overlay.mileageIn ?? dto.kmEntrada ?? null,
    mileageOut: overlay.mileageOut ?? dto.kmSaida ?? null,
    fuelLevel: overlay.fuelLevel ?? dto.nivelCombustivel ?? null,
    mechanicId:
      overlay.mechanicId ??
      (dto.mecanicoLiderId !== null && dto.mecanicoLiderId !== undefined
        ? String(dto.mecanicoLiderId)
        : null),
    boxId:
      overlay.boxId ??
      (dto.boxId !== null && dto.boxId !== undefined ? String(dto.boxId) : null),
    expectedAt: overlay.expectedAt ?? dto.previsaoEntrega ?? null,
    inspection: overlay.inspection ?? emptyInspection(),
    diagnosis: {
      text: overlay.diagnosis?.text ?? dto.diagnostico ?? "",
      validated: overlay.diagnosis?.validated ?? Boolean(dto.diagnosticoValidado),
    },
    parts: (dto.pecas ?? []).map((item) =>
      mapOsPeca(item, overlay.partsById?.[String(item.id)] ?? {}),
    ),
    services: (dto.servicos ?? []).map((item) =>
      mapOsServico(item, overlay.servicesById?.[String(item.id)] ?? {}),
    ),
    discount: overlay.discount ?? {
      type: discountTypeFromApi(dto.descontoTipo),
      value: Number(dto.desconto ?? 0),
    },
    payment: overlay.payment ?? {
      method: String(dto.formaPagamento ?? "").toLowerCase(),
      installments: Number(dto.parcelas ?? 1),
    },
    warranty: overlay.warranty ?? warrantyFromApi(dto),
    customerNotes: overlay.customerNotes ?? dto.observacoesCliente ?? "",
    approval: overlay.approval ?? approvalFromApi(dto, advanced),
    openedAt,
    openedBy: overlay.openedBy ?? dto.criadoPorNome ?? currentOperator,
    readyAt:
      overlay.readyAt ??
      dto.prontaEm ??
      (status === "pronta" ? closedAt ?? openedAt : null),
    deliveredAt:
      overlay.deliveredAt ??
      dto.entregueEm ??
      (status === "entregue" ? closedAt ?? openedAt : null),
    canceledAt:
      overlay.canceledAt ??
      dto.canceladaEm ??
      (status === "cancelada" ? closedAt ?? openedAt : null),
    cancelReason: overlay.cancelReason ?? dto.motivoCancelamento ?? "",
    quoteId: overlay.quoteId ?? null,
    updatedAt: overlay.updatedAt ?? closedAt ?? openedAt,
    updatedBy: overlay.updatedBy ?? currentOperator,
  };

  if (!order.mechanicId) {
    const leader = order.services.find((line) => line.mechanicId)?.mechanicId;
    order.mechanicId = leader ?? null;
  }

  order.timeline = overlay.timeline?.length
    ? overlay.timeline
    : defaultTimeline(order);

  return order;
}

export function ordemCreatePayload(data) {
  return {
    clienteId: toNumberId(data.clientId),
    veiculoId: toNumberId(data.vehicleId),
    boxId: toNumberId(data.boxId),
    mecanicoLiderId: toNumberId(data.mechanicId),
    prioridade: priorityToApi(data.priority),
    kmEntrada: data.mileageIn ?? null,
    diagnostico: data.diagnosis?.text || null,
    observacoes: data.complaint || null,
    tipo: data.type || null,
    canal: data.channel || null,
    titulo: data.title || null,
    relatoCliente: data.complaint || null,
    observacoesInternas: data.internalNotes || null,
    previsaoEntrega: data.expectedAt || null,
    nivelCombustivel: data.fuelLevel ?? null,
  };
}

function discountTypeToApi(value) {
  return String(value ?? "").toLowerCase() === "percentual" ? "PERCENTUAL" : "VALOR";
}

function warrantyPayload(warranty) {
  const span = WARRANTY_DAYS_KM[warranty];
  return {
    garantiaTipo: warranty || null,
    garantiaDias: span?.days ?? null,
    garantiaKm: span?.km ?? null,
  };
}

const APPROVAL_TO_API = {
  pendente: "PENDENTE",
  enviado: "PENDENTE",
  aprovado: "APROVADO",
  recusado: "RECUSADO",
};

/** Payload de PUT /ordens-servico/{numero} (cabeçalho completo da OS). */
export function osHeaderPayload(order) {
  const payment = order.payment ?? {};
  const discount = order.discount ?? {};
  const approval = order.approval ?? {};

  return {
    boxId: toNumberId(order.boxId),
    mecanicoLiderId: toNumberId(order.mechanicId),
    prioridade: priorityToApi(order.priority),
    kmEntrada: order.mileageIn ?? null,
    kmSaida: order.mileageOut ?? null,
    diagnostico: order.diagnosis?.text || null,
    diagnosticoValidado: Boolean(order.diagnosis?.validated),
    observacoes: order.complaint || null,
    observacoesInternas: order.internalNotes || null,
    observacoesCliente: order.customerNotes || null,
    tipo: order.type || null,
    canal: order.channel || null,
    titulo: order.title || null,
    relatoCliente: order.complaint || null,
    previsaoEntrega: order.expectedAt || null,
    nivelCombustivel: order.fuelLevel ?? null,
    desconto: Number(discount.value) || 0,
    descontoTipo: discountTypeToApi(discount.type),
    formaPagamento: payment.method || null,
    parcelas: Number(payment.installments) || 1,
    ...warrantyPayload(order.warranty),
    aprovacaoStatus: APPROVAL_TO_API[approval.status] ?? null,
    aprovacaoCanal: approval.channel || null,
    aprovacaoEnviadaEm: approval.sentAt || null,
    aprovacaoDecididaEm: approval.decidedAt || null,
    aprovacaoVisualizadaEm: approval.viewedAt || null,
    motivoCancelamento: order.cancelReason || null,
  };
}

export function osServicoPayload(line) {
  const quantity = Number(line.qty ?? 1);
  const total = Number(line.price ?? 0);
  return {
    servicoId: toNumberId(line.serviceId) ?? null,
    descricao: line.description,
    quantidade: quantity,
    valorUnitario:
      line.unitPrice !== undefined
        ? Number(line.unitPrice)
        : Math.round((total / Math.max(quantity, 1)) * 100) / 100,
    mecanicoId: toNumberId(line.mechanicId),
    tempoEstimadoHoras: line.hours ?? null,
    concluido: Boolean(line.done),
    desconto: Number(line.discount) || 0,
    descontoTipo: discountTypeToApi(line.discountType),
  };
}

export function osServicoUpdatePayload(line) {
  return osServicoPayload(line);
}

export function osPecaPayload(line) {
  return {
    pecaId: toNumberId(line.pecaId) ?? null,
    descricao: line.description,
    quantidade: Number(line.qty ?? 1),
    valorUnitario: Number(line.unitPrice ?? 0),
    cotada: line.quoted === undefined ? true : Boolean(line.quoted),
    instalada: Boolean(line.installed),
    desconto: Number(line.discount) || 0,
    descontoTipo: discountTypeToApi(line.discountType),
    unidade: line.unit || null,
  };
}

export function osPecaUpdatePayload(line) {
  return osPecaPayload(line);
}

/* ----------------------------------------------------------------------------
 * Mecânico (UsuarioLogadoDTO)
 * -------------------------------------------------------------------------- */

export function mapMecanico(dto, index = 0) {
  const cargo = dto.cargo ?? "Mecânico";
  const especialidades = String(dto.especialidades ?? "").trim();
  const lead = Boolean(dto.lider) || index === 0 || /lider|gestor|gerente|chefe|supervisor/i.test(cargo);

  return {
    id: String(dto.id),
    name: dto.nome ?? dto.email ?? "Mecânico",
    role: cargo,
    specialty: especialidades || cargo,
    email: dto.email ?? "",
    phone: dto.telefone ?? "",
    lead,
    apiId: dto.id ?? null,
  };
}

/** Campos que vivem apenas no overlay (não são enviados à API). */
export const ORDER_OVERLAY_FIELDS = [
  "type",
  "channel",
  "title",
  "complaint",
  "priority",
  "internalNotes",
  "mileageIn",
  "mileageOut",
  "fuelLevel",
  "mechanicId",
  "boxId",
  "expectedAt",
  "inspection",
  "diagnosis",
  "discount",
  "payment",
  "warranty",
  "customerNotes",
  "approval",
  "openedAt",
  "openedBy",
  "readyAt",
  "deliveredAt",
  "canceledAt",
  "cancelReason",
  "cancelNote",
  "quoteId",
  "rating",
  "timeline",
  "partsById",
  "servicesById",
];

/**
 * Monta o overlay persistível de uma OS. Os itens guardam apenas o que o
 * backend não armazena (código do catálogo, detalhe, concluído/cotado...).
 */
export function orderOverlayFrom(order) {
  const overlay = {};
  ORDER_OVERLAY_FIELDS.forEach((field) => {
    if (order[field] !== undefined) overlay[field] = order[field];
  });

  overlay.partsById = Object.fromEntries(
    (order.parts ?? []).map((line) => [
      String(line.id),
      {
        code: line.code,
        unit: line.unit,
        quoted: line.quoted,
      },
    ]),
  );

  overlay.servicesById = Object.fromEntries(
    (order.services ?? []).map((line) => [
      String(line.id),
      {
        code: line.code,
        detail: line.detail,
        done: line.done,
      },
    ]),
  );

  return overlay;
}

/** Box de atendimento (API) -> formato usado pelas telas. */
export function mapBox(dto) {
  return {
    id: String(dto.id),
    name: dto.nome ?? "Box",
    type: dto.descricao ?? "",
    active: dto.ativo !== false,
    apiId: dto.id ?? null,
  };
}

/** Dados da oficina (API) -> formato de WORKSHOP usado na impressão. */
export function mapWorkshop(dto) {
  const cityLine = [dto.cidade, dto.uf].filter(Boolean).join("/");
  const street = [dto.logradouro, dto.numero, dto.complemento].filter(Boolean).join(", ");
  const district = [dto.bairro, cityLine, dto.cep ? `CEP ${dto.cep}` : ""].filter(Boolean).join(" — ");
  return {
    name: dto.nomeFantasia || dto.nome || "Oficina",
    document: dto.cnpj ?? "",
    address: [street, district].filter(Boolean).join(" — "),
    phone: dto.telefone ?? "",
    whatsapp: dto.whatsapp ?? "",
  };
}
