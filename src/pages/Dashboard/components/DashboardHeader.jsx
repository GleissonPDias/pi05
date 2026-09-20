import { DownloadIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";

const periodOptions = [
  { value: "today", label: "Hoje" },
  { value: "7days", label: "Últimos 7 dias" },
  { value: "month", label: "Este Mês" },
];

function DashboardHeader({ updatedAt, period, onPeriodChange }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Inicial</h1>
        <p className="text-sm text-slate-500">
          Visão geral da oficina ·{" "}
          <span className="font-semibold text-emerald-700">
            Atualizado hoje às {updatedAt}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Período"
          className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
        >
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => onPeriodChange(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                period === option.value
                  ? "bg-blue-50 font-bold text-blue-700"
                  : "font-medium text-slate-600 hover:bg-slate-50",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button variant="outline" icon={DownloadIcon}>
          Exportar Relatório
        </Button>
      </div>
    </div>
  );
}

export default DashboardHeader;
