import { ClientesContext } from "./ClientesContext";
import { VeiculosContext } from "./VeiculosContext";
import { useClientesState } from "./useClientesState";
import { useVeiculosState } from "./useVeiculosState";

/**
 * Guarda os dados compartilhados entre as telas (clientes e veículos), para que
 * um cadastro feito em uma tela apareça nas outras (ex.: novo veículo na lista
 * de veículos do cliente).
 *
 * Quando a API (Spring Boot) estiver conectada, estes dados podem passar a ser
 * carregados do servidor, sem mudar as telas que usam os hooks.
 */
function AppProviders({ children }) {
  const clients = useClientesState();
  const vehicles = useVeiculosState();

  return (
    <ClientesContext value={clients}>
      <VeiculosContext value={vehicles}>{children}</VeiculosContext>
    </ClientesContext>
  );
}

export default AppProviders;
