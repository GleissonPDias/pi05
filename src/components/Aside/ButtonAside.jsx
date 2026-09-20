import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

/** Item do menu lateral. O estado "ativo" vem automaticamente da rota atual. */
function AsideButtons({ label, icon: Icon, to, end = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "active:scale-98",
          isActive
            ? "bg-blue-600 font-bold text-white"
            : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
        )
      }
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default AsideButtons;
