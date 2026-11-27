import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRoundIcon, LogOutIcon, MenuIcon, SaveIcon, SearchIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import Button from "../ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../ui/Modal";
import TextField from "../ui/TextField";
import { useAuth } from "../../hooks/useAuth";
import { api, getAdminSession } from "../../services/api";
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
    if (!menuAberto) return;
    if (!(user?.isAdmin || hasAdminSession)) return;
    let ativo = true;
    const adminToken = hasAdminSession ? getAdminSession()?.accessToken : null;
    const opts = adminToken ? { token: adminToken } : {};
    api.usuarios
      .list({ ativo: true, ...opts })
      .then((lista) => {
        if (ativo) setFuncionarios(Array.isArray(lista) ? lista : lista?.content ?? []);
      })
      .catch(() => {
        if (ativo) setFuncionarios([]);
      });
    return () => {
      ativo = false;
    };
  }, [menuAberto, user?.isAdmin, hasAdminSession]);

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

  const outrosFuncionarios = funcionarios.filter((item) => String(item.id) !== String(user?.id));

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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 xl:inline-flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            {workshop} - Aberta
          </span>
          {mode === "demo" && (
            <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 md:inline-flex">
              Demonstração
            </span>
          )}

          <NotificationsMenu />

          <div className="flex items-center gap-3 border-l border-slate-200 pl-2 sm:pl-3">
            <div aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar text-xs font-bold text-white">
              {getInitials(name)}
            </div>
            <div className="hidden text-left leading-tight md:block">
              <p className="text-sm font-bold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">
                {user?.isAdmin ? "Administrador" : role}
                {hasAdminSession ? " (sessão trocada)" : ""}
              </p>
            </div>
          </div>

          {(user?.isAdmin || hasAdminSession) && mode !== "demo" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAberto((value) => !value)}
                aria-expanded={menuAberto}
                aria-haspopup="true"
                aria-label="Trocar de usuário"
                title="Trocar de usuário"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <UsersIcon className="size-5" />
              </button>
              {menuAberto && (
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs font-semibold text-slate-500">Entrar como</p>
                  <ul className="max-h-64 overflow-auto">
                    {outrosFuncionarios.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setAlvo(item);
                            setSenha("");
                            setErro("");
                            setMenuAberto(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold">
                            {getInitials(item.nome)}
                          </span>
                          <span className="min-w-0 truncate">
                            {item.nome}
                            <span className="block text-xs text-slate-500">{item.cargo}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {outrosFuncionarios.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">Nenhum funcionário cadastrado.</p>}
                </div>
              )}
            </div>
          )}

          {hasAdminSession && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                setModalAdmin(true);
                setSenhaAdmin("");
                setErroAdmin("");
              }}
            >
              Voltar para admin
            </Button>
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
      </header>

      {alvo && (
        <PasswordModal
          icon={UsersIcon}
          title={`Entrar como ${alvo.nome}`}
          subtitle="Informe a senha do funcionário para abrir a sessão dele."
          label="Senha do funcionário"
          value={senha}
          onChange={setSenha}
          error={erro}
          pending={carregando}
          submitLabel={carregando ? "Entrando..." : "Entrar"}
          onSubmit={entrarComo}
          onClose={() => setAlvo(null)}
        />
      )}

      {modalAdmin && (
        <PasswordModal
          icon={ShieldCheckIcon}
          title={`Voltar para ${adminUser?.name ?? "o administrador"}`}
          subtitle="Informe a senha do administrador para retomar a sessão."
          label="Senha do administrador"
          value={senhaAdmin}
          onChange={setSenhaAdmin}
          error={erroAdmin}
          pending={carregando}
          submitLabel={carregando ? "Validando..." : "Voltar"}
          onSubmit={voltar}
          onClose={() => setModalAdmin(false)}
        />
      )}

      {trocaObrigatoria && (
        <Modal onClose={() => {}} labelledBy="troca-senha-titulo" size="md" closeOnOverlay={false}>
          <form noValidate onSubmit={salvarNovaSenha} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <KeyRoundIcon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="troca-senha-titulo" className="text-lg font-bold leading-tight text-slate-900">
                  Crie sua senha
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Este é o seu primeiro acesso. Troque a senha temporária por uma senha só sua.
                </p>
              </div>
            </div>
            <ModalBody className="space-y-4">
              <TextField
                label="Nova senha"
                type="password"
                required
                data-autofocus
                autoComplete="new-password"
                hint="Use pelo menos 8 caracteres."
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
              />
              <TextField
                label="Confirme a nova senha"
                type="password"
                required
                autoComplete="new-password"
                value={confirmacaoSenha}
                error={erroSenha}
                onChange={(event) => setConfirmacaoSenha(event.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="soft" size="lg" onClick={handleLogout} className="w-full sm:w-auto">
                Sair da conta
              </Button>
              <Button type="submit" size="lg" icon={SaveIcon} disabled={salvandoSenha} className="w-full sm:w-auto">
                {salvandoSenha ? "Salvando..." : "Salvar senha"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </>
  );
}

/** Pop-up padrão para pedir uma senha (troca de usuário e retorno ao admin). */
function PasswordModal({ icon, title, subtitle, label, value, onChange, error, pending, submitLabel, onSubmit, onClose }) {
  const titleId = useId();
  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader icon={icon} titleId={titleId} title={title} subtitle={subtitle} onClose={onClose} />
        <ModalBody>
          <TextField
            label={label}
            type="password"
            required
            data-autofocus
            autoComplete="current-password"
            value={value}
            error={error}
            onChange={(event) => onChange(event.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} disabled={pending} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" disabled={pending || !value} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
