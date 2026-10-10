import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";

/**
 * Subitens de um item do menu (ex.: OS → Quadro Kanban, Lista, Detalhes OS #1042).
 * Só aparece enquanto a tela do item pai está aberta.
 */
function AsideSubmenu({ item, onClick }) {
  const location = useLocation();
  if (!location.pathname.startsWith(item.to)) return null;

  const rest = location.pathname.slice(item.to.length).replace(/^\//, "");
  // Visão atual (?visao=); sem parâmetro, vale a visão do primeiro subitem
  const view = new URLSearchParams(location.search).get("visao") ?? item.children.find((child) => child.view)?.view;
  const entries = item.children.map((child) => ({
    ...child,
    active: child.view ? !rest && child.view === view : location.pathname === child.to,
  }));
  // Página de detalhes (ex.: /ordens-de-servico/1042) vira um subitem dinâmico
  if (/^\d+$/.test(rest) && item.detailLabel) {
    entries.push({ label: `${item.detailLabel} #${rest}`, to: location.pathname, active: true });
  }

  return (
    <ul className="-mt-1 mb-1 ml-6 space-y-0.5 border-l border-slate-600 pl-3">
      {entries.map((entry) => (
        <li key={entry.label}>
          <Link
            to={entry.to}
            onClick={onClick}
            aria-current={entry.active ? "page" : undefined}
            className={cn(
              "block truncate rounded-md px-2 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              entry.active ? "bg-slate-700/60 font-bold text-white" : "text-slate-300 hover:bg-slate-700/40 hover:text-white",
            )}
          >
            {entry.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default AsideSubmenu;
