import { useContext } from "react";
import { ServicosContext } from "../context/ServicosContext";

/** Catálogo de serviços + { createService, updateService, setServiceStatus, deleteService }. */
export function useServicos() {
  const value = useContext(ServicosContext);
  if (!value) {
    throw new Error("useServicos precisa estar dentro do AppProviders.");
  }
  return value;
}
