import { useContext } from "react";
import { EstoqueContext } from "../context/EstoqueContext";

/**
 * Estoque + operações:
 * { parts, partsByCode, movements, createPart, updatePart, deletePart,
 *   registerMovement, consumeForOrder, placeOrder }
 */
export function useEstoque() {
  const value = useContext(EstoqueContext);
  if (!value) {
    throw new Error("useEstoque precisa estar dentro do AppProviders.");
  }
  return value;
}
