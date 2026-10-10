import { PARTS_CATALOG, SERVICES_CATALOG } from "./catalogo";
import { currentOperator } from "./user";
import { veiculosMock } from "./veiculos";

/*
 * Orçamentos (propostas comerciais) fictícios.
 * TODO: substituir por chamadas à API (Spring Boot). O formato de `quote()` é o
 * que a API deverá devolver.
 *
 * - status: rascunho | enviado | aprovado | rejeitado
 *   ("Vencido" é calculado: enviado e com validUntil no passado)
 * - orderNumber: OS gerada a partir do orçamento (quando convertido)
 * - sellerId: consultor responsável (mocks/oficina.js → CONSULTANTS)
 */

const HOUR = 3_600_000;
const iso = (ms) => new Date(ms).toISOString();
const hoursAgo = (h) => iso(Date.now() - h * HOUR);
const daysAgo = (d) => hoursAgo(d * 24);

let seq = 0;

function part(code, qty = 1) {
  const item = PARTS_CATALOG.find((p) => p.code === code);
  seq += 1;
  return { id: `QP${seq}`, code, description: item.description, unit: item.unit, qty, unitPrice: item.price, quoted: true };
}

function service(code) {
  const item = SERVICES_CATALOG.find((s) => s.code === code);
  seq += 1;
  return { id: `QS${seq}`, code, description: item.description, detail: item.detail, mechanicId: null, hours: item.hours, price: item.price, done: false };
}

const byPlate = Object.fromEntries(veiculosMock.map((v) => [v.plate, v]));
const channelLabel = { whatsapp: "WhatsApp", presencial: "presencialmente", telefone: "telefone", email: "e-mail" };

function timeline(q) {
  const events = [{ at: q.issuedAt, text: `Orçamento criado por ${currentOperator}`, tone: "slate" }];
  if (q.sentAt) events.push({ at: q.sentAt, text: `Proposta enviada ao cliente via ${channelLabel[q.sentChannel] ?? "WhatsApp"}`, tone: "indigo" });
  if (q.viewedAt) events.push({ at: q.viewedAt, text: "Cliente visualizou a proposta", tone: "slate" });
  if (q.status === "aprovado") events.push({ at: q.decidedAt, text: "Proposta aprovada pelo cliente", tone: "green" });
  if (q.status === "rejeitado") events.push({ at: q.decidedAt, text: `Proposta rejeitada: ${q.rejectReason}`, tone: "red" });
  if (q.orderNumber) events.push({ at: q.convertedAt, text: `Convertido na OS #${q.orderNumber}`, tone: "blue" });
  return events
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((event, index) => ({ id: `QT${q.number}-${index}`, by: currentOperator, ...event }));
}

function quote({ number, plate, issuedDaysAgo, validityDays = 7, ...data }) {
  const vehicle = byPlate[plate];
  const issuedAt = daysAgo(issuedDaysAgo);
  const base = {
    id: `ORC-${String(number).padStart(4, "0")}`,
    number,
    vehicleId: vehicle.id,
    clientId: vehicle.ownerId,
    sellerId: "CON-01",
    type: "corretiva",
    title: "",
    parts: [],
    services: [],
    discount: { type: "valor", value: 0 },
    notes: "",
    validityDays,
    issuedAt,
    validUntil: iso(new Date(issuedAt).getTime() + validityDays * 24 * HOUR),
    status: "enviado",
    sentAt: iso(new Date(issuedAt).getTime() + 0.2 * HOUR),
    sentChannel: "whatsapp",
    viewedAt: null,
    decidedAt: null,
    decisionChannel: null,
    rejectReason: "",
    orderNumber: null,
    convertedAt: null,
    ...data,
  };
  return { ...base, timeline: timeline(base), updatedAt: base.convertedAt ?? base.decidedAt ?? base.sentAt ?? issuedAt, updatedBy: currentOperator };
}

export const orcamentosMock = [
  // Aprovados (5 já viraram OS)
  quote({
    number: 89, plate: "BRA-2E19", issuedDaysAgo: 0.28, type: "revisao", title: "Revisão 45k + freios",
    services: [service("SV-001"), service("SV-002"), service("SV-012"), service("SV-006")],
    parts: [part("PF-2041"), part("DF-4420"), part("OL-530S", 4), part("FO-882")],
    discount: { type: "valor", value: 75 },
    viewedAt: hoursAgo(6.2), status: "aprovado", decidedAt: hoursAgo(6.1), decisionChannel: "whatsapp",
    orderNumber: 1042, convertedAt: hoursAgo(6),
  }),
  quote({
    number: 85, plate: "BTR-4410", issuedDaysAgo: 1.3, sellerId: "CON-02", title: "Suspensão + alinhamento",
    services: [service("SV-013"), service("SV-006")], parts: [part("BH-330", 2)],
    viewedAt: daysAgo(1.25), status: "aprovado", decidedAt: daysAgo(1.2), decisionChannel: "presencial",
    orderNumber: 1047, convertedAt: daysAgo(1.17),
  }),
  quote({
    number: 83, plate: "PQR-7821", issuedDaysAgo: 2.2, sellerId: "CON-03", title: "Kit embreagem", validityDays: 15,
    services: [service("SV-007")], parts: [part("KE-990"), part("LQ-DOT4")],
    sentChannel: "email", status: "aprovado", decidedAt: daysAgo(2.1), decisionChannel: "email",
    orderNumber: 1039, convertedAt: daysAgo(2.08),
  }),
  quote({
    number: 80, plate: "FTX-9011", issuedDaysAgo: 1.4, sellerId: "CON-02", type: "pneus", title: "Alinhamento + terminais",
    services: [service("SV-013"), service("SV-006")], parts: [part("TB-210", 2)],
    viewedAt: daysAgo(1.35), status: "aprovado", decidedAt: daysAgo(1.3), decisionChannel: "whatsapp",
    orderNumber: 1036, convertedAt: daysAgo(1.25),
  }),
  quote({
    number: 78, plate: "JPA-2G18", issuedDaysAgo: 2.3, type: "eletrica", title: "Velas e bobina",
    services: [service("SV-004"), service("SV-011")], parts: [part("VL-014", 4), part("BO-460")],
    viewedAt: daysAgo(2.25), status: "aprovado", decidedAt: daysAgo(2.2), decisionChannel: "whatsapp",
    orderNumber: 1033, convertedAt: daysAgo(2.17),
  }),
  quote({
    number: 87, plate: "RTY-4402", issuedDaysAgo: 2, sellerId: "CON-03", title: "Pastilhas + discos dianteiros",
    services: [service("SV-001")], parts: [part("PF-2041"), part("DF-4420")],
    viewedAt: daysAgo(1.6), status: "aprovado", decidedAt: daysAgo(1), decisionChannel: "telefone",
    notes: "Cliente vai trazer a Amarok na próxima segunda-feira pela manhã.",
  }),

  // Aguardando resposta
  quote({
    number: 88, plate: "ABC-1234", issuedDaysAgo: 6, sellerId: "CON-02", title: "Troca pastilhas + discos",
    services: [service("SV-001")], parts: [part("PF-2041"), part("DF-4420"), part("LQ-DOT4")], viewedAt: daysAgo(5.5),
  }),
  quote({
    number: 86, plate: "FRT-3B45", issuedDaysAgo: 2, type: "revisao", title: "Revisão 210.000 km", sentChannel: "email",
    services: [service("SV-003"), service("SV-008")], parts: [part("OL-1540", 7), part("CR-128"), part("FA-118")],
    discount: { type: "percentual", value: 5 }, viewedAt: daysAgo(1.5), notes: "Desconto de frota (5%) aplicado.",
  }),
  quote({
    number: 84, plate: "FRT-9C07", issuedDaysAgo: 3, validityDays: 15, sellerId: "CON-03", title: "Embreagem Ducato", sentChannel: "email",
    services: [service("SV-007")], parts: [part("KE-990")],
  }),
  quote({
    number: 82, plate: "MVX-1020", issuedDaysAgo: 1, sellerId: "CON-02", type: "pneus", title: "4 pneus + alinhamento",
    services: [service("SV-017"), service("SV-006")], parts: [part("PN-205", 4)], viewedAt: hoursAgo(20),
  }),
  quote({
    number: 81, plate: "NKS-7B34", issuedDaysAgo: 4, validityDays: 15, title: "Correia dentada",
    services: [service("SV-008")], parts: [part("CR-128")], viewedAt: daysAgo(3.8),
  }),
  quote({
    number: 79, plate: "GHJ-5561", issuedDaysAgo: 0.2, sellerId: "CON-03", type: "arcondicionado", title: "Higienização + filtro AC",
    services: [service("SV-009")], parts: [part("GS-R134"), part("FC-220")],
  }),
  quote({
    number: 77, plate: "HYU-8822", issuedDaysAgo: 3, sellerId: "CON-02", type: "revisao", title: "Revisão 20.000 km",
    services: [service("SV-003")], parts: [part("OL-530S", 4), part("FO-310"), part("FC-220")],
  }),

  // Rejeitados
  quote({
    number: 76, plate: "KXZ-9810", issuedDaysAgo: 9, validityDays: 15, title: "Kit embreagem + bicos",
    services: [service("SV-007"), service("SV-014")], parts: [part("KE-990"), part("BI-450")],
    viewedAt: daysAgo(8.5), status: "rejeitado", decidedAt: daysAgo(7), decisionChannel: "whatsapp",
    rejectReason: "Preço das peças genuínas",
  }),
  quote({
    number: 74, plate: "JPA-4F90", issuedDaysAgo: 12, sellerId: "CON-02", type: "pneus", title: "4 pneus",
    services: [service("SV-017")], parts: [part("PN-205", 4)],
    viewedAt: daysAgo(11.5), status: "rejeitado", decidedAt: daysAgo(10), decisionChannel: "telefone",
    rejectReason: "Fechou com outra oficina",
  }),
  quote({
    number: 73, plate: "FRT-1A22", issuedDaysAgo: 15, sellerId: "CON-03", type: "eletrica", title: "Bateria 60Ah", sentChannel: "email",
    services: [service("SV-016")], parts: [part("BT-60A")],
    status: "rejeitado", decidedAt: daysAgo(14), decisionChannel: "email", rejectReason: "Prazo de execução",
  }),

  // Vencidos (enviados, sem resposta dentro da validade)
  quote({
    number: 75, plate: "GHJ-5561", issuedDaysAgo: 11, sellerId: "CON-02", title: "Suspensão dianteira",
    services: [service("SV-005")], parts: [part("AM-771"), part("KT-330")], viewedAt: daysAgo(10),
  }),
  quote({
    number: 72, plate: "KLM-3030", issuedDaysAgo: 25, validityDays: 15, type: "revisao", title: "Revisão 90.000 km",
    services: [service("SV-003"), service("SV-008")], parts: [part("OL-530S", 4), part("CR-128")],
  }),
];
