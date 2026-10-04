import { cn } from "../../utils/cn";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  soft: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  success: "bg-emerald-800 text-white hover:bg-emerald-900",
  neutral: "bg-slate-200 text-slate-700 hover:bg-slate-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:hover:bg-red-300",
};

const sizes = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2 text-sm",
  lg: "gap-2 px-4 py-3 text-sm",
};

/**
 * Classes do botão padrão. Use em <Link> ou <a> que precisem ter a aparência
 * de um botão: <Link className={buttonClassName({ variant: "outline" })}>.
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-semibold",
    "transition-colors duration-200 disabled:cursor-not-allowed",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}
