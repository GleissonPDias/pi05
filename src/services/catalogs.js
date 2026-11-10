import { api } from "./api";

/**
 * Cache compartilhado dos catálogos (/servicos e /pecas).
 *
 * As OS só guardam `servicoId`/`pecaId`; a interface trabalha com códigos
 * (SV-001, OL-530S). Este cache resolve id -> código e evita baixar o catálogo
 * mais de uma vez pelos diferentes hooks.
 */

let services = [];
let parts = [];
let serviceById = new Map();
let partById = new Map();
let serviceByCode = new Map();
let partByCode = new Map();
let servicesPromise = null;
let partsPromise = null;

function index() {
  serviceById = new Map(
    services
      .filter((item) => item.apiId !== null && item.apiId !== undefined)
      .map((item) => [String(item.apiId), item]),
  );
  partById = new Map(
    parts
      .filter((item) => item.apiId !== null && item.apiId !== undefined)
      .map((item) => [String(item.apiId), item]),
  );
  serviceByCode = new Map(services.map((item) => [item.code, item]));
  partByCode = new Map(parts.map((item) => [item.code, item]));
}

export function registerServices(list) {
  if (Array.isArray(list)) {
    services = list;
    index();
  }
}

export function registerParts(list) {
  if (Array.isArray(list)) {
    parts = list;
    index();
  }
}

export function loadServices() {
  if (!servicesPromise) {
    servicesPromise = api.servicos
      .list()
      .then((list) => {
        // Normaliza o DTO cru para o formato mínimo usado nas OS (código/API id).
        registerServices(
          (Array.isArray(list) ? list : []).map((dto) => ({
            code: dto.codigo ?? String(dto.id),
            apiId: dto.id ?? null,
            description: dto.nome ?? "",
            hours: 1,
            price: Number(dto.precoBase ?? 0),
            unit: "un",
          })),
        );
        return list;
      })
      .catch((error) => {
        servicesPromise = null;
        throw error;
      });
  }
  return servicesPromise;
}

export function loadParts() {
  if (!partsPromise) {
    partsPromise = api.pecas
      .list()
      .then((list) => {
        registerParts(
          (Array.isArray(list) ? list : []).map((dto) => ({
            code: dto.codigo ?? String(dto.id),
            apiId: dto.id ?? null,
            description: dto.nome ?? "",
            unit: "un",
          })),
        );
        return list;
      })
      .catch((error) => {
        partsPromise = null;
        throw error;
      });
  }
  return partsPromise;
}

export function loadCatalogs() {
  return Promise.all([loadServices(), loadParts()]);
}

export function getServiceByApiId(apiId) {
  if (apiId === null || apiId === undefined) return null;
  return serviceById.get(String(apiId)) ?? null;
}

export function getPartByApiId(apiId) {
  if (apiId === null || apiId === undefined) return null;
  return partById.get(String(apiId)) ?? null;
}

export function getServiceByCode(code) {
  return serviceByCode.get(code) ?? null;
}

export function getPartByCode(code) {
  return partByCode.get(code) ?? null;
}

export function serviceApiId(code) {
  if (!code) return null;
  const item = serviceByCode.get(code);
  if (item?.apiId !== null && item?.apiId !== undefined) return Number(item.apiId);
  const numeric = Number(code);
  return Number.isFinite(numeric) ? numeric : null;
}

export function partApiId(code) {
  if (!code) return null;
  const item = partByCode.get(code);
  if (item?.apiId !== null && item?.apiId !== undefined) return Number(item.apiId);
  const numeric = Number(code);
  return Number.isFinite(numeric) ? numeric : null;
}

export function resetCatalogs() {
  services = [];
  parts = [];
  index();
  servicesPromise = null;
  partsPromise = null;
}
