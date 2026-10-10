import { PARTS_CATALOG, SERVICES_CATALOG } from "./catalogo";
import { currentOperator } from "./user";
import { veiculosMock } from "./veiculos";

/*
 * Ordens de Serviço fictícias.
 * TODO: substituir por chamadas à API (Spring Boot). O formato de `order()`
 * abaixo é o que a API deverá devolver.
 *
 * - number: número sequencial da OS (é o que aparece na tela: #1042)
 * - status: aberta | orcamento | aprovacao | execucao | aguardando_pecas |
 *           pronta | entregue | cancelada
 * - vehicleId / clientId: veículo atendido e cliente responsável na abertura
 * - parts / services: itens do orçamento (valores em R$)
 * - datas com hora em ISO (openedAt, expectedAt, deliveredAt...)
 * - quoteId: orçamento que originou a OS (quando houver)
 */

const HOUR = 3_600_000;
const iso = (ms) => new Date(ms).toISOString();
const hoursAgo = (h) => iso(Date.now() - h * HOUR);
const hoursFromNow = (h) => iso(Date.now() + h * HOUR);

let lineSeq = 0;

/** Linha de peça a partir do catálogo. */
function part(code, qty = 1, extra = {}) {
  const item = PARTS_CATALOG.find((p) => p.code === code);
  lineSeq += 1;
  return {
    id: `P${lineSeq}`,
    code,
    description: item.description,
    unit: item.unit,
    qty,
    unitPrice: item.price,
    quoted: true,
    ...extra,
  };
}

/** Linha de serviço a partir da tabela de mão de obra. */
function service(code, mechanicId, done = false, extra = {}) {
  const item = SERVICES_CATALOG.find((s) => s.code === code);
  lineSeq += 1;
  return {
    id: `S${lineSeq}`,
    code,
    description: item.description,
    detail: item.detail,
    mechanicId,
    hours: item.hours,
    price: item.price,
    done,
    ...extra,
  };
}

const byPlate = Object.fromEntries(veiculosMock.map((v) => [v.plate, v]));

/** Vistoria com todos os itens OK (as exceções vêm em `overrides`). */
function inspection(overrides = {}) {
  const checklist = Object.fromEntries(
    [
      "farois", "lanternas", "setas", "limpadores", "pneus", "estepe",
      "ferramentas", "documento", "multimidia", "arCondicionado", "vidros", "painel",
    ].map((key) => [key, "ok"]),
  );
  return {
    done: true,
    customerAgreed: true,
    belongings: "",
    notes: "",
    damages: [],
    photos: [],
    ...overrides,
    checklist: { ...checklist, ...overrides.checklist },
  };
}

/** Linha do tempo básica, montada a partir das datas da OS. */
function buildTimeline(o) {
  const events = [
    { at: o.openedAt, text: `OS aberta por ${o.openedBy}`, tone: "slate" },
  ];
  const add = (at, text, tone) => at && events.push({ at, text, tone });
  if (o.inspection.done) add(iso(new Date(o.openedAt).getTime() + 0.3 * HOUR), "Vistoria de entrada concluída", "slate");
  add(o.approval.sentAt, "Orçamento enviado ao cliente", "indigo");
  if (o.approval.status === "aprovado") add(o.approval.decidedAt, "Orçamento aprovado pelo cliente", "green");
  if (o.approval.status === "recusado") add(o.approval.decidedAt, "Orçamento recusado pelo cliente", "red");
  (o.extraEvents ?? []).forEach((event) => add(event.at, event.text, event.tone ?? "blue"));
  add(o.readyAt, "Serviços concluídos — veículo pronto para retirada", "green");
  add(o.deliveredAt, "Veículo entregue ao cliente", "green");
  add(o.canceledAt, `OS cancelada: ${o.cancelReason}`, "red");

  return events
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((event, index) => ({ id: `T${index + 1}`, by: o.openedBy, ...event }));
}

/** Monta uma OS com os valores padrão. */
function order({ plate, ...data }) {
  const vehicle = byPlate[plate];
  const base = {
    vehicleId: vehicle.id,
    clientId: vehicle.ownerId,
    title: "",
    type: "revisao",
    channel: "balcao",
    priority: "normal",
    complaint: "",
    internalNotes: "",
    mileageIn: vehicle.mileage,
    mileageOut: null,
    fuelLevel: 2,
    mechanicId: null,
    boxId: null,
    expectedAt: null,
    inspection: inspection(),
    diagnosis: { text: "", validated: false },
    parts: [],
    services: [],
    discount: { type: "valor", value: 0 },
    payment: { method: "", installments: 1 },
    warranty: "90d-5000",
    customerNotes: "",
    approval: { status: "pendente", channel: null, sentAt: null, decidedAt: null, viewedAt: null },
    openedBy: currentOperator,
    readyAt: null,
    deliveredAt: null,
    canceledAt: null,
    cancelReason: "",
    quoteId: null,
    ...data,
  };
  const timeline = buildTimeline(base);
  delete base.extraEvents; // só serve para montar a linha do tempo
  return {
    ...base,
    timeline,
    updatedAt: base.deliveredAt ?? base.canceledAt ?? base.readyAt ?? base.openedAt,
    updatedBy: currentOperator,
  };
}

/* ---------------------------------------------------------------------------
 * Histórico: OS já entregues (geram o histórico e a "última passagem" dos veículos)
 * ------------------------------------------------------------------------- */
const history = [
  ["KXZ-9810", 382, 22, "Revisão 50.000 km", ["SV-003"], [["OL-530S", 4], ["FO-310"], ["FA-118"]]],
  ["BRA-2E19", 162, 20, "Revisão 30.000 km", ["SV-003"], [["OL-530S", 4], ["FO-882"], ["FA-118"], ["FC-220"]]],
  ["KXZ-9810", 201, 44, "Revisão 60.000 km", ["SV-003", "SV-012"], [["OL-530S", 4], ["FO-310"], ["LQ-DOT4", 2]]],
  ["FRT-5D61", 102, 46, "Revisão 90.000 km", ["SV-003"], [["OL-1540", 7], ["FD-905"], ["FA-118"]]],
  ["PQR-7821", 97, 50, "Revisão 100.000 km", ["SV-003", "SV-006"], [["OL-1540", 8], ["FD-905"], ["FO-310"]]],
  ["MVX-1020", 80, 6, "Troca de óleo", ["SV-002"], [["OL-530S", 4], ["FO-310"]]],
  ["RTY-4402", 72, 47, "Revisão 130.000 km", ["SV-003"], [["OL-530S", 7], ["FO-310"], ["FA-118"]]],
  ["FTX-9011", 61, 26, "Revisão 50.000 km", ["SV-003"], [["OL-530S", 4], ["FO-310"], ["FA-118"]]],
  ["JPA-2G18", 61, 24, "Revisão 20.000 km", ["SV-003"], [["OL-530S", 5], ["FO-310"], ["FC-220"]]],
  ["FRT-1A22", 52, 7, "Troca de bateria", ["SV-016"], [["BT-60A"]]],
  ["BRA-2E19", 46, 25, "Revisão 40.000 km", ["SV-003", "SV-009"], [["OL-530S", 4], ["FO-882"], ["GS-R134"]]],
  ["HYU-8822", 45, 8, "Revisão 10.000 km", ["SV-003"], [["OL-530S", 4], ["FO-310"]]],
  ["FRT-3B45", 42, 50, "Revisão 200.000 km", ["SV-003", "SV-008"], [["OL-1540", 7], ["CR-128"]]],
  ["KLM-3030", 34, 23, "Revisão 80.000 km", ["SV-003"], [["OL-530S", 4], ["FO-310"], ["VL-014", 4]]],
  ["FRT-9C07", 25, 70, "Revisão 240.000 km", ["SV-003", "SV-013"], [["OL-1540", 7], ["TB-210", 2]]],
  ["JPA-4F90", 23, 45, "Revisão 30.000 km", ["SV-003"], [["OL-530S", 5], ["FO-310"], ["FA-118"]]],
  ["BTR-4410", 20, 30, "Revisão 20.000 km", ["SV-003"], [["OL-530S", 4], ["FO-882"]]],
  ["NKS-7B34", 14, 49, "Revisão 50.000 km", ["SV-003", "SV-006"], [["OL-530S", 4], ["FO-310"], ["FA-118"]]],
  ["FRT-1A22", 9, 72, "Revisão 180.000 km", ["SV-003", "SV-002"], [["OL-1540", 10], ["FD-905"], ["FA-118"]]],
  ["GHJ-5561", 4, 51, "Troca de óleo e filtros", ["SV-002"], [["OL-530S", 4], ["FO-310"], ["FA-118"]]],
];

const mechanicsCycle = ["MEC-01", "MEC-02", "MEC-03"];

const historyOrders = history
  .map(([plate, daysAgo, durationHours, title, services, parts], index) => {
    const openedAt = hoursAgo(daysAgo * 24 - 9); // aberta pela manhã
    const deliveredAt = iso(new Date(openedAt).getTime() + durationHours * HOUR);
    const mechanicId = mechanicsCycle[index % mechanicsCycle.length];
    const mileage = byPlate[plate].mileage;
    return {
      plate,
      title,
      openedAt,
      deliveredAt,
      readyAt: iso(new Date(deliveredAt).getTime() - 2 * HOUR),
      mileageIn: Math.max(0, Math.round((mileage - daysAgo * 35) / 100) * 100),
      mechanicId,
      services: services.map((code) => service(code, mechanicId, true)),
      parts: parts.map(([code, qty]) => part(code, qty)),
      payment: { method: index % 3 === 0 ? "pix" : "credito", installments: index % 3 === 0 ? 1 : 2 },
      approval: { status: "aprovado", channel: "presencial", sentAt: null, decidedAt: iso(new Date(openedAt).getTime() + HOUR), viewedAt: null },
      status: "entregue",
    };
  })
  .sort((a, b) => a.openedAt.localeCompare(b.openedAt))
  .map((data, index) =>
    order({ ...data, number: 1001 + index, mileageOut: data.mileageIn + 8 }),
  );

/* ---------------------------------------------------------------------------
 * OS em andamento (quadro do pátio), canceladas e entregas recentes
 * ------------------------------------------------------------------------- */
const activeOrders = [
  order({
    number: 1049,
    plate: "MVX-1020",
    status: "aberta",
    type: "eletrica",
    channel: "whatsapp",
    priority: "urgente",
    title: "Diagnóstico de injeção",
    complaint: "Luz da injeção acesa desde ontem; motor falhando em marcha lenta e perdendo força em subidas.",
    openedAt: hoursAgo(0.4),
    expectedAt: hoursFromNow(7),
    fuelLevel: 1,
    mechanicId: "MEC-04",
    inspection: inspection({ checklist: { painel: "atencao", pneus: "atencao" }, notes: "Pneus traseiros com desgaste irregular." }),
  }),
  order({
    number: 1048,
    plate: "HYU-8822",
    status: "aberta",
    type: "corretiva",
    title: "Ruído na suspensão",
    complaint: "Barulho seco na dianteira ao passar em lombadas e buracos.",
    openedAt: hoursAgo(1.2),
    expectedAt: hoursFromNow(30),
    fuelLevel: 3,
    inspection: { done: false, customerAgreed: false, belongings: "", notes: "", damages: [], photos: [], checklist: {} },
  }),
  order({
    number: 1043,
    plate: "KXZ-9810",
    status: "orcamento",
    type: "revisao",
    channel: "agendamento",
    title: "Revisão 70.000 km (atrasada)",
    complaint: "Revisão atrasada. Cliente relata consumo maior de combustível.",
    openedAt: hoursAgo(5),
    expectedAt: hoursFromNow(26),
    mechanicId: "MEC-01",
    diagnosis: { text: "Revisão de 70.000 km pendente. Sonda lambda com leitura lenta (possível causa do consumo elevado).", validated: false },
    services: [service("SV-003", "MEC-01"), service("SV-010", "MEC-04")],
    parts: [part("OL-530S", 4), part("FO-310"), part("SO-118", 1, { quoted: false })],
  }),
  order({
    number: 1040,
    plate: "JPA-4F90",
    status: "orcamento",
    type: "corretiva",
    priority: "alta",
    channel: "telefone",
    title: "Ruído no freio dianteiro",
    complaint: "Chiado forte ao frear, principalmente pela manhã.",
    openedAt: hoursAgo(3),
    expectedAt: hoursFromNow(22),
    mechanicId: "MEC-01",
    diagnosis: { text: "Pastilhas dianteiras no limite (2 mm). Discos com leve empenamento.", validated: true },
    services: [service("SV-001", "MEC-01")],
    parts: [part("PF-2041"), part("DF-4420", 1, { quoted: false })],
  }),
  order({
    number: 1041,
    plate: "GHJ-5561",
    status: "aprovacao",
    type: "corretiva",
    priority: "normal",
    channel: "whatsapp",
    title: "Amortecedores dianteiros",
    complaint: "Carro balançando muito em curvas e quebra-molas após a última viagem.",
    openedAt: hoursAgo(20),
    expectedAt: hoursFromNow(28),
    mechanicId: "MEC-02",
    diagnosis: { text: "Amortecedores dianteiros com vazamento de óleo e batentes ressecados. Recomendada a troca do par com kit de batentes.", validated: true },
    services: [service("SV-005", "MEC-02"), service("SV-006", "MEC-02")],
    parts: [part("AM-771"), part("KT-330")],
    approval: { status: "enviado", channel: "whatsapp", sentAt: hoursAgo(6), decidedAt: null, viewedAt: null },
  }),
  order({
    number: 1038,
    plate: "KLM-3030",
    status: "aprovacao",
    channel: "portal",
    title: "Correia dentada + velas",
    complaint: "Revisão de 90.000 km solicitada pelo portal. Cliente pediu orçamento da correia dentada.",
    openedAt: hoursAgo(26),
    expectedAt: hoursFromNow(20),
    mechanicId: "MEC-01",
    diagnosis: { text: "Correia dentada no prazo de substituição (90.000 km). Velas com eletrodos gastos.", validated: true },
    services: [service("SV-008", "MEC-01"), service("SV-011", "MEC-01")],
    parts: [part("CR-128"), part("VL-014", 4)],
    approval: { status: "enviado", channel: "portal", sentAt: hoursAgo(18), decidedAt: null, viewedAt: hoursAgo(3) },
  }),
  order({
    number: 1046,
    plate: "NKS-7B34",
    status: "aprovacao",
    type: "arcondicionado",
    priority: "baixa",
    title: "Ar-condicionado sem gelar",
    complaint: "Ar-condicionado só sai ar quente.",
    openedAt: hoursAgo(4),
    expectedAt: hoursFromNow(24),
    mechanicId: "MEC-04",
    diagnosis: { text: "Baixa carga de gás. Teste de vazamento sem perdas aparentes.", validated: true },
    services: [service("SV-009", "MEC-04")],
    parts: [part("GS-R134"), part("FC-220")],
  }),
  order({
    number: 1042,
    quoteId: "ORC-0089",
    plate: "BRA-2E19",
    status: "execucao",
    type: "revisao",
    priority: "alta",
    channel: "agendamento",
    title: "Revisão 45k + Pastilhas e Discos",
    complaint: "Revisão de 45.000 km. Cliente relata ruído metálico ao frear e vibração no volante.",
    openedAt: hoursAgo(6),
    expectedAt: hoursFromNow(5),
    mileageIn: 45200,
    fuelLevel: 2,
    mechanicId: "MEC-01",
    boxId: "BOX-03",
    inspection: inspection({
      checklist: { pneus: "atencao" },
      damages: [{ id: "D1", area: "parachoqueDianteiro", type: "risco" }],
      belongings: "Óculos de sol no porta-luvas; cadeirinha infantil no banco traseiro.",
      notes: "Pneus dianteiros com 40% de vida útil.",
    }),
    diagnosis: {
      text: "Após desmontagem das rodas dianteiras, constatado desgaste excessivo das pastilhas de freio além do limite de segurança (1,5 mm restante), com leve espelhamento dos discos dianteiros. Necessária substituição imediata do jogo de pastilhas e retífica/troca dos discos dianteiros.",
      validated: true,
    },
    parts: [part("PF-2041"), part("DF-4420"), part("OL-530S", 4), part("FO-882")],
    services: [
      service("SV-001", "MEC-01", true),
      service("SV-002", "MEC-02", true),
      service("SV-012", "MEC-01", true),
      service("SV-006", "MEC-02", false),
    ],
    discount: { type: "valor", value: 75 },
    payment: { method: "credito", installments: 3 },
    approval: { status: "aprovado", channel: "whatsapp", sentAt: hoursAgo(5), decidedAt: hoursAgo(4.5), viewedAt: hoursAgo(4.8) },
    extraEvents: [{ at: hoursAgo(4.4), text: "Status alterado para Em Execução (Box 03)" }],
  }),
  order({
    number: 1047,
    quoteId: "ORC-0085",
    plate: "BTR-4410",
    status: "execucao",
    type: "corretiva",
    title: "Suspensão dianteira + alinhamento",
    complaint: "Ruído na suspensão dianteira e volante puxando para a direita.",
    openedAt: hoursAgo(28),
    expectedAt: hoursFromNow(3),
    mechanicId: "MEC-02",
    boxId: "BOX-01",
    diagnosis: { text: "Bieletas da barra estabilizadora com folga. Geometria fora do especificado.", validated: true },
    services: [service("SV-013", "MEC-02", true), service("SV-006", "MEC-02")],
    parts: [part("BH-330", 2)],
    payment: { method: "pix", installments: 1 },
    approval: { status: "aprovado", channel: "presencial", sentAt: null, decidedAt: hoursAgo(24), viewedAt: null },
  }),
  order({
    number: 1044,
    plate: "FRT-1A22",
    status: "execucao",
    type: "garantia",
    priority: "urgente",
    channel: "frota",
    title: "Retorno: falha na marcha lenta",
    complaint: "Retorno da revisão de 180.000 km: veículo falhando em marcha lenta e com fumaça escura.",
    openedAt: hoursAgo(30),
    expectedAt: hoursFromNow(-2),
    mechanicId: "MEC-03",
    boxId: "BOX-02",
    diagnosis: { text: "Bicos injetores com vazão irregular. Filtro de combustível instalado corretamente. Retorno procedente: limpeza dos bicos sem custo para o cliente.", validated: true },
    services: [
      service("SV-015", "MEC-03", true),
      service("SV-010", "MEC-03", false, { price: 0, detail: "Garantia — sem custo" }),
      service("SV-004", "MEC-04", true, { price: 0, detail: "Garantia — sem custo" }),
    ],
    payment: { method: "faturado", installments: 1 },
    warranty: "90d-5000",
    approval: { status: "aprovado", channel: "telefone", sentAt: null, decidedAt: hoursAgo(26), viewedAt: null },
  }),
  order({
    number: 1039,
    quoteId: "ORC-0083",
    plate: "PQR-7821",
    status: "aguardando_pecas",
    type: "corretiva",
    priority: "alta",
    channel: "frota",
    title: "Kit embreagem",
    complaint: "Embreagem patinando com carga e pedal alto.",
    openedAt: hoursAgo(50),
    expectedAt: hoursFromNow(30),
    mechanicId: "MEC-03",
    boxId: "BOX-05",
    diagnosis: { text: "Disco de embreagem no limite de desgaste e platô com molas fadigadas. Câmbio já removido.", validated: true },
    services: [service("SV-007", "MEC-03")],
    parts: [part("KE-990"), part("LQ-DOT4", 1)],
    payment: { method: "faturado", installments: 1 },
    approval: { status: "aprovado", channel: "email", sentAt: hoursAgo(44), decidedAt: hoursAgo(40), viewedAt: null },
    extraEvents: [{ at: hoursAgo(39), text: "Peça KE-990 solicitada ao fornecedor (previsão: 2 dias)", tone: "orange" }],
  }),
  order({
    number: 1045,
    plate: "FRT-5D61",
    status: "aguardando_pecas",
    type: "corretiva",
    channel: "frota",
    title: "Bico injetor diesel",
    complaint: "Motor com perda de potência e consumo alto.",
    openedAt: hoursAgo(26),
    expectedAt: hoursFromNow(48),
    mechanicId: "MEC-03",
    diagnosis: { text: "Bico injetor do 3º cilindro travado aberto (teste de retorno).", validated: true },
    services: [service("SV-004", "MEC-04", true), service("SV-014", "MEC-03")],
    parts: [part("BI-450")],
    payment: { method: "faturado", installments: 1 },
    approval: { status: "aprovado", channel: "whatsapp", sentAt: hoursAgo(22), decidedAt: hoursAgo(21), viewedAt: hoursAgo(21.5) },
  }),
  order({
    number: 1036,
    quoteId: "ORC-0080",
    plate: "FTX-9011",
    status: "pronta",
    type: "pneus",
    title: "Alinhamento + terminais",
    complaint: "Pneus gastando por dentro.",
    openedAt: hoursAgo(30),
    expectedAt: hoursFromNow(1),
    mechanicId: "MEC-02",
    services: [service("SV-013", "MEC-02", true), service("SV-006", "MEC-02", true)],
    parts: [part("TB-210", 2)],
    payment: { method: "pix", installments: 1 },
    approval: { status: "aprovado", channel: "whatsapp", sentAt: hoursAgo(28), decidedAt: hoursAgo(27), viewedAt: hoursAgo(27.5) },
    readyAt: hoursAgo(2),
  }),
  order({
    number: 1033,
    quoteId: "ORC-0078",
    plate: "JPA-2G18",
    status: "pronta",
    type: "eletrica",
    title: "Velas e bobina",
    complaint: "Motor trepidando na partida a frio.",
    openedAt: hoursAgo(52),
    expectedAt: hoursAgo(4),
    mechanicId: "MEC-04",
    services: [service("SV-004", "MEC-04", true), service("SV-011", "MEC-04", true)],
    parts: [part("VL-014", 4), part("BO-460")],
    payment: { method: "credito", installments: 2 },
    approval: { status: "aprovado", channel: "whatsapp", sentAt: hoursAgo(48), decidedAt: hoursAgo(47), viewedAt: hoursAgo(47.5) },
    readyAt: hoursAgo(5),
  }),
  order({
    number: 1035,
    plate: "ABC-1234",
    status: "entregue",
    type: "revisao",
    title: "Revisão 35.000 km",
    complaint: "Revisão programada.",
    openedAt: hoursAgo(27),
    mechanicId: "MEC-01",
    services: [service("SV-003", "MEC-01", true), service("SV-009", "MEC-04", true)],
    parts: [part("OL-530S", 4), part("FO-310"), part("FA-118"), part("FC-220")],
    payment: { method: "debito", installments: 1 },
    approval: { status: "aprovado", channel: "presencial", sentAt: null, decidedAt: hoursAgo(26), viewedAt: null },
    readyAt: hoursAgo(5),
    deliveredAt: hoursAgo(2),
    mileageIn: 38400,
    mileageOut: 38450,
  }),
  order({
    number: 1037,
    plate: "FRT-9C07",
    status: "cancelada",
    channel: "frota",
    title: "Revisão 245.000 km",
    openedAt: hoursAgo(30),
    canceledAt: hoursAgo(29),
    cancelReason: "OS aberta em duplicidade",
  }),
  order({
    number: 1034,
    plate: "FRT-3B45",
    status: "cancelada",
    type: "corretiva",
    channel: "frota",
    title: "Troca de embreagem",
    openedAt: hoursAgo(60),
    canceledAt: hoursAgo(50),
    cancelReason: "Orçamento recusado pelo cliente",
    services: [service("SV-007", "MEC-03")],
    approval: { status: "recusado", channel: "email", sentAt: hoursAgo(55), decidedAt: hoursAgo(50), viewedAt: null },
  }),
  order({
    number: 1032,
    plate: "RTY-4402",
    status: "cancelada",
    type: "diagnostico",
    title: "Avaliação de câmbio",
    openedAt: hoursAgo(75),
    canceledAt: hoursAgo(70),
    cancelReason: "Cliente desistiu do serviço",
  }),
];

export const ordensMock = [...activeOrders, ...historyOrders];
