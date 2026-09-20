import { cn } from "../../utils/cn";

const variants = {
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
  green: "bg-emerald-100 text-emerald-800",
  slate: "bg-slate-200 text-slate-700",
};

/** Etiqueta pequena (contadores, prioridades, status). */
function Badge({ variant = "blue", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
