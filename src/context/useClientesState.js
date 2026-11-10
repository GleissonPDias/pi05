import { useCallback, useEffect, useRef, useState } from "react";
import { api, isDemo } from "../services/api";
import {
  clienteCreatePayload,
  clienteOverlay,
  clienteUpdatePayload,
  mapCliente,
} from "../services/mappers";
import { KEYS, readMap, writeMap } from "../services/storage";
import { clientesMock } from "../mocks/clientes";
import { currentOperator } from "../mocks/user";

/** Gera o próximo código sequencial no modo demonstração: CL-1090 -> CL-1091 */
function nextId(clients) {
  const highest = clients.reduce((max, client) => {
    const numeric = Number(String(client.id).replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 1000);
  return `CL-${highest + 1}`;
}

const byName = (a, b) => a.name.localeCompare(b.name, "pt-BR");

/**
 * Lista de clientes e as operações do CRUD (usada pelo ClientesProvider).
 *
 * - No modo API carrega `GET /clientes` e mescla os campos que o backend ainda
 *   não possui (endereço, preferências) a partir de overlays locais.
 * - No modo demonstração mantém o comportamento antigo, só em memória.
 *
 * Os veículos vinculados e as OS em aberto de cada cliente não ficam aqui:
 * são calculados a partir da lista de veículos (veja a tela de Clientes).
 */
export function useClientesState() {
  const [clients, setClients] = useState(() => (isDemo() ? clientesMock : []));
  const [loading, setLoading] = useState(() => !isDemo());
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (isDemo() ? "demo" : "api"));
  const clientsRef = useRef(clients);
  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  const load = useCallback(async () => {
    if (isDemo()) {
      setClients(clientesMock);
      setSource("demo");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [dtos, overlays, deactivated] = await Promise.all([
        api.clientes.list(),
        Promise.resolve(readMap(KEYS.clients)),
        Promise.resolve(readMap(KEYS.deactivatedClients)),
      ]);

      const merged = new Map();
      dtos.forEach((dto) => {
        const id = String(dto.id);
        merged.set(id, mapCliente(dto, overlays[id] ?? {}));
      });

      // Clientes desativados localmente não aparecem na API: mantém o snapshot.
      Object.entries(deactivated).forEach(([id, snapshot]) => {
        const current = merged.get(id);
        merged.set(id, {
          ...(current ?? snapshot),
          status: "inativo",
          inactiveReason: snapshot.inactiveReason,
        });
      });

      setClients([...merged.values()].sort(byName));
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

  /** Cadastra um novo cliente e devolve o registro criado (ou null). */
  const createClient = useCallback(async (data) => {
    if (isDemo()) {
      const client = {
        ...data,
        id: nextId(clientsRef.current),
        status: "ativo",
        servicesCompleted: 0,
        lastVisit: null,
        updatedAt: new Date().toISOString(),
        updatedBy: currentOperator,
      };
      clientsRef.current = [client, ...clientsRef.current];
      setClients(clientsRef.current);
      return client;
    }

    try {
      const dto = await api.clientes.create(clienteCreatePayload(data));
      const overlay = clienteOverlay(data);
      const id = String(dto.id);
      const overlays = readMap(KEYS.clients);
      writeMap(KEYS.clients, { ...overlays, [id]: overlay });
      const client = mapCliente(dto, overlay);
      setClients((current) => [client, ...current].sort(byName));
      return client;
    } catch (createError) {
      setError(createError);
      return null;
    }
  }, []);

  /** Atualiza os dados de um cliente existente. */
  const updateClient = useCallback(async (id, data) => {
    if (isDemo()) {
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
      return true;
    }

    try {
      const dto = await api.clientes.update(id, clienteUpdatePayload(data));
      const previous = readMap(KEYS.clients)[String(id)] ?? {};
      const overlay = { ...previous, ...clienteOverlay(data) };
      writeMap(KEYS.clients, { ...readMap(KEYS.clients), [String(id)]: overlay });

      setClients((current) =>
        current
          .map((client) =>
            client.id === String(id)
              ? {
                  ...client,
                  ...mapCliente(dto, overlay),
                  status: data.status ?? client.status,
                  inactiveReason: data.inactiveReason,
                }
              : client,
          )
          .sort(byName),
      );
      return true;
    } catch (updateError) {
      setError(updateError);
      return false;
    }
  }, []);

  /**
   * "Exclui" um cliente. O cadastro é desativado (e não apagado) para
   * preservar o histórico de serviços e os registros fiscais.
   */
  const deactivateClient = useCallback(async (id, reason) => {
    if (isDemo()) {
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
      return true;
    }

    try {
      await api.clientes.deactivate(id);
      const snapshot = clientsRef.current.find((client) => client.id === String(id));
      if (snapshot) {
        writeMap(KEYS.deactivatedClients, {
          ...readMap(KEYS.deactivatedClients),
          [String(id)]: {
            ...snapshot,
            status: "inativo",
            inactiveReason: reason,
            updatedAt: new Date().toISOString(),
            updatedBy: currentOperator,
          },
        });
      }
      setClients((current) =>
        current.map((client) =>
          client.id === String(id)
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
      return true;
    } catch (deactivateError) {
      setError(deactivateError);
      return false;
    }
  }, []);

  return {
    clients,
    createClient,
    updateClient,
    deactivateClient,
    loading,
    error,
    source,
    reload: load,
  };
}
