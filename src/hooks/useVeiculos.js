import { useContext } from "react";
import { VeiculosContext } from "../context/VeiculosContext";

/** Lista de veículos + { createVehicle, updateVehicle, updateMileage, deleteVehicle, unlinkOwner }. */
export function useVeiculos() {
  const value = useContext(VeiculosContext);
  if (!value) {
    throw new Error("useVeiculos precisa estar dentro do AppProviders.");
  }
  return value;
}
