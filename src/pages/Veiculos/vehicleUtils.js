import { daysSince, formatDate } from "../../utils/dates";
import { maskPlate } from "../../utils/masks";
import { BOXES_TOTAL } from "./constants";

/** Texto e cor de cada situação de manutenção. */
export const MAINTENANCE = {
  maintenance: { label: "Em Manutenção", tone: "amber" },
  overdue: { label: "Revisão Atrasada", tone: "red" },
  ok: { label: "Em Dia / Liberado", tone: "green" },
  draft: { label: "Rascunho", tone: "slate" },
};

/**
 * Situação de manutenção do veículo:
 * - draft: cadastro salvo como rascunho
 * - maintenance: tem OS em andamento
 * - overdue: passou do km ou da data prevista para a revisão
 * - ok: em dia
 */
export function getMaintenanceStatus(vehicle) {
  if (vehicle.draft) return "draft";
  if (vehicle.openOrder) return "maintenance";
  if (vehicle.nextReviewKm && vehicle.mileage >= vehicle.nextReviewKm) return "overdue";
  if (vehicle.nextReviewDate && daysSince(vehicle.nextReviewDate) > 0) return "overdue";
  return "ok";
}

/** "Volkswagen Nivus Highline" */
export function vehicleName(vehicle) {
  return [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Modelo não informado";
}

/** "2023 / 2024" */
export function vehicleYears(vehicle) {
  return vehicle.yearManufacture && vehicle.yearModel
    ? `${vehicle.yearManufacture} / ${vehicle.yearModel}`
    : "—";
}

/** Motor sem a potência: "1.0 TSI Turbo (128 cv)" -> "1.0 TSI Turbo". */
export function engineName(vehicle) {
  return vehicle.engine ? vehicle.engine.replace(/\s*\(.*\)\s*$/, "") : "";
}

/** Híbridos e elétricos ganham selo verde; os demais, azul. */
export function engineTone(vehicle) {
  return /híbrid|elétric/i.test(`${vehicle.fuel} ${vehicle.engine}`) ? "green" : "blue";
}

function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const colorKeywords = [
  ["preto", "#1e293b"],
  ["branco", "#ffffff"],
  ["prata", "#cbd5e1"],
  ["cinza", "#94a3b8"],
  ["azul", "#1d4ed8"],
  ["vermelho", "#dc2626"],
  ["vinho", "#7f1d1d"],
  ["verde", "#15803d"],
  ["amarelo", "#eab308"],
  ["laranja", "#f97316"],
  ["bege", "#d6c3a1"],
  ["marrom", "#78350f"],
  ["dourado", "#ca8a04"],
];

/** Cor aproximada para o círculo ao lado do nome da cor ("Preto Ninja" -> preto). */
export function colorToHex(name = "") {
  const text = normalize(name);
  const match = colorKeywords.find(([keyword]) => text.includes(keyword));
  return match ? match[1] : "#94a3b8";
}

/** Busca por placa, marca/modelo, chassi ou nome do proprietário. */
function matchesSearch(vehicle, owner, query) {
  const text = normalize(query.trim());
  if (!text) return true;

  const haystack = normalize(
    [vehicleName(vehicle), vehicle.color, owner?.name ?? "", vehicle.chassis].join(" "),
  );
  if (haystack.includes(text)) return true;

  const compact = text.replace(/[^a-z0-9]/g, "");
  return compact.length >= 3 && normalize(vehicle.plate).replace(/[^a-z0-9]/g, "").includes(compact);
}

/** Aplica busca, filtro de OS em aberto, marca e ordenação. */
export function filterVehicles(vehicles, ownersById, { search, filter, brand, sort }) {
  const result = vehicles.filter((vehicle) => {
    if (filter === "open" && !vehicle.openOrder) return false;
    if (brand && vehicle.brand !== brand) return false;
    return matchesSearch(vehicle, ownersById.get(vehicle.ownerId), search);
  });

  if (sort === "recent") {
    result.sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
  }
  return result;
}

/** Contadores e indicadores do topo da tela. */
export function computeStats(vehicles) {
  const registered = vehicles.filter((vehicle) => !vehicle.draft);
  const inService = registered.filter((vehicle) => vehicle.openOrder).length;
  const overdue = registered.filter(
    (vehicle) => getMaintenanceStatus(vehicle) === "overdue",
  ).length;

  return {
    all: vehicles.length,
    registered: registered.length,
    open: inService,
    newThisMonth: registered.filter((vehicle) => daysSince(vehicle.createdAt) <= 30).length,
    occupancy: Math.min(100, Math.round((inService / BOXES_TOTAL) * 100)),
    compliance:
      registered.length === 0
        ? 100
        : ((registered.length - overdue) / registered.length) * 100,
  };
}

/** Marcas existentes na lista (para o filtro "Por Marca"). */
export function listBrands(vehicles) {
  return [...new Set(vehicles.map((vehicle) => vehicle.brand))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export const CSV_HEADERS = [
  "Código",
  "Placa",
  "Marca",
  "Modelo",
  "Ano Fab./Modelo",
  "Cor",
  "Km",
  "Combustível",
  "Proprietário",
  "Situação",
  "Próxima revisão",
];

export function toCsvRows(vehicles, ownersById) {
  return vehicles.map((vehicle) => [
    vehicle.id,
    maskPlate(vehicle.plate),
    vehicle.brand,
    vehicle.model,
    vehicleYears(vehicle),
    vehicle.color,
    vehicle.mileage,
    vehicle.fuel,
    ownersById.get(vehicle.ownerId)?.name ?? "Sem proprietário",
    MAINTENANCE[getMaintenanceStatus(vehicle)].label,
    [
      vehicle.nextReviewDate ? formatDate(vehicle.nextReviewDate) : "",
      vehicle.nextReviewKm ? `${vehicle.nextReviewKm} km` : "",
    ]
      .filter(Boolean)
      .join(" ou "),
  ]);
}
