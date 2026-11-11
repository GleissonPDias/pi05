import { WORKSHOP as MOCK_WORKSHOP } from "../mocks/oficina";

/**
 * Dados da oficina usados em documentos impressos e mensagens.
 * O OficinaContext atualiza este registro com `GET /oficina`; as leituras
 * síncronas (cabeçalho de impressão, mensagens ao fornecedor) continuam simples.
 */

let workshop = MOCK_WORKSHOP;

export function getWorkshop() {
  return workshop;
}

export function setWorkshop(next) {
  if (next && typeof next === "object") workshop = next;
}

export function resetWorkshop() {
  workshop = MOCK_WORKSHOP;
}
