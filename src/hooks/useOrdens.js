import { useContext } from "react";
import { OrdensContext } from "../context/OrdensContext";

/**
 * Ordens de serviço + operações:
 * { orders, drafts, createOrder, updateOrder, changeStatus, addEvent,
 *   setDraft, discardDraft, saveDraft }
 */
export function useOrdens() {
  const value = useContext(OrdensContext);
  if (!value) {
    throw new Error("useOrdens precisa estar dentro do AppProviders.");
  }
  return value;
}
