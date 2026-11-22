import { useContext } from "react";
import { OficinaContext } from "../context/OficinaContext";

/** Equipe técnica + boxes da oficina. */
export function useOficina() {
  const value = useContext(OficinaContext);
  if (!value) {
    throw new Error("useOficina precisa estar dentro do AppProviders.");
  }
  return value;
}

export default useOficina;
