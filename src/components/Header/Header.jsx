import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOutIcon, MenuIcon, SearchIcon, UserIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";
import NotificationsMenu from "./NotificationsMenu";

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function searchDestination(query) {
  const text = query.trim();
  if (/^#?\d{4,6}$/.test(text)) return `/ordens-de-servico/${text.replace("#", "")}`;
  const busca = encodeURIComponent(text);
  if (/^#?orc-?\d+$/i.test(text)) {
    const number = text.replace(/\D/g, "").padStart(4, "0");
    return `/orcamentos?busca=ORC-${number}`;
  }
  if (/^[a-z]{3}-?\d[a-z0-9]\d{2}$/i.test(text)) return `/veiculos?busca=${busca}`;
  return `/clientes?busca=${busca}`;
}

export default function Header({ isAsideOpen, onMenuClick }) {
  const navigate = useNavigate();
  const {
    user,
    mode,
    logout,
    switchUser,
    returnToAdmin,
    changePassword,
    hasAdminSession,
    adminUser,
  } = useAuth();

  const [query, setQuery] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [alvo, setAlvo] = useState(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [modalAdmin, setModalAdmin] = useState(false);
  const [erroAdmin, setErroAdmin] = useState("");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const name = user?.name ?? "Operador";
  const role = user?.role ?? "Oficina";
  const workshop = user?.workshopName ?? "Oficina";

  const trocaObrigatoria = Boolean(user?.mustChangePassword);

  useEffect(() => {
    if (!menuAberto || !user?.isAdmin) return;
    let ativo = true;
    api.usuarios
      .list({ ativo: true })
      .then((lista) => {
        if (ativo) setFuncionarios(Array.isArray(lista) ? lista : lista?.content ?? []);
      })
      .catch(() => {
        if (ativo) setFuncionarios([]);
      });
    return () => {
      ativo = false;
    };
  }, [menuAberto, user?.isAdmin]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(searchDestination(query));
    setQuery("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const entrarComo = async (event) => {
    event.preventDefault();
    if (!alvo) return;
    setCarregando(true);
    setErro("");
    const resultado = await switchUser(alvo, senha);
    setCarregando(false);
    if (resultado.ok) {
      setAlvo(null);
      setSenha("");
      setMenuAberto(false);
    } else {
      setErro(resultado.error?.message || "Não foi possível entrar como o usuário.");
    }
  };

  const voltar = async (event) => {
    event.preventDefault();
    setCarregando(true);
    setErroAdmin("");
    const resultado = await returnToAdmin(senhaAdmin);
    setCarregando(false);
    if (resultado.ok) {
      setModalAdmin(false);
      setSenhaAdmin("");
    } else {
      setErroAdmin(resultado.error?.message || "Senha inválida.");
    }
  };

  const salvarNovaSenha = async (event) => {
    event.preventDefault();
    if (novaSenha.length < 8) {
      setErroSenha("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setErroSenha("As senhas não conferem.");
      return;
    }
    setSalvandoSenha(true);
    setErroSenha("");
    const resultado = await changePassword(novaSenha);
    setSalvandoSenha(false);
    if (resultado.ok) {
      setNovaSenha("");
      setConfirmacaoSenha("");
    } else {
      setErroSenha(resultado.error?.message || "Não foi possível alterar a senha.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:gap-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          aria-controls="menu-lateral"
          aria-expanded={isAsideOpen}
          className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
        >
          <MenuIcon className="size-5" />
        </button>

        <form role="search" onSubmit={handleSubmit} className="relative min-w-0 max-w-md flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar por placa, CPF, nome ou número da OS..."
            aria-label="Pesquisar (Enter para buscar)"
            className="w-full truncate rounded-lg bg-blue-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 md:inline-flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            {workshop} - Aberta
          </span>
          {mode === "demo" && (
            <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 sm:inline-flex">
              Demonstração
            </span>
          )}

          <NotificationsMenu />

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-sidebar text-xs font-bold text-white">
              {getInitials(name)}
            </div>
            <div className="hidden text-left leading-tight md:block">
              <p className="text-sm font-bold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">
                {user?.isAdmin ? "Administrador" : role}
                {hasAdminSession ? " (sessão trocada)" : ""}
              </p>
            </div>

            {user?.isAdmin && !mode !== "demo" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAberto((value) => !value)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Trocar de usuário"
                  title="Trocar de usuário"
                >
                  <UserIcon className="size-5" />
                </button>
                {menuAberto && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs font-semibold text-slate-500">Entrar como</p>
                    <div className="max-h-64 overflow-auto">
                      {funcionarios
                        .filter((item) => String(item.id) !== String(user?.id))
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setAlvo(item);
                              setSenha("");
                              setErro("");
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100"
                          >
                            <span className="grid size-7 place-items-center rounded-full bg-slate-200 text-xs font-bold">
                              {getInitials(item.nome)}
                            </span>
                            <span className="truncate">
                              {item.nome}
                              <span className="block text-xs text-slate-500">{item.cargo}</span>
                            </span>
                          </button>
                        ))}
                      {funcionarios.filter((item) => String(item.id) !== String(user?.id)).length === 0 && (
                        <p className="px-2 py-3 text-xs text-slate-500">Nenhum funcionário cadastrado.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasAdminSession && (
              <button
                type="button"
                onClick={() => {
                  setModalAdmin(true);
                  setSenhaAdmin("");
                  setErroAdmin("");
                }}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Voltar para admin
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair da conta"
              title="Sair"
              className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <LogOutIcon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {alvo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={entrarComo} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Entrar como {alvo.nome}</h2>
            <p className="mt-1 text-sm text-slate-500">Informe a senha do usuário.</p>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Senha"
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setAlvo(null)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button type="submit" disabled={carregando} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modalAdmin && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={voltar} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Voltar para {adminUser?.name ?? "admin"}</h2>
            <p className="mt-1 text-sm text-slate-500">Informe a senha do administrador.</p>
            <input
              type="password"
              value={senhaAdmin}
              onChange={(event) => setSenhaAdmin(event.target.value)}
              placeholder="Senha do admin"
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            {erroAdmin && <p className="mt-2 text-sm text-red-600">{erroAdmin}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalAdmin(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button type="submit" disabled={carregando} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {carregando ? "Validando..." : "Voltar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {trocaObrigatoria && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={salvarNovaSenha} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Troque sua senha</h2>
            <p className="mt-1 text-sm text-slate-500">Este é o primeiro acesso. Defina uma nova senha.</p>
            <input
              type="password"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              placeholder="Nova senha"
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            <input
              type="password"
              value={confirmacaoSenha}
              onChange={(event) => setConfirmacaoSenha(event.target.value)}
              placeholder="Confirme a senha"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {erroSenha && <p className="mt-2 text-sm text-red-600">{erroSenha}</p>}
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={salvandoSenha} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {salvandoSenha ? "Salvando..." : "Salvar senha"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
