import { BanknoteIcon, ClockIcon, ListChecksIcon, TrophyIcon } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";
import { formatBRL } from "../../../utils/format";
import { LABOR_RATE } from "./servicoUtils";

/** Indicadores do catálogo de serviços. */
function ServicosStats({ stats }) {
  return (
    <section aria-label="Indicadores de serviços" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={ListChecksIcon}
        iconClassName="bg-blue-100 text-blue-700"
        label="Serviços ativos"
        value={stats.active}
        note={stats.inactive ? `${stats.inactive} inativo(s) no catálogo` : "Todos os serviços ativos"}
      />
      <StatCard
        icon={BanknoteIcon}
        iconClassName="bg-emerald-100 text-emerald-700"
        label="Mão de obra (30 dias)"
        value={formatBRL(stats.laborMonth, 0)}
        note={<span className="font-semibold text-emerald-700">Em OS entregues</span>}
      />
      <StatCard
        icon={ClockIcon}
        iconClassName="bg-indigo-100 text-indigo-700"
        label="Valor médio por hora"
        value={formatBRL(stats.avgRate, 0)}
        note={`Referência da oficina: ${formatBRL(LABOR_RATE, 0)}/h`}
      />
      <StatCard
        icon={TrophyIcon}
        iconClassName="bg-amber-100 text-amber-700"
        label="Mais executado (90 dias)"
        value={stats.topCount ? `${stats.topCount}x` : "—"}
        note={<span className="line-clamp-1" title={stats.topService?.description}>{stats.topService?.description ?? "Sem execuções"}</span>}
        className="min-w-0"
      />
    </section>
  );
}

export default ServicosStats;
