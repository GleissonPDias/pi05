import { cn } from "../../../utils/cn";
import { PRIORITIES, STATUS } from "../constants";

/** Etiqueta da etapa da OS ("Em Execução"). */
export function StatusBadge({ status, className }) {
  const item = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        item.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", status === "execucao" ? "bg-white" : item.dot)} />
      {item.label}
    </span>
  );
}

/** Etiqueta de prioridade ("Urgente"). */
export function PriorityBadge({ priority, className }) {
  const item = PRIORITIES[priority];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold",
        item.badge,
        className,
      )}
    >
      {item.label}
    </span>
  );
}

/** Barra de progresso fina com rótulo opcional. */
export function ProgressBar({ value, tone = "blue", className, label }) {
  const tones = {
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    green: "bg-emerald-600",
  };
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div className={cn("h-full rounded-full transition-all", tones[tone])} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Iniciais do mecânico em um círculo ("RS"). */
export function MechanicAvatar({ name, className }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700",
        className,
      )}
    >
      {initials}
    </span>
  );
}
