import { ACTIVE_STATUSES } from "../pages/OrdensServico/constants";
import { BOXES, MECHANICS } from "../mocks/oficina";
import { toISODate } from "../utils/dates";

const boxes = new Map(BOXES.map((box) => [box.id, box]));
const mechanics = new Map(MECHANICS.map((mechanic) => [mechanic.id, mechanic]));

/**
 * Completa cada veículo com as informações que vêm das Ordens de Serviço:
 * - openOrder: número da OS em andamento (ou null)
 * - box: { name, mechanic } do box em uso (ou null)
 * - servicesCount / lastService: histórico de OS entregues
 */
export function attachOrderInfo(vehicles, orders) {
  const activeByVehicle = new Map();
  const deliveredByVehicle = new Map();

  orders.forEach((order) => {
    if (ACTIVE_STATUSES.includes(order.status)) {
      activeByVehicle.set(order.vehicleId, order);
    } else if (order.status === "entregue") {
      const list = deliveredByVehicle.get(order.vehicleId) ?? [];
      list.push(order);
      deliveredByVehicle.set(order.vehicleId, list);
    }
  });

  return vehicles.map((vehicle) => {
    const active = activeByVehicle.get(vehicle.id);
    const delivered = (deliveredByVehicle.get(vehicle.id) ?? []).sort((a, b) =>
      b.deliveredAt.localeCompare(a.deliveredAt),
    );
    const last = delivered[0];
    const box = active?.boxId && active.status !== "pronta" ? boxes.get(active.boxId) : null;

    return {
      ...vehicle,
      openOrder: active?.number ?? null,
      box: box
        ? {
            name: `${box.name} — ${box.type}`,
            mechanic: mechanics.get(active.mechanicId)?.name ?? "A definir",
          }
        : null,
      servicesCount: delivered.length,
      lastService: last
        ? { date: toISODate(new Date(last.deliveredAt)), description: last.title || "Serviço" }
        : null,
    };
  });
}
