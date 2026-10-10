import { BellRingIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";

const steps = [
  { key: "sent", label: "Enviados", bar: "bg-slate-400" },
  { key: "viewed", label: "Visualizados", bar: "bg-indigo-500" },
  { key: "approved", label: "Aprovados", bar: "bg-emerald-500" },
  { key: "converted", label: "Viraram OS", bar: "bg-blue-600" },
];

/** Funil comercial + valor em negociação + atalho de follow-up. */
function QuoteFunnel({ stats, followUpActive, onToggleFollowUp }) {
  const base = stats.funnel.sent || 1;

  return (
    <section
      aria-label="Funil comercial"
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
    >
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {steps.map((step) => {
          const value = stats.funnel[step.key];
          const pct = Math.round((value / base) * 100);
          return (
            <li key={step.key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">{step.label}</span>
                <span className="text-sm font-extrabold text-slate-900">{value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
                <div className={cn("h-full rounded-full", step.bar)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] text-slate-500">{pct}% dos enviados</span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Em negociação</p>
          <p className="text-lg font-extrabold text-indigo-700">{formatBRL(stats.pipeline)}</p>
          <p className="text-[11px] text-slate-500">{stats.pendingCount} proposta(s) aguardando</p>
        </div>
        <button
          type="button"
          aria-pressed={followUpActive}
          onClick={onToggleFollowUp}
          disabled={!stats.followUps && !followUpActive}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
            followUpActive ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-900 hover:bg-amber-200",
          )}
          title="Propostas enviadas há mais de 48h sem resposta"
        >
          <BellRingIcon className="size-4" />
          Follow-up pendente ({stats.followUps})
        </button>
      </div>
    </section>
  );
}

export default QuoteFunnel;
