import { ArchiveIcon, CircleAlertIcon, CircleCheckIcon, ShoppingCartIcon, TriangleAlertIcon } from "lucide-react";
import Card from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { ProgressBar } from "../../OrdensServico/components/OrdemBadges";

function Kpi({ icon: Icon, iconClassName, label, children, className }) {
  return (
    <Card as="div" className={cn("flex flex-col gap-3 p-4!", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", iconClassName)}>
          <Icon className="size-4" />
        </span>
      </div>
      {children}
    </Card>
  );
}

/** Indicadores do estoque: valor, nível normal, estoque baixo e ruptura. */
function EstoqueStats({ stats, onShowLow, onShowCritical, onQuickQuote }) {
  const reais = formatBRL(stats.totalCost).split(",");
  return (
    <section aria-label="Indicadores do estoque" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi icon={ArchiveIcon} iconClassName="bg-blue-100 text-blue-700" label="Valor total em estoque">
        <p className="text-3xl font-extrabold leading-tight text-slate-900">
          {reais[0]}
          <span className="text-base font-bold text-slate-500">,{reais[1]}</span>
        </p>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs">
          <span className="text-slate-600">Venda projetada</span>
          <strong className="text-emerald-700">{formatBRL(stats.projectedSale)}</strong>
        </div>
      </Kpi>

      <Kpi icon={CircleCheckIcon} iconClassName="bg-emerald-100 text-emerald-700" label="Itens em nível normal">
        <p className="text-3xl font-extrabold leading-tight text-slate-900">
          {stats.normal} <span className="text-base font-semibold text-slate-500">produtos</span>
        </p>
        <div className="flex items-center gap-3">
          <ProgressBar value={Math.round(stats.normalPct)} tone="green" className="flex-1" label="Itens em nível normal" />
          <span className="text-xs font-bold text-emerald-700">
            {stats.normalPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </span>
        </div>
      </Kpi>

      <Kpi icon={TriangleAlertIcon} iconClassName="bg-amber-100 text-amber-700" label="Alerta de estoque baixo">
        <p className="text-3xl font-extrabold leading-tight text-slate-900">
          {stats.low} <span className="text-base font-semibold text-slate-500">itens</span>
        </p>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="size-2 rounded-full bg-amber-500" />
            Próximos do ponto de pedido
          </span>
          <button type="button" onClick={onShowLow} className="font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Ver itens
          </button>
        </div>
      </Kpi>

      <Kpi icon={CircleAlertIcon} iconClassName="bg-red-100 text-red-600" label="Ruptura / estoque crítico">
        <button type="button" onClick={onShowCritical} className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <span className="text-3xl font-extrabold leading-tight text-red-600">{stats.critical}</span>{" "}
          <span className="text-base font-semibold text-slate-500">sem disponibilidade</span>
        </button>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
            <span className="size-2 rounded-full bg-red-500" />
            Requer compra urgente
          </span>
          <button
            type="button"
            onClick={onQuickQuote}
            className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 font-bold text-red-700 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ShoppingCartIcon className="size-3.5" />
            Cotação Rápida
          </button>
        </div>
      </Kpi>
    </section>
  );
}

export default EstoqueStats;
