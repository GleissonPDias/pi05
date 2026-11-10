import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircleIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-page">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <LoaderCircleIcon className="size-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold">Carregando sessão...</p>
      </div>
    </div>
  );
}

/**
 * Protege as rotas internas: sem sessão, redireciona para o login guardando
 * o endereço de origem para voltar depois.
 */
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoader />;

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

export default RequireAuth;
