import { useContext } from "react";
import { OrcamentosContext } from "../context/OrcamentosContext";

/**
 * Orçamentos + operações:
 * { quotes, createQuote, updateQuote, sendQuote, approveQuote, rejectQuote,
 *   convertQuote, duplicateQuote, deleteQuote, addQuoteEvent }
 */
export function useOrcamentos() {
  const value = useContext(OrcamentosContext);
  if (!value) {
    throw new Error("useOrcamentos precisa estar dentro do AppProviders.");
  }
  return value;
}
