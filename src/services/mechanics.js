import { BOXES, MECHANICS as MOCK_MECHANICS } from "../mocks/oficina";

/**
 * Registro mutável da equipe técnica e dos boxes.
 *
 * A maior parte das telas lê o nome do mecânico (e do box) de forma síncrona
 * (`mechanicName(id)` em ordemUtils). Quando a API carrega /mecanicos e /boxes,
 * o OficinaContext atualiza estes registros para que essas leituras passem a
 * refletir a oficina real — sem precisar reescrever os componentes.
 */

let mechanics = MOCK_MECHANICS;
let mechanicsById = new Map(MOCK_MECHANICS.map((item) => [String(item.id), item]));
let boxes = BOXES;
let boxesById = new Map(BOXES.map((item) => [String(item.id), item]));

export function getMechanics() {
  return mechanics;
}

export function getBoxes() {
  return boxes;
}

export function setMechanics(list) {
  if (!Array.isArray(list)) return;
  mechanics = list;
  mechanicsById = new Map(list.map((item) => [String(item.id), item]));
}

export function setBoxes(list) {
  if (!Array.isArray(list)) return;
  boxes = list;
  boxesById = new Map(list.map((item) => [String(item.id), item]));
}

export function resetMechanics() {
  setMechanics(MOCK_MECHANICS);
}

export function resetBoxes() {
  setBoxes(BOXES);
}

export function getMechanic(id) {
  if (id === null || id === undefined || id === "") return null;
  return mechanicsById.get(String(id)) ?? null;
}

export function getBox(id) {
  if (id === null || id === undefined || id === "") return null;
  return boxesById.get(String(id)) ?? null;
}

export function getLeadMechanic() {
  return mechanics.find((item) => item.lead) ?? mechanics[0] ?? null;
}
