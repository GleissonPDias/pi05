import { useCallback, useState } from "react";
import { SERVICES_CATALOG } from "../mocks/catalogo";
import { currentOperator } from "../mocks/user";

/** Próximo código: SV-018 -> SV-019 */
function nextCode(services) {
  const highest = services.reduce((max, item) => Math.max(max, Number(item.code.replace("SV-", ""))), 0);
  return `SV-${String(highest + 1).padStart(3, "0")}`;
}

const stamp = () => ({ updatedAt: new Date().toISOString(), updatedBy: currentOperator });

/**
 * Catálogo de serviços da oficina (usado pelo AppProviders).
 * Alimenta o "Adicionar Serviço" das OS e dos orçamentos.
 *
 * TODO: ao integrar com a API (Spring Boot), troque o corpo das funções por
 * chamadas HTTP (GET/POST/PUT/PATCH/DELETE /servicos) mantendo as assinaturas.
 */
export function useServicosState() {
  const [services, setServices] = useState(SERVICES_CATALOG);

  /** Cadastra e devolve o serviço criado. */
  const createService = useCallback(
    (data) => {
      const service = { ...data, code: nextCode(services), status: "ativo", ...stamp() };
      setServices((current) => [...current, service]);
      return service;
    },
    [services],
  );

  const updateService = useCallback((code, data) => {
    setServices((current) => current.map((item) => (item.code === code ? { ...item, ...data, ...stamp() } : item)));
  }, []);

  /** Ativa ("ativo") ou desativa ("inativo") um serviço. */
  const setServiceStatus = useCallback((code, status) => {
    setServices((current) => current.map((item) => (item.code === code ? { ...item, status, ...stamp() } : item)));
  }, []);

  /** Remove de vez (use só para serviços que nunca foram usados). */
  const deleteService = useCallback((code) => {
    setServices((current) => current.filter((item) => item.code !== code));
  }, []);

  return { services, createService, updateService, setServiceStatus, deleteService };
}
