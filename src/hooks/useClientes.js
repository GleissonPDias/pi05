import { useContext } from "react";
import { ClientesContext } from "../context/ClientesContext";

/** Lista de clientes + { createClient, updateClient, deactivateClient }. */
export function useClientes() {
  const value = useContext(ClientesContext);
  if (!value) {
    throw new Error("useClientes precisa estar dentro do AppProviders.");
  }
  return value;
}
