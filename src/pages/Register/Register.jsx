import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  UserPlusIcon,
  WrenchIcon,
} from "lucide-react";
import Button from "../../components/ui/Button";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

function Register() {
  const { status, register } = useAuth();
  const navigate = useNavigate();

  const [nomeOficina, setNomeOficina] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!nomeOficina.trim()) {
      setError("Informe o nome da oficina.");
      return;
    }
    if (!nomeUsuario.trim()) {
      setError("Informe o seu nome.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Informe o e-mail e a senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setSubmitting(true);
    const result = await register({
      nomeOficina: nomeOficina.trim(),
      nomeUsuario: nomeUsuario.trim(),
      email: email.trim(),
      password,
      telefone: telefone.trim() || null,
      cnpj: cnpj.trim() || null,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.error?.message ||
          "Não foi possível concluir o cadastro. Verifique os dados e tente novamente.",
      );
      return;
    }

    if (result.autoLogin) {
      navigate("/", { replace: true });
    } else {
      setSuccessMessage(
        "Oficina cadastrada com sucesso! Verifique sua caixa de entrada para confirmar o e-mail antes de acessar.",
      );
    }
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
            Comece a gerenciar sua oficina mecânica agora.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Crie sua conta SaaS em segundos. Tenha controle completo de ordens de serviço,
            clientes, veículos, catálogo de peças e serviços.
          </p>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>✓ Acesso imediato à sua oficina exclusiva</li>
            <li>✓ Cadastro ágil de ordens de serviço e clientes</li>
            <li>✓ Controle de orçamentos e estoque</li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          API configurada em <code className="text-slate-300">{api.baseUrl}</code>
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
              <WrenchIcon className="size-5" />
            </span>
            <div>
              <p className="text-lg font-black text-slate-900">Salvô</p>
              <p className="text-xs text-slate-500">Gestão de oficina</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900">Cadastre sua oficina</h2>
          <p className="mt-1 text-sm text-slate-500">
            Preencha os dados abaixo para criar sua conta no sistema.
          </p>

          {successMessage ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2Icon className="mx-auto size-10 text-emerald-600" />
              <h3 className="mt-3 text-base font-bold text-emerald-950">
                Cadastro realizado!
              </h3>
              <p className="mt-2 text-sm text-emerald-800">{successMessage}</p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label="Nome da Oficina"
                type="text"
                placeholder="Ex.: Auto Mecânica Silva"
                value={nomeOficina}
                onChange={(event) => setNomeOficina(event.target.value)}
                required
              />

              <TextField
                label="Seu Nome Completo"
                type="text"
                autoComplete="name"
                placeholder="Ex.: Carlos Silva"
                value={nomeUsuario}
                onChange={(event) => setNomeUsuario(event.target.value)}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Telefone / WhatsApp"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(event) => setTelefone(event.target.value)}
                />
                <TextField
                  label="CNPJ (opcional)"
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(event) => setCnpj(event.target.value)}
                />
              </div>

              <TextField
                label="E-mail de acesso"
                type="email"
                autoComplete="username"
                placeholder="voce@suaoficina.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <TextField
                label="Senha de acesso"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo de 6 caracteres"
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
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                icon={UserPlusIcon}
                fullWidth
                disabled={submitting}
              >
                {submitting ? "Cadastrando oficina..." : "Cadastrar oficina"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Já tem uma oficina cadastrada?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
