/**
 * Estrutura da oficina: boxes de atendimento e equipe técnica.
 * TODO: substituir por chamadas à API (Spring Boot) — cadastro em Configurações.
 */

export const BOXES = [
  { id: "BOX-01", name: "Box 01", type: "Elevador Hidráulico" },
  { id: "BOX-02", name: "Box 02", type: "Elevador de Chassi (pesados)" },
  { id: "BOX-03", name: "Box 03", type: "Elevador Hidráulico" },
  { id: "BOX-04", name: "Box 04", type: "Rampa de Diagnóstico" },
  { id: "BOX-05", name: "Box 05", type: "Elevador de Chassi (pesados)" },
  { id: "BOX-06", name: "Box 06", type: "Alinhamento & Balanceamento" },
];

/** Mecânicos e consultores. `lead: true` = mecânico líder (valida diagnósticos). */
export const MECHANICS = [
  { id: "MEC-01", name: "Rafael Sampaio", role: "Mecânico Líder", specialty: "Motor e freios", lead: true },
  { id: "MEC-02", name: "Marcos Teixeira", role: "Mecânico", specialty: "Suspensão e alinhamento" },
  { id: "MEC-03", name: "Diego Almeida", role: "Mecânico", specialty: "Diesel e transmissão" },
  { id: "MEC-04", name: "Lucas Andrade", role: "Eletricista", specialty: "Elétrica e injeção eletrônica" },
];

/** Consultores (vendedores) que emitem orçamentos. */
export const CONSULTANTS = [
  { id: "CON-01", name: "Carlos Eduardo", role: "Gerente" },
  { id: "CON-02", name: "Fernanda Rocha", role: "Consultora Técnica" },
  { id: "CON-03", name: "Bruno Teles", role: "Consultor de Serviços" },
];

/** Dados da oficina usados na impressão da OS e dos orçamentos. */
export const WORKSHOP = {
  name: "Salvô Gestão Automotiva — Oficina Matriz",
  document: "12.345.678/0001-90",
  address: "Av. Santo Amaro, 4120 — Brooklin, São Paulo/SP — CEP 04556-500",
  phone: "(11) 3045-7700",
  whatsapp: "(11) 97777-4500",
};
