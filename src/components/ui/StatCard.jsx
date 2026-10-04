import { cn } from "../../utils/cn";
import Card from "./Card";

/**
 * Cartão de indicador (KPI): ícone + rótulo + valor grande + observação.
 * - iconClassName: cores do quadrado do ícone (fundo + cor)
 * - note: texto/elemento abaixo do valor
 */
function StatCard({ icon: Icon, iconClassName, label, value, note, className }) {
  return (
    <Card as="div" className={cn("flex items-start gap-4", className)}>
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-xl",
          iconClassName,
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
          {label}
        </p>
        <p className="mt-0.5 text-3xl font-bold leading-tight text-slate-900">
          {value}
        </p>
        {note && <div className="mt-0.5 text-xs text-slate-600">{note}</div>}
      </div>
    </Card>
  );
}

export default StatCard;
