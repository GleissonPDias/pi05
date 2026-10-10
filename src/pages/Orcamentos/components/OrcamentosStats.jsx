import { ArrowDownRightIcon, ArrowUpRightIcon, BanknoteIcon, GitMergeIcon, ReceiptTextIcon, ZapIcon } from "lucide-react";
import Card from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";

const decimal = (value) => value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Kpi({ icon: Icon, iconClassName, label, value, note }) {
  return (
    <Card as="div" className="flex flex-col gap-3 p-4!">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", iconClassName)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{value}</p>
      <div className="text-xs text-slate-600">{note}</div>
    </Card>
  );
}

/** Indicadores financeiros e comerciais dos orçamentos (topo da tela). */
function OrcamentosStats({ stats, periodLabel }) {
  const up = stats.change !== null && stats.change >= 0;

  return (
    <section aria-label="Indicadores de orçamentos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        icon={BanknoteIcon}
        iconClassName="bg-blue-100 text-blue-700"
        label={`Total orçado (${periodLabel.toLowerCase()})`}
        value={formatBRL(stats.total)}
        note={
          stats.change === null ? (
            "Sem base de comparação no período anterior"
          ) : (
            <span className={cn("inline-flex items-center gap-1 font-semibold", up ? "text-emerald-700" : "text-red-700")}>
              {up ? <ArrowUpRightIcon className="size-3.5" /> : <ArrowDownRightIcon className="size-3.5" />}
              {up ? "+" : ""}
              {decimal(stats.change)}% vs período anterior
            </span>
          )
        }
      />
      <Kpi
        icon={GitMergeIcon}
        iconClassName="bg-emerald-100 text-emerald-700"
        label="Taxa de conversão"
        value={`${decimal(stats.conversion)}%`}
        note={`${stats.approvedCount} aprovado(s) de ${stats.finished} proposta(s) finalizada(s)`}
      />
      <Kpi
        icon={ReceiptTextIcon}
        iconClassName="bg-indigo-100 text-indigo-700"
        label="Ticket médio"
        value={formatBRL(stats.ticket)}
        note="Baseado nas propostas aprovadas"
      />
      <Kpi
        icon={ZapIcon}
        iconClassName="bg-amber-100 text-amber-700"
        label="Tempo de resposta"
        value={stats.responseHours ? `${decimal(stats.responseHours)} horas` : "—"}
        note={<span className="font-semibold text-blue-700">Média entre o envio e a resposta do cliente</span>}
      />
    </section>
  );
}

export default OrcamentosStats;
