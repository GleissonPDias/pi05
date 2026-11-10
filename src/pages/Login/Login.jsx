import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  EyeIcon,
  EyeOffIcon,
  LogInIcon,
  MonitorPlayIcon,
  WrenchIcon,
} from "lucide-react";
import Button from "../../components/ui/Button";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

/**
 * Tela de login.
 *
 * - "Entrar" usa `POST /auth/login` + `GET /auth/me` da API Spring Boot.
 * - "Entrar no modo demonstração" usa os dados fictícios, sem depender do
 *   backend (útil enquanto o servidor estiver indisponível).
 */
function Login() {
  const { status, login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Informe o e-mail e a senha.");
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.error?.message ||
          "Não foi possível entrar. Confira as credenciais e tente novamente.",
      );
      return;
    }
    navigate(from, { replace: true });
  };

  const handleDemo = () => {
    loginDemo();
    navigate(from, { replace: true });
  };

  return (
    <div className="grid min-h-screen bg-page lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600">
            <WrenchIcon className="size-6" />
          </span>
          <div>
            <p className="text-lg font-black tracking-tight">Salvô</p>
            <p className="text-xs text-slate-300">Gestão de oficina</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-4">
          <h1 className="text-3xl font-black leading-tight">
            Toda a operação da sua oficina em um só lugar.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Ordens de serviço, clientes, veículos, orçamentos e estoque —
            conectados à API da sua oficina.
          </p>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>• Acompanhe o pátio em tempo real</li>
            <li>• Registre diagnósticos e aprovações</li>
            <li>• Controle peças e mão de obra</li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          API configurada em <code className="text-slate-300">{api.baseUrl}</code>
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
              <WrenchIcon className="size-5" />
            </span>
            <div>
              <p className="text-lg font-black text-slate-900">Salvô</p>
              <p className="text-xs text-slate-500">Gestão de oficina</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900">Entrar na oficina</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use o e-mail e a senha cadastrados na API.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <TextField
              label="E-mail"
              type="email"
              autoComplete="username"
              placeholder="voce@oficina.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <TextField
              label="Senha"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="pointer-events-auto text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              }
            />

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" icon={LogInIcon} fullWidth disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Cadastre sua oficina
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            ou
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            icon={MonitorPlayIcon}
            fullWidth
            onClick={handleDemo}
          >
            Entrar no modo demonstração
          </Button>
          <p className="mt-3 text-center text-xs text-slate-500">
            O modo demonstração usa dados fictícios e não altera a API.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
