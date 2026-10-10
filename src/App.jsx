import { Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Clientes from "./pages/Clientes/Clientes";
import Dashboard from "./pages/Dashboard/Dashboard";
import Estoque from "./pages/Estoque/Estoque";
import Orcamentos from "./pages/Orcamentos/Orcamentos";
import OrdemDetalhe from "./pages/OrdensServico/OrdemDetalhe";
import OrdensServico from "./pages/OrdensServico/OrdensServico";
import ServicosCatalogo from "./pages/OrdensServico/servicos/ServicosCatalogo";
import PlaceholderPage from "./pages/PlaceholderPage";
import Veiculos from "./pages/Veiculos/Veiculos";
import { footerNav, mainNav } from "./config/navigation";

// Caminhos das telas que já foram desenvolvidas (e têm <Route> própria abaixo).
// Ao criar uma nova tela, adicione o caminho aqui.
// Todas as demais rotas do menu exibem a página provisória.
const implementedPaths = ["/", "/clientes", "/veiculos", "/ordens-de-servico", "/orcamentos", "/estoque"];

const pendingRoutes = [...mainNav, ...footerNav].filter(
  (item) => !implementedPaths.includes(item.to),
);

function App() {
  // Quando a busca da URL muda (ex.: busca global do cabeçalho), a tela é
  // recriada para começar já filtrada pelo novo termo.
  const location = useLocation();
  const busca = new URLSearchParams(location.search).get("busca") ?? "";

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Telas prontas */}
        <Route index element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes key={busca} />} />
        <Route path="/veiculos" element={<Veiculos key={busca} />} />
        <Route path="/ordens-de-servico" element={<OrdensServico key={busca} />} />
        <Route path="/estoque" element={<Estoque key={busca} />} />
        <Route path="/orcamentos" element={<Orcamentos key={busca} />} />
        <Route path="/ordens-de-servico/servicos" element={<ServicosCatalogo />} />
        <Route path="/ordens-de-servico/:numero" element={<OrdemDetalhe />} />

        {/* Telas pendentes */}
        {pendingRoutes.map((item) => (
          <Route
            key={item.to}
            path={item.to}
            element={<PlaceholderPage title={item.label} />}
          />
        ))}

        <Route
          path="*"
          element={
            <PlaceholderPage
              title="Página não encontrada"
              description="O endereço acessado não existe."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
