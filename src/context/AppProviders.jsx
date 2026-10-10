import { useMemo } from "react";
import { ClientesContext } from "./ClientesContext";
import { EstoqueContext } from "./EstoqueContext";
import { OrcamentosContext } from "./OrcamentosContext";
import { OrdensContext } from "./OrdensContext";
import { ServicosContext } from "./ServicosContext";
import { VeiculosContext } from "./VeiculosContext";
import { attachOrderInfo } from "./vehicleOrders";
import { useClientesState } from "./useClientesState";
import { useEstoqueState } from "./useEstoqueState";
import { useOrcamentosState } from "./useOrcamentosState";
import { useOrdensState } from "./useOrdensState";
import { useServicosState } from "./useServicosState";
import { useVeiculosState } from "./useVeiculosState";

/**
 * Guarda os dados compartilhados entre as telas (clientes, veículos, ordens
 * de serviço, catálogo de serviços, orçamentos e estoque), para que uma alteração feita em uma tela apareça nas outras.
 *
 * Os veículos recebem as informações calculadas a partir das OS (OS em
 * andamento, box em uso, histórico e última passagem).
 *
 * Quando a API (Spring Boot) estiver conectada, estes dados podem passar a ser
 * carregados do servidor, sem mudar as telas que usam os hooks.
 */
function AppProviders({ children }) {
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
  );
}

export default AppProviders;
