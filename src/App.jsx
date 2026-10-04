import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Clientes from "./pages/Clientes/Clientes";
import Dashboard from "./pages/Dashboard/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import Veiculos from "./pages/Veiculos/Veiculos";
import { footerNav, mainNav } from "./config/navigation";

// Caminhos das telas que já foram desenvolvidas (e têm <Route> própria abaixo).
// Ao criar uma nova tela, adicione o caminho aqui.
// Todas as demais rotas do menu exibem a página provisória.
const implementedPaths = ["/", "/clientes", "/veiculos"];

const pendingRoutes = [...mainNav, ...footerNav].filter(
  (item) => !implementedPaths.includes(item.to),
);

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Telas prontas */}
        <Route index element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/veiculos" element={<Veiculos />} />

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
