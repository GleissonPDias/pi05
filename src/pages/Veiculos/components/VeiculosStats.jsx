import { BadgeCheckIcon, CarFrontIcon, TrendingUpIcon, WrenchIcon } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";

/** Três indicadores do topo: total, em serviço e revisões em dia. */
function VeiculosStats({ stats }) {
  return (
    <section aria-label="Indicadores da frota" className="grid gap-4 md:grid-cols-3">
      <StatCard
        icon={CarFrontIcon}
        iconClassName="bg-blue-100 text-blue-700"
        label="Total de veículos"
        value={stats.registered.toLocaleString("pt-BR")}
        note={
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <TrendingUpIcon className="size-3.5" />+{stats.newThisMonth} neste mês
          </span>
        }
      />
      <StatCard
        icon={WrenchIcon}
        iconClassName="bg-amber-100 text-amber-700"
        label="Em serviço ativo"
        value={stats.open.toLocaleString("pt-BR")}
        note={`Taxa de ocupação de boxes: ${stats.occupancy}%`}
      />
      <StatCard
        icon={BadgeCheckIcon}
        iconClassName="bg-emerald-200 text-emerald-800"
        label="Revisões preventivas"
        value={`${stats.compliance.toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`}
        note={
          <span className="font-semibold text-emerald-700">
            Conformidade com plano de fábrica
          </span>
        }
      />
    </section>
  );
}

export default VeiculosStats;
