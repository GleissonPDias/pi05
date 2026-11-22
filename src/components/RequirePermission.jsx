import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequirePermission({ modulo }) {
  const { isAdmin, hasPermission } = useAuth();

  if (isAdmin) return <Outlet />;
  if (modulo && hasPermission?.(modulo)) return <Outlet />;
  return <Navigate to="/" replace />;
}
