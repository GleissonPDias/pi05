import { BOXES, MECHANICS as MOCK_MECHANICS } from "../mocks/oficina";

/**
 * Registro mutável da equipe técnica.
 *
 * A maior parte das telas lê o nome do mecânico de forma síncrona
 * (`mechanicName(id)` em ordemUtils). Quando a API carrega /mecanicos, o
 * OficinaContext atualiza este registro para que essas leituras passem a
 * refletir a equipe real — sem precisar reescrever os componentes.
 */

let mechanics = MOCK_MECHANICS;
let mechanicsById = new Map(MOCK_MECHANICS.map((item) => [String(item.id), item]));

export function getMechanics() {
  return mechanics;
}

export function getBoxes() {
  return BOXES;
}

export function setMechanics(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  mechanics = list;
  mechanicsById = new Map(list.map((item) => [String(item.id), item]));
}

export function resetMechanics() {
  setMechanics(MOCK_MECHANICS);
}

export function getMechanic(id) {
  if (id === null || id === undefined || id === "") return null;
  return mechanicsById.get(String(id)) ?? null;
}

export function getLeadMechanic() {
  return mechanics.find((item) => item.lead) ?? mechanics[0] ?? null;
}
