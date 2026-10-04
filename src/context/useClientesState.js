import { useCallback, useState } from "react";
import { clientesMock } from "../mocks/clientes";
import { currentOperator } from "../mocks/user";

/** Gera o próximo código sequencial: CL-1090 -> CL-1091 */
function nextId(clients) {
  const highest = clients.reduce(
    (max, client) => Math.max(max, Number(client.id.replace("CL-", ""))),
    1000,
  );
  return `CL-${highest + 1}`;
}

/**
 * Lista de clientes e as operações do CRUD (usada pelo ClientesProvider).
 *
 * Hoje os dados ficam apenas em memória (somem ao recarregar a página).
 * TODO: ao integrar com a API (Spring Boot), troque o corpo de cada função
 * por uma chamada HTTP (POST / PUT / PATCH) e mantenha a mesma assinatura —
 * as telas e os modais não precisam mudar.
 *
 * Os veículos vinculados e as OS em aberto de cada cliente não ficam aqui:
 * são calculados a partir da lista de veículos (veja a tela de Clientes).
 */
export function useClientesState() {
  const [clients, setClients] = useState(clientesMock);

  /** Cadastra um novo cliente e devolve o registro criado. */
  const createClient = useCallback(
    (data) => {
      const client = {
        ...data,
        id: nextId(clients),
        status: "ativo",
        servicesCompleted: 0,
        lastVisit: null,
        updatedAt: new Date().toISOString(),
        updatedBy: currentOperator,
      };
      setClients((current) => [client, ...current]);
      return client;
    },
    [clients],
  );

  /** Atualiza os dados de um cliente existente. */
  const updateClient = useCallback((id, data) => {
    setClients((current) =>
      current.map((client) =>
        client.id === id
          ? {
              ...client,
              ...data,
              updatedAt: new Date().toISOString(),
              updatedBy: currentOperator,
            }
          : client,
      ),
    );
  }, []);

  /**
   * "Exclui" um cliente. O cadastro é desativado (e não apagado) para
   * preservar o histórico de serviços e os registros fiscais.
   */
  const deactivateClient = useCallback((id, reason) => {
    setClients((current) =>
      current.map((client) =>
        client.id === id
          ? {
              ...client,
              status: "inativo",
              inactiveReason: reason,
              updatedAt: new Date().toISOString(),
              updatedBy: currentOperator,
            }
          : client,
      ),
    );
  }, []);

  return { clients, createClient, updateClient, deactivateClient };
}
