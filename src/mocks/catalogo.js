/**
 * Fornecedores de peças.
 * - phone: WhatsApp (somente dígitos) · leadTimeDays: prazo médio de entrega
 */
export const SUPPLIERS = [
  { id: "FOR-01", name: "Distribuidora AutoPeças Paulista", contact: "Renata", phone: "11940021100", email: "pedidos@autopecaspaulista.com.br", leadTimeDays: 1 },
  { id: "FOR-02", name: "Rede Lubrificantes SP", contact: "Márcio", phone: "11950330022", email: "vendas@redelub.com.br", leadTimeDays: 2 },
  { id: "FOR-03", name: "Pneus & Rodas Brasil", contact: "Aline", phone: "11960440033", email: "atacado@pneusrodas.com.br", leadTimeDays: 3 },
  { id: "FOR-04", name: "Diesel Center Peças", contact: "Jorge", phone: "11970550044", email: "compras@dieselcenter.com.br", leadTimeDays: 4 },
  { id: "FOR-05", name: "Elétrica Auto Volts", contact: "Patrícia", phone: "11980660055", email: "contato@autovolts.com.br", leadTimeDays: 2 },
];

export const PART_CATEGORIES = [
  "Freios",
  "Filtros",
  "Lubrificantes",
  "Fluidos",
  "Ignição",
  "Injeção",
  "Motor",
  "Suspensão",
  "Transmissão",
  "Elétrica",
  "Ar-Condicionado",
  "Pneus",
  "Acessórios",
];

/*
 * Catálogo de peças (almoxarifado).
 * TODO: substituir por chamadas à API (Spring Boot) — tela de Estoque.
 *
 * - code: código interno (SKU) · oem: código original do fabricante do veículo
 * - cost / price: custo médio e preço de venda unitários (R$)
 * - stock: quantidade física · minStock: ponto de pedido · maxStock: estoque ideal
 * - location: prateleira · supplierId: fornecedor preferencial
 * - onOrder: pedido de compra em aberto ({ qty, supplierId, orderedAt }) ou null
 */
function partItem(data) {
  return { oem: "", application: "", note: "", maxStock: data.minStock * 3, status: "ativo", onOrder: null, ...data };
}

const daysAgo = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

export const PARTS_CATALOG = [
  partItem({ code: "PF-2041", description: "Pastilha de Freio Dianteira Cerâmica (Nivus/T-Cross)", brand: "Brembo", oem: "2Q0698151", category: "Freios", application: "VW Nivus / T-Cross / Polo", unit: "kit", cost: 190, price: 380, stock: 12, minStock: 5, maxStock: 20, location: "A1-01", supplierId: "FOR-01", note: "Linha Premium" }),
  partItem({ code: "DF-4420", description: "Par de Discos de Freio Ventilados Dianteiros", brand: "Fremax", oem: "2Q0615301", category: "Freios", application: "Golf / Jetta TSI / Nivus", unit: "par", cost: 285, price: 520, stock: 3, minStock: 4, maxStock: 10, location: "A1-02", supplierId: "FOR-01" }),
  partItem({ code: "PT-310", description: "Pastilha de Freio Traseira", brand: "Cobreq", category: "Freios", application: "Linha leve (diversos)", unit: "jogo", cost: 85, price: 179, stock: 0, minStock: 2, maxStock: 8, location: "A1-03", supplierId: "FOR-01" }),
  partItem({ code: "DK-180", description: "Par de Discos de Freio Traseiros", brand: "Fremax", category: "Freios", application: "Honda Civic / Corolla", unit: "par", cost: 160, price: 320, stock: 2, minStock: 2, maxStock: 6, location: "A1-04", supplierId: "FOR-01" }),
  partItem({ code: "OL-530S", description: "Óleo Sintético 5W30 100% Sintético (1L)", brand: "Motul", category: "Lubrificantes", application: "8100 X-cess • API SP / ACEA A3/B4", unit: "un", cost: 34, price: 65, stock: 48, minStock: 20, maxStock: 80, location: "B2-01", supplierId: "FOR-02", note: "Norma VW 508.88 / 509.99" }),
  partItem({ code: "OL-0W20", description: "Óleo Sintético 0W20 (1L)", brand: "Mobil", category: "Lubrificantes", application: "Híbridos e motores turbo modernos", unit: "un", cost: 39, price: 75, stock: 3, minStock: 12, maxStock: 40, location: "B2-03", supplierId: "FOR-02" }),
  partItem({ code: "OL-1540", description: "Óleo Diesel 15W40 Semissintético (1L)", brand: "Lubrax", category: "Lubrificantes", application: "Diesel S10 — linha pesada", unit: "un", cost: 26, price: 48, stock: 40, minStock: 20, maxStock: 80, location: "B2-02", supplierId: "FOR-02" }),
  partItem({ code: "FO-882", description: "Filtro de Óleo Motor TSI", brand: "Mann-Filter", oem: "04E115561H", category: "Filtros", application: "W 712/95 • Linha VW EA211", unit: "un", cost: 28, price: 45, stock: 1, minStock: 6, maxStock: 20, location: "C1-01", supplierId: "FOR-01", note: "Blindado original" }),
  partItem({ code: "FO-310", description: "Filtro de Óleo Universal (linha leve)", brand: "Tecfil", category: "Filtros", application: "PSL 55 • Fiat / GM / Hyundai / Honda", unit: "un", cost: 15, price: 32, stock: 30, minStock: 8, maxStock: 50, location: "C1-02", supplierId: "FOR-01" }),
  partItem({ code: "FA-118", description: "Filtro de Ar do Motor", brand: "Mann-Filter", category: "Filtros", application: "C 27 009 • linha leve (diversos)", unit: "un", cost: 38, price: 78, stock: 10, minStock: 4, maxStock: 20, location: "C1-03", supplierId: "FOR-01" }),
  partItem({ code: "FC-220", description: "Filtro de Cabine (Ar-Condicionado)", brand: "Bosch", category: "Filtros", application: "Carvão ativado • linha leve", unit: "un", cost: 27, price: 59, stock: 14, minStock: 4, maxStock: 20, location: "C1-04", supplierId: "FOR-01" }),
  partItem({ code: "FD-905", description: "Filtro de Combustível Diesel", brand: "Bosch", category: "Filtros", application: "Ranger / S10 / Amarok / Daily", unit: "un", cost: 72, price: 145, stock: 2, minStock: 3, maxStock: 8, location: "C1-05", supplierId: "FOR-04" }),
  partItem({ code: "FA-300", description: "Filtro de Ar Diesel (linha pesada)", brand: "Fram", category: "Filtros", application: "Sprinter / Master / Ducato", unit: "un", cost: 88, price: 175, stock: 2, minStock: 2, maxStock: 6, location: "C1-06", supplierId: "FOR-04" }),
  partItem({ code: "VL-014", description: "Vela de Ignição Iridium", brand: "NGK", category: "Ignição", application: "ILZKR7B11 • motores 1.0/1.4 TSI", unit: "un", cost: 44, price: 89, stock: 16, minStock: 8, maxStock: 32, location: "D1-01", supplierId: "FOR-05" }),
  partItem({ code: "BO-460", description: "Bobina de Ignição", brand: "Bosch", category: "Ignição", application: "VW EA211 / Mini Cooper", unit: "un", cost: 150, price: 310, stock: 1, minStock: 2, maxStock: 4, location: "D1-02", supplierId: "FOR-05" }),
  partItem({ code: "VL-008", description: "Vela de Ignição Platina (descontinuada)", brand: "Bosch", category: "Ignição", application: "Substituída pela VL-014", unit: "un", cost: 22, price: 45, stock: 0, minStock: 0, maxStock: 0, location: "D1-03", supplierId: "FOR-05", status: "inativo" }),
  partItem({ code: "SO-118", description: "Sonda Lambda Pré-Catalisador", brand: "Bosch", category: "Injeção", application: "Toyota Corolla 2.0", unit: "un", cost: 380, price: 720, stock: 1, minStock: 1, maxStock: 3, location: "D2-01", supplierId: "FOR-05" }),
  partItem({ code: "BI-450", description: "Bico Injetor Diesel Common Rail", brand: "Bosch", category: "Injeção", application: "Iveco Daily / Sprinter", unit: "un", cost: 1100, price: 1850, stock: 0, minStock: 1, maxStock: 2, location: "D2-02", supplierId: "FOR-04", onOrder: { qty: 1, supplierId: "FOR-04", orderedAt: daysAgo(1) } }),
  partItem({ code: "AM-771", description: "Amortecedor Dianteiro (par)", brand: "Cofap", category: "Suspensão", application: "Turbogás • Honda Civic 2017+", unit: "par", cost: 640, price: 1290, stock: 1, minStock: 1, maxStock: 3, location: "E1-01", supplierId: "FOR-01" }),
  partItem({ code: "AM-772", description: "Amortecedor Traseiro (par)", brand: "Cofap", category: "Suspensão", application: "Honda Civic 2017+", unit: "par", cost: 490, price: 980, stock: 0, minStock: 1, maxStock: 3, location: "E1-02", supplierId: "FOR-01" }),
  partItem({ code: "KT-330", description: "Kit Batente e Coxim do Amortecedor", brand: "Sampel", category: "Suspensão", application: "Linha leve", unit: "kit", cost: 98, price: 210, stock: 4, minStock: 2, maxStock: 8, location: "E1-03", supplierId: "FOR-01" }),
  partItem({ code: "TB-210", description: "Terminal de Direção", brand: "Nakata", category: "Suspensão", application: "N 99012 • Fiat Strada / Toro", unit: "un", cost: 72, price: 165, stock: 6, minStock: 2, maxStock: 10, location: "E2-01", supplierId: "FOR-01" }),
  partItem({ code: "BH-330", description: "Bieleta da Barra Estabilizadora", brand: "Nakata", category: "Suspensão", application: "VW T-Cross / Polo / Virtus", unit: "un", cost: 52, price: 120, stock: 7, minStock: 2, maxStock: 12, location: "E2-02", supplierId: "FOR-01" }),
  partItem({ code: "RO-210", description: "Rolamento de Roda Traseiro", brand: "SKF", category: "Suspensão", application: "Linha leve (diversos)", unit: "un", cost: 95, price: 210, stock: 0, minStock: 2, maxStock: 6, location: "E2-03", supplierId: "FOR-01" }),
  partItem({ code: "KE-990", description: "Kit Embreagem Completo (platô, disco e rolamento) — Ranger 3.2", brand: "LuK", oem: "624 3398 09", category: "Transmissão", application: "Ford Ranger 3.2 Diesel", unit: "kit", cost: 1720, price: 3150, stock: 0, minStock: 1, maxStock: 2, location: "F1-01", supplierId: "FOR-04", onOrder: { qty: 1, supplierId: "FOR-04", orderedAt: daysAgo(2) } }),
  partItem({ code: "CR-128", description: "Correia Dentada + Tensor", brand: "Gates", category: "Motor", application: "Hyundai HB20 / Kia Picanto", unit: "kit", cost: 310, price: 640, stock: 2, minStock: 1, maxStock: 4, location: "F2-01", supplierId: "FOR-01" }),
  partItem({ code: "CO-090", description: "Correia Poli-V do Alternador", brand: "Dayco", category: "Motor", application: "Linha leve (diversos)", unit: "un", cost: 48, price: 110, stock: 5, minStock: 3, maxStock: 8, location: "F2-02", supplierId: "FOR-01" }),
  partItem({ code: "BA-400", description: "Bomba d'Água", brand: "Urba", category: "Motor", application: "VW EA111 / EA211", unit: "un", cost: 160, price: 340, stock: 1, minStock: 2, maxStock: 4, location: "F2-03", supplierId: "FOR-01" }),
  partItem({ code: "JT-045", description: "Junta da Tampa de Válvulas", brand: "Sabó", category: "Motor", application: "GM Onix / Prisma 1.0 / 1.4", unit: "un", cost: 45, price: 98, stock: 3, minStock: 2, maxStock: 6, location: "F2-04", supplierId: "FOR-01" }),
  partItem({ code: "BT-60A", description: "Bateria 60Ah Selada", brand: "Moura", category: "Elétrica", application: "M60GD • linha leve", unit: "un", cost: 420, price: 690, stock: 6, minStock: 2, maxStock: 10, location: "G1-01", supplierId: "FOR-05" }),
  partItem({ code: "LP-100", description: "Lâmpada H7 Halógena 55W", brand: "Philips", category: "Elétrica", application: "Farol baixo / alto (diversos)", unit: "un", cost: 18, price: 39, stock: 24, minStock: 10, maxStock: 40, location: "G1-02", supplierId: "FOR-05" }),
  partItem({ code: "LP-200", description: "Lâmpada H4 Halógena 60/55W", brand: "Osram", category: "Elétrica", application: "Farol (diversos)", unit: "un", cost: 16, price: 35, stock: 4, minStock: 10, maxStock: 40, location: "G1-03", supplierId: "FOR-05" }),
  partItem({ code: "PN-205", description: "Pneu 205/55 R16", brand: "Pirelli", category: "Pneus", application: "Cinturato P7 • sedãs médios", unit: "un", cost: 380, price: 560, stock: 8, minStock: 4, maxStock: 16, location: "H1-01", supplierId: "FOR-03" }),
  partItem({ code: "PN-175", description: "Pneu 175/70 R14", brand: "Goodyear", category: "Pneus", application: "Direction Touring • compactos", unit: "un", cost: 260, price: 399, stock: 0, minStock: 4, maxStock: 12, location: "H1-02", supplierId: "FOR-03" }),
  partItem({ code: "LQ-DOT4", description: "Fluido de Freio DOT 4 (500ml)", brand: "Bosch", category: "Fluidos", application: "Universal", unit: "un", cost: 19, price: 42, stock: 22, minStock: 6, maxStock: 40, location: "B3-01", supplierId: "FOR-02" }),
  partItem({ code: "LQ-ARR", description: "Aditivo de Arrefecimento Orgânico (1L)", brand: "Paraflu", category: "Fluidos", application: "Concentrado • rosa", unit: "un", cost: 16, price: 38, stock: 18, minStock: 6, maxStock: 30, location: "B3-02", supplierId: "FOR-02" }),
  partItem({ code: "AD-500", description: "Arla 32 (galão 20L)", brand: "Nobel", category: "Fluidos", application: "Diesel Euro 5 / Proconve P7", unit: "galão", cost: 85, price: 165, stock: 12, minStock: 4, maxStock: 20, location: "B3-03", supplierId: "FOR-04" }),
  partItem({ code: "GS-R134", description: "Gás Refrigerante R134a (carga)", brand: "Chemours", category: "Ar-Condicionado", application: "Carga até 650 g", unit: "carga", cost: 110, price: 260, stock: 9, minStock: 3, maxStock: 15, location: "B4-01", supplierId: "FOR-05" }),
  partItem({ code: "PA-022", description: "Palheta do Limpador 22\" (par)", brand: "Bosch", category: "Acessórios", application: "Aerotwin • diversos", unit: "par", cost: 55, price: 119, stock: 10, minStock: 4, maxStock: 16, location: "G2-01", supplierId: "FOR-05" }),
];

/** Categorias da tabela de serviços. */
export const SERVICE_CATEGORIES = [
  "Revisão",
  "Freios",
  "Motor",
  "Suspensão & Direção",
  "Transmissão",
  "Elétrica & Injeção",
  "Ar-Condicionado",
  "Pneus & Geometria",
  "Diagnóstico",
  "Garantia",
];

/*
 * Tabela de serviços (mão de obra).
 * - hours: tempo padrão (TMO) · price: valor da mão de obra
 * - warranty: garantia padrão (chave de WARRANTIES, em pages/OrdensServico/constants.js)
 * - suggestedParts: códigos de peças que costumam acompanhar o serviço
 * - status: "ativo" | "inativo" (inativos não aparecem para novas OS/orçamentos)
 */
function serviceItem(data) {
  return { detail: "", warranty: "90d-5000", suggestedParts: [], status: "ativo", ...data };
}

export const SERVICES_CATALOG = [
  serviceItem({ code: "SV-001", category: "Freios", description: "Substituição de Pastilhas e Discos de Freio Dianteiros", detail: "Inclui limpeza de pinças e sangria", hours: 1.5, price: 250, suggestedParts: ["PF-2041", "DF-4420", "LQ-DOT4"] }),
  serviceItem({ code: "SV-002", category: "Motor", description: "Troca de Óleo e Filtros com Sangria do Sistema", detail: "Procedimento com descarte ecológico registrado", hours: 1, price: 120, warranty: "90d-3000", suggestedParts: ["OL-530S", "FO-310"] }),
  serviceItem({ code: "SV-003", category: "Revisão", description: "Revisão Preventiva Programada (plano do fabricante)", detail: "Checklist de 60 itens", hours: 3, price: 420, suggestedParts: ["OL-530S", "FO-310", "FA-118", "FC-220"] }),
  serviceItem({ code: "SV-004", category: "Diagnóstico", description: "Diagnóstico Eletrônico com Scanner", detail: "Leitura de falhas e parâmetros", hours: 1, price: 180, warranty: "sem" }),
  serviceItem({ code: "SV-005", category: "Suspensão & Direção", description: "Substituição de Amortecedores (par)", detail: "Inclui batentes e coxins", hours: 2, price: 320, warranty: "12m-20000", suggestedParts: ["AM-771", "KT-330"] }),
  serviceItem({ code: "SV-006", category: "Pneus & Geometria", description: "Alinhamento e Balanceamento", detail: "4 rodas com relatório impresso", hours: 1, price: 160, warranty: "90d-3000" }),
  serviceItem({ code: "SV-007", category: "Transmissão", description: "Substituição do Kit de Embreagem", detail: "Remoção e instalação da caixa de câmbio", hours: 6, price: 1250, warranty: "6m-10000", suggestedParts: ["KE-990"] }),
  serviceItem({ code: "SV-008", category: "Motor", description: "Troca de Correia Dentada e Tensor", detail: "Inclui conferência do sincronismo", hours: 3, price: 480, warranty: "12m-20000", suggestedParts: ["CR-128"] }),
  serviceItem({ code: "SV-009", category: "Ar-Condicionado", description: "Higienização e Recarga do Ar-Condicionado", detail: "Teste de vazamento com nitrogênio", hours: 1.5, price: 220, suggestedParts: ["GS-R134", "FC-220"] }),
  serviceItem({ code: "SV-010", category: "Elétrica & Injeção", description: "Limpeza e Teste de Bicos Injetores", detail: "Ultrassom + teste de vazão", hours: 2, price: 280 }),
  serviceItem({ code: "SV-011", category: "Elétrica & Injeção", description: "Substituição de Velas e Bobinas", hours: 1, price: 150, suggestedParts: ["VL-014", "BO-460"] }),
  serviceItem({ code: "SV-012", category: "Freios", description: "Troca de Fluido de Freio", detail: "Sangria completa", hours: 0.8, price: 110, suggestedParts: ["LQ-DOT4"] }),
  serviceItem({ code: "SV-013", category: "Suspensão & Direção", description: "Revisão de Suspensão Dianteira", detail: "Terminais, bieletas e buchas", hours: 1.5, price: 210, suggestedParts: ["TB-210", "BH-330"] }),
  serviceItem({ code: "SV-014", category: "Elétrica & Injeção", description: "Substituição de Bico Injetor Diesel", detail: "Inclui codificação na central", hours: 2.5, price: 450, warranty: "6m-10000", suggestedParts: ["BI-450"] }),
  serviceItem({ code: "SV-015", category: "Garantia", description: "Inspeção de Garantia / Retorno", detail: "Sem custo quando procedente", hours: 1, price: 0, warranty: "sem" }),
  serviceItem({ code: "SV-016", category: "Elétrica & Injeção", description: "Troca de Bateria com Teste do Sistema de Carga", hours: 0.5, price: 60, suggestedParts: ["BT-60A"] }),
  serviceItem({ code: "SV-017", category: "Pneus & Geometria", description: "Montagem e Troca de Pneus (4 un)", detail: "Com válvulas novas e calibragem com nitrogênio", hours: 1, price: 120, warranty: "90d-3000", suggestedParts: ["PN-205"] }),
  serviceItem({ code: "SV-018", category: "Motor", description: "Descarbonização do Motor", detail: "Serviço descontinuado — substituído pela limpeza de bicos", hours: 1.5, price: 190, status: "inativo" }),
];
