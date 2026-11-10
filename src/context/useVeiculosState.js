import { useCallback, useEffect, useRef, useState } from "react";
import { api, isDemo } from "../services/api";
import {
  mapVeiculo,
  veiculoCreatePayload,
  veiculoUpdatePayload,
  vehicleOverlayFrom,
} from "../services/mappers";
import { KEYS, readList, readMap, writeList, writeMap } from "../services/storage";
import { veiculosMock } from "../mocks/veiculos";
import { currentOperator } from "../mocks/user";
import { toISODate } from "../utils/dates";

/** Gera o próximo código local: VEI-8921 -> VEI-8922 */
function nextId(vehicles) {
  const highest = vehicles.reduce((max, vehicle) => {
    const numeric = Number(String(vehicle.id).replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 8000);
  return `VEI-${highest + 1}`;
}

const isLocalId = (id) => !/^\d+$/.test(String(id));

const stamp = () => ({
  updatedAt: new Date().toISOString(),
  updatedBy: currentOperator,
});

const byPlate = (a, b) =>
  String(a.plate ?? "").localeCompare(String(b.plate ?? ""), "pt-BR");

/**
 * Lista de veículos e as operações do CRUD (usada pelo VeiculosProvider).
 *
 * - No modo API carrega `GET /veiculos` e guarda em overlays locais o que o
 *   backend ainda não permite alterar (proprietário, placa, foto, categoria...).
 * - Rascunhos e veículos sem proprietário ficam apenas no navegador.
 * - No modo demonstração mantém o comportamento antigo, só em memória.
 */
export function useVeiculosState() {
  const [vehicles, setVehicles] = useState(() => (isDemo() ? veiculosMock : []));
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));
  const vehiclesRef = useRef(vehicles);
  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  const load = useCallback(async () => {
    if (isDemo()) {
      setVehicles(veiculosMock);
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [dtos, overlays, locals] = await Promise.all([
        api.veiculos.list(),
        Promise.resolve(readMap(KEYS.vehicles)),
        Promise.resolve(readList(KEYS.localVehicles)),
      ]);

      const merged = new Map();
      dtos
        .filter((dto) => dto.ativo !== false)
        .forEach((dto) => {
          const id = String(dto.id);
          merged.set(id, mapVeiculo(dto, overlays[id] ?? {}));
        });

      locals.forEach((vehicle) => {
        if (vehicle?.id) merged.set(String(vehicle.id), vehicle);
      });

      setVehicles([...merged.values()].sort(byPlate));
      setSource("api");
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Adia o primeiro carregamento para não atualizar estado no corpo do efeito.
    queueMicrotask(load);
  }, [load]);

  const persistOverlay = (id, overlay) => {
    writeMap(KEYS.vehicles, { ...readMap(KEYS.vehicles), [String(id)]: overlay });
  };

  /** Cadastra um veículo e devolve o registro criado (ou null). */
  const createVehicle = useCallback(
    async (data) => {
      const isDraft = Boolean(data.draft) || !data.ownerId;

      if (isDemo()) {
        const vehicle = {
          ...data,
          id: nextId(vehiclesRef.current),
          nextReviewKm: null,
          nextReviewDate: null,
          mileageUpdatedAt: toISODate(new Date()),
          createdAt: toISODate(new Date()),
          ...stamp(),
        };
        vehiclesRef.current = [vehicle, ...vehiclesRef.current];
        setVehicles(vehiclesRef.current);
        return vehicle;
      }

      if (isDraft) {
        const vehicle = {
          ...data,
          id: nextId([...vehiclesRef.current, ...readList(KEYS.localVehicles)]),
          nextReviewKm: data.nextReviewKm ?? null,
          nextReviewDate: data.nextReviewDate ?? null,
          mileageUpdatedAt: toISODate(new Date()),
          createdAt: toISODate(new Date()),
          draft: true,
          ...stamp(),
        };
        writeList(KEYS.localVehicles, [...readList(KEYS.localVehicles), vehicle]);
        vehiclesRef.current = [vehicle, ...vehiclesRef.current].sort(byPlate);
        setVehicles(vehiclesRef.current);
        return vehicle;
      }

      try {
        const dto = await api.veiculos.create(data.ownerId, veiculoCreatePayload(data));
        const overlay = vehicleOverlayFrom(data);
        persistOverlay(dto.id, overlay);
        const vehicle = mapVeiculo(dto, overlay);
        setVehicles((current) => [vehicle, ...current].sort(byPlate));
        return vehicle;
      } catch (createError) {
        setError(createError);
        return null;
      }
    },
    [],
  );

  const updateVehicle = useCallback(
    async (id, data) => {
      if (isDemo()) {
        setVehicles((current) =>
          current.map((vehicle) =>
            vehicle.id === id ? { ...vehicle, ...data, ...stamp() } : vehicle,
          ),
        );
        return true;
      }

      if (isLocalId(id)) {
        // Rascunho: ao finalizar com proprietário, tenta promover para a API.
        if (!data.draft && data.ownerId) {
          try {
            const dto = await api.veiculos.create(
              data.ownerId,
              veiculoCreatePayload(data),
            );
            const overlay = vehicleOverlayFrom(data);
            persistOverlay(dto.id, overlay);
            const vehicle = mapVeiculo(dto, overlay);
            writeList(
              KEYS.localVehicles,
              readList(KEYS.localVehicles).filter((item) => String(item.id) !== String(id)),
            );
            setVehicles((current) =>
              current.map((item) => (item.id === id ? vehicle : item)).sort(byPlate),
            );
            return true;
          } catch (createError) {
            setError(createError);
            return false;
          }
        }

        const next = { ...data, ...stamp() };
        const locals = readList(KEYS.localVehicles).map((item) =>
          String(item.id) === String(id) ? { ...item, ...next } : item,
        );
        writeList(KEYS.localVehicles, locals);
        setVehicles((current) =>
          current.map((item) => (item.id === id ? { ...item, ...next } : item)),
        );
        return true;
      }

      try {
        const dto = await api.veiculos.update(id, veiculoUpdatePayload(data));
        const overlay = { ...readMap(KEYS.vehicles)[String(id)], ...vehicleOverlayFrom(data) };
        persistOverlay(id, overlay);
        setVehicles((current) =>
          current
            .map((vehicle) =>
              vehicle.id === String(id) ? { ...mapVeiculo(dto, overlay), ...stamp() } : vehicle,
            )
            .sort(byPlate),
        );
        return true;
      } catch (updateError) {
        setError(updateError);
        return false;
      }
    },
    [],
  );

  /** Atualiza só a quilometragem (e a data da atualização). */
  const updateMileage = useCallback(
    async (id, mileage) => {
      const stampMileage = () => ({
        mileage,
        mileageUpdatedAt: toISODate(new Date()),
        ...stamp(),
      });

      setVehicles((current) =>
        current.map((vehicle) =>
          vehicle.id === id ? { ...vehicle, ...stampMileage() } : vehicle,
        ),
      );

      if (isDemo()) return true;

      if (isLocalId(id)) {
        const locals = readList(KEYS.localVehicles).map((item) =>
          String(item.id) === String(id)
            ? { ...item, ...stampMileage() }
            : item,
        );
        writeList(KEYS.localVehicles, locals);
        return true;
      }

      try {
        const dto = await api.veiculos.update(id, { kmAtual: Number(mileage) });
        const overlay = {
          ...readMap(KEYS.vehicles)[String(id)],
          mileage,
          mileageUpdatedAt: toISODate(new Date()),
          ...stamp(),
        };
        persistOverlay(id, overlay);
        setVehicles((current) =>
          current.map((vehicle) =>
            vehicle.id === String(id) ? { ...mapVeiculo(dto, overlay) } : vehicle,
          ),
        );
        return true;
      } catch (updateError) {
        setError(updateError);
        return false;
      }
    },
    [],
  );

  /** Remove o veículo da frota ativa. */
  const deleteVehicle = useCallback(
    async (id) => {
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));

      if (isDemo()) return true;

      if (isLocalId(id)) {
        writeList(
          KEYS.localVehicles,
          readList(KEYS.localVehicles).filter((item) => String(item.id) !== String(id)),
        );
        return true;
      }

      try {
        await api.veiculos.deactivate(id);
        return true;
      } catch (deleteError) {
        setError(deleteError);
        return false;
      }
    },
    [],
  );

  /** Desvincula todos os veículos de um proprietário (ex.: cliente desativado). */
  const unlinkOwner = useCallback(async (ownerId) => {
    const owned = vehiclesRef.current.filter((vehicle) => vehicle.ownerId === ownerId);
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.ownerId === ownerId ? { ...vehicle, ownerId: null, ...stamp() } : vehicle,
      ),
    );

    if (isDemo()) return true;

    owned.forEach((vehicle) => {
      if (isLocalId(vehicle.id)) {
        const locals = readList(KEYS.localVehicles).map((item) =>
          String(item.id) === String(vehicle.id)
            ? { ...item, ownerId: null, ...stamp() }
            : item,
        );
        writeList(KEYS.localVehicles, locals);
      } else {
        persistOverlay(vehicle.id, {
          ...readMap(KEYS.vehicles)[String(vehicle.id)],
          ownerId: null,
          ...stamp(),
        });
      }
    });
    return true;
  }, []);

  return {
    vehicles,
    createVehicle,
    updateVehicle,
    updateMileage,
    deleteVehicle,
    unlinkOwner,
    loading,
    error,
    source,
    reload: load,
  };
}
