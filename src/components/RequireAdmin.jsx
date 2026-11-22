import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Restringe rotas administrativas ao dono da oficina.
 *
 * A proteção real fica no back-end (`@PreAuthorize`); esta guarda evita que o
 * funcionário veja uma tela que só produziria 403.
 */
function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default RequireAdmin;
