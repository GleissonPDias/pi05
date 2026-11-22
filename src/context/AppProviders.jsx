import { useMemo } from "react";
import { ClientesContext } from "./ClientesContext";
import { EstoqueContext } from "./EstoqueContext";
import { OficinaContext } from "./OficinaContext";
import { OrcamentosContext } from "./OrcamentosContext";
import { OrdensContext } from "./OrdensContext";
import { ServicosContext } from "./ServicosContext";
import { VeiculosContext } from "./VeiculosContext";
import { attachOrderInfo } from "./vehicleOrders";
import { useClientesState } from "./useClientesState";
import { useEstoqueState } from "./useEstoqueState";
import { useOficinaState } from "./useOficinaState";
import { useOrcamentosState } from "./useOrcamentosState";
import { useOrdensState } from "./useOrdensState";
import { useServicosState } from "./useServicosState";
import { useVeiculosState } from "./useVeiculosState";

/**
 * Guarda os dados compartilhados entre as telas (clientes, veículos, ordens
 * de serviço, catálogo de serviços, orçamentos, estoque e equipe técnica),
 * para que uma alteração feita em uma tela apareça nas outras.
 *
 * Os veículos recebem as informações calculadas a partir das OS (OS em
 * andamento, box em uso, histórico e última passagem).
 *
 * Este componente só é montado depois do login: assim os hooks já nascem no
 * modo correto (API ou demonstração) e nenhuma chamada é feita sem sessão.
 */
function AppProviders({ children }) {
  const officeState = useOficinaState();
  const clients = useClientesState();
  const vehicleState = useVeiculosState();
  const ordersState = useOrdensState();
  const servicesState = useServicosState();
  const quotesState = useOrcamentosState();
  const stockState = useEstoqueState();

  const vehicles = useMemo(
    () => ({
      ...vehicleState,
      vehicles: attachOrderInfo(vehicleState.vehicles, ordersState.orders),
    }),
    [vehicleState, ordersState.orders],
  );

  return (
    <OficinaContext value={officeState}>
      <ClientesContext value={clients}>
        <VeiculosContext value={vehicles}>
          <OrdensContext value={ordersState}>
            <ServicosContext value={servicesState}>
              <OrcamentosContext value={quotesState}>
                <EstoqueContext value={stockState}>{children}</EstoqueContext>
              </OrcamentosContext>
            </ServicosContext>
          </OrdensContext>
        </VeiculosContext>
      </ClientesContext>
    </OficinaContext>
  );
}

export default AppProviders;
