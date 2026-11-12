import { Route, Routes, useLocation } from "react-router-dom";
import ApiFeedback from "./components/ApiFeedback";
import RequireAdmin from "./components/RequireAdmin";
import RequireAuth from "./components/RequireAuth";
import RequirePermission from "./components/RequirePermission";
import AppProviders from "./context/AppProviders";
import MainLayout from "./layouts/MainLayout";
import Agenda from "./pages/Agenda/Agenda";
import Clientes from "./pages/Clientes/Clientes";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import Dashboard from "./pages/Dashboard/Dashboard";
import Equipe from "./pages/Equipe/Equipe";
import Estoque from "./pages/Estoque/Estoque";
import Financeiro from "./pages/Financeiro/Financeiro";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
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
const implementedPaths = [
  "/",
  "/clientes",
  "/veiculos",
  "/ordens-de-servico",
  "/orcamentos",
  "/estoque",
  "/agenda",
  "/equipe",
  "/financeiro",
  "/configuracoes",
];

const pendingRoutes = [...mainNav, ...footerNav].filter(
  (item) => !implementedPaths.includes(item.to),
);

function App() {
  // Quando a busca da URL muda (ex.: busca global do cabeçalho), a tela é
  // recriada para começar já filtrada pelo novo termo.
  const location = useLocation();
  const busca = new URLSearchParams(location.search).get("busca") ?? "";

  return (
    <>
      <ApiFeedback />
      <Routes>
        {/* Login e Cadastro ficam fora do AppProviders: nenhuma chamada autenticada antes da sessão. */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route
            element={
              <AppProviders>
                <MainLayout />
              </AppProviders>
            }
          >
            {/* Telas prontas */}
            <Route index element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes key={busca} />} />
            <Route path="/veiculos" element={<Veiculos key={busca} />} />
            <Route path="/ordens-de-servico" element={<OrdensServico key={busca} />} />
            <Route path="/estoque" element={<Estoque key={busca} />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/orcamentos" element={<Orcamentos key={busca} />} />
            <Route path="/ordens-de-servico/servicos" element={<ServicosCatalogo />} />
            <Route path="/ordens-de-servico/:numero" element={<OrdemDetalhe />} />

            {/* Telas exclusivas do administrador */}
            <Route element={<RequireAdmin />}>
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
            <Route element={<RequirePermission modulo="FINANCEIRO" />}>
              <Route path="/financeiro" element={<Financeiro />} />
            </Route>

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
        </Route>
      </Routes>
    </>
  );
}

export default App;
