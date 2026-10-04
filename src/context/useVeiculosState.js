import { useCallback, useState } from "react";
import { veiculosMock } from "../mocks/veiculos";
import { currentOperator } from "../mocks/user";
import { toISODate } from "../utils/dates";

/** Gera o próximo código sequencial: VEI-8921 -> VEI-8922 */
function nextId(vehicles) {
  const highest = vehicles.reduce(
    (max, vehicle) => Math.max(max, Number(vehicle.id.replace("VEI-", ""))),
    8000,
  );
  return `VEI-${highest + 1}`;
}

/**
 * Lista de veículos e as operações do CRUD (usada pelo VeiculosProvider).
 *
 * Hoje os dados ficam apenas em memória (somem ao recarregar a página).
 * TODO: ao integrar com a API (Spring Boot), troque o corpo de cada função
 * por uma chamada HTTP e mantenha a mesma assinatura. A foto (`photoUrl`)
 * hoje é um endereço temporário do navegador; na API ela deve ser enviada
 * como arquivo (multipart) e a resposta traz a URL definitiva.
 */
export function useVeiculosState() {
  const [vehicles, setVehicles] = useState(veiculosMock);

  const stamp = () => ({
    updatedAt: new Date().toISOString(),
    updatedBy: currentOperator,
  });

  /** Cadastra um veículo e devolve o registro criado. */
  const createVehicle = useCallback(
    (data) => {
      const vehicle = {
        ...data,
        id: nextId(vehicles),
        openOrder: null,
        box: null,
        servicesCount: 0,
        lastService: null,
        nextReviewKm: null,
        nextReviewDate: null,
        mileageUpdatedAt: toISODate(new Date()),
        createdAt: toISODate(new Date()),
        ...stamp(),
      };
      setVehicles((current) => [vehicle, ...current]);
      return vehicle;
    },
    [vehicles],
  );

  const updateVehicle = useCallback((id, data) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, ...data, ...stamp() } : vehicle,
      ),
    );
  }, []);

  /** Atualiza só a quilometragem (e a data da atualização). */
  const updateMileage = useCallback((id, mileage) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              mileage,
              mileageUpdatedAt: toISODate(new Date()),
              ...stamp(),
            }
          : vehicle,
      ),
    );
  }, []);

  /** Remove o veículo da frota ativa. */
  const deleteVehicle = useCallback((id) => {
    setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
  }, []);

  /** Desvincula todos os veículos de um proprietário (ex.: cliente desativado). */
  const unlinkOwner = useCallback((ownerId) => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.ownerId === ownerId ? { ...vehicle, ownerId: null, ...stamp() } : vehicle,
      ),
    );
  }, []);

  return {
    vehicles,
    createVehicle,
    updateVehicle,
    updateMileage,
    deleteVehicle,
    unlinkOwner,
  };
}
