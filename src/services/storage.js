/**
 * Persistência local de dados que o backend ainda não expõe.
 *
 * A API salvo-api guarda apenas os campos "core" (nome, documento, placa,
 * itens da OS...). Os campos complementares da interface (endereço, foto,
 * checklist, pagamento, garantia, rascunhos e catálogo de serviços) ficam em
 * overlays no localStorage, por oficina/usuário.
 */

const PREFIX = "salvo.overlay.v1:";

export const KEYS = {
  clients: "clients",
  deactivatedClients: "deactivatedClients",
  vehicles: "vehicles",
  localVehicles: "localVehicles",
  orders: "orders",
  services: "services",
  localServices: "localServices",
  deletedServices: "deletedServices",
  parts: "parts",
  localParts: "localParts",
  deletedParts: "deletedParts",
  movements: "movements",
  quotes: "quotes",
};

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    if (value === undefined || value === null) {
      localStorage.removeItem(PREFIX + key);
    } else {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    }
  } catch {
    // sem localStorage: mantém apenas em memória
  }
}

export function readMap(key) {
  const value = read(key, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function writeMap(key, value) {
  write(key, value);
}

export function readList(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
}

export function writeList(key, value) {
  write(key, value);
}

/** Grava/remove um overlay por id (cliente, veículo, OS...). */
export function patchOverlay(key, id, patch) {
  const map = readMap(key);
  const next = { ...(map[id] ?? {}), ...patch };
  Object.keys(next).forEach((field) => {
    if (next[field] === undefined) delete next[field];
  });
  map[id] = next;
  writeMap(key, map);
  return next;
}

export function getOverlay(key, id) {
  return readMap(key)[id] ?? {};
}

export function removeOverlay(key, id) {
  const map = readMap(key);
  if (!(id in map)) return;
  delete map[id];
  writeMap(key, map);
}
