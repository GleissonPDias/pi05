import { BanknoteIcon, RefreshCcwIcon, TimerIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import Card from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { LEAD_TIME_GOAL } from "../constants";

const decimal = (value) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Kpi({ icon: Icon, iconClassName, label, value, aside }) {
  return (
    <Card as="div" className="flex items-center gap-4 p-4!">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", iconClassName)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
      </div>
      {aside}
    </Card>
  );
}

const pill = "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold";

/** Indicadores da operação: lead time, faturamento em execução e retrabalho. */
function OrdensStats({ stats }) {
  const belowGoal = stats.leadTimeDelta <= 0;

  return (
    <section aria-label="Indicadores da oficina" className="grid gap-4 md:grid-cols-3">
      <Kpi
        icon={TimerIcon}
        iconClassName="bg-blue-100 text-blue-700"
        label="Lead time oficina"
        value={`${decimal(stats.leadTime)} dias`}
        aside={
          <span
            title={`Média de dias entre abertura e entrega (últimos 30 dias). Meta: ${LEAD_TIME_GOAL} dias.`}
            className={cn(
              pill,
              "inline-flex items-center gap-1",
              belowGoal ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700",
            )}
          >
            {belowGoal ? <TrendingDownIcon className="size-3.5" /> : <TrendingUpIcon className="size-3.5" />}
            {stats.leadTimeDelta > 0 ? "+" : ""}
            {decimal(stats.leadTimeDelta)}d meta
          </span>
        }
      />
      <Kpi
        icon={BanknoteIcon}
        iconClassName="bg-emerald-100 text-emerald-700"
        label="Faturamento em execução"
        value={formatBRL(stats.wipValue)}
        aside={
          <span className="max-w-24 shrink-0 text-right text-xs leading-tight text-slate-600">
            {stats.active} ordens no pátio
          </span>
        }
      />
      <Kpi
        icon={RefreshCcwIcon}
        iconClassName="bg-indigo-100 text-indigo-700"
        label="Índice de retrabalho"
        value={`${decimal(stats.rework)}%`}
        aside={
          <span
            title="OS de garantia/retorno sobre as OS abertas nos últimos 90 dias"
            className={cn(
              pill,
              stats.rework <= 5 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700",
            )}
          >
            {stats.reworkLabel}
          </span>
        }
      />
    </section>
  );
}

export default OrdensStats;
