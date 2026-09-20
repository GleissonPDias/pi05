import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import { footerNav, mainNav } from "./config/navigation";

// Telas que ainda não foram desenvolvidas usam a página provisória.
// À medida que forem criadas, troque o PlaceholderPage pelo componente real.
const pendingRoutes = [...mainNav.filter((item) => item.to !== "/"), ...footerNav];

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />

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
