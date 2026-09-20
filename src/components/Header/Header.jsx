import { BellIcon, MenuIcon, SearchIcon } from "lucide-react";

// TODO: substituir pelos dados reais quando a API (Spring Boot) estiver conectada.
const user = { name: "Carlos Eduardo", role: "Gerente de Oficina" };
const unreadNotifications = 3;

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Header({ isAsideOpen, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:gap-4 sm:px-6">
      {/* Botão do menu (somente mobile/tablet) */}
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

      {/* Busca global */}
      <div className="relative min-w-0 max-w-md flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Pesquisar por placa, CPF, nome ou número da OS..."
          aria-label="Pesquisar"
          className="w-full truncate rounded-lg bg-blue-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        {/* Status da unidade */}
        <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 md:inline-flex">
          <span className="size-2 rounded-full bg-emerald-500" />
          Oficina Matriz - Aberta
        </span>

        {/* Notificações */}
        <button
          type="button"
          aria-label={`Notificações (${unreadNotifications} não lidas)`}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <BellIcon className="size-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* Usuário */}
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-sidebar text-xs font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="hidden text-left leading-tight md:block">
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
