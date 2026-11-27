import { CalendarRangeIcon, DownloadIcon, SearchIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import ChipSelect from "../../components/ui/ChipSelect";
import { cn } from "../../utils/cn";
import { KIND, KIND_CONFIG, PERIODS, STATUS_CHIPS } from "./financeiroUtils";

const KIND_ICON = { [KIND.RECEBER]: TrendingUpIcon, [KIND.PAGAR]: TrendingDownIcon };

/** Abas (a receber / a pagar), busca, período, chips de situação e exportação. */
function FinanceiroToolbar({
  kind,
  onKindChange,
  kindCounts,
  search,
  onSearchChange,
  period,
  onPeriodChange,
  status,
  onStatusChange,
  counts,
  onExport,
  canExport,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div role="tablist" aria-label="Tipo de lançamento" className="flex shrink-0 rounded-lg bg-blue-50 p-1">
          {[KIND.RECEBER, KIND.PAGAR].map((key) => {
            const Icon = KIND_ICON[key];
            const active = kind === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`financeiro-tab-${key}`}
                aria-selected={active}
                aria-controls="financeiro-lista"
                onClick={() => onKindChange(key)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  active ? "bg-white font-bold text-blue-700 shadow-sm" : "font-medium text-slate-700 hover:bg-white/60",
                )}
              >
                <Icon className={cn("size-3.5", key === KIND.RECEBER ? "text-emerald-600" : "text-red-600")} />
                {KIND_CONFIG[key].label} ({kindCounts[key]})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={
              kind === KIND.RECEBER
                ? "Pesquisar por descrição, OS ou forma de pagamento..."
                : "Pesquisar por descrição, fornecedor ou categoria..."
            }
            aria-label="Pesquisar lançamentos"
            className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ChipSelect
            icon={CalendarRangeIcon}
            label="Vencimento"
            allLabel={null}
            value={period}
            options={PERIODS}
            onChange={onPeriodChange}
            highlight={period !== "todos"}
          />
          <Button variant="outline" icon={DownloadIcon} onClick={onExport} disabled={!canExport} className="disabled:opacity-50">
            Exportar
          </Button>
        </div>
      </div>

      <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={status === chip.key}
            onClick={() => onStatusChange(chip.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              status === chip.key ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
            )}
          >
            {chip.dot && <span className={cn("size-2 rounded-full", status === chip.key ? "bg-white" : chip.dot)} />}
            {chip.label} ({counts[chip.key] ?? 0})
          </button>
        ))}
      </div>
    </div>
  );
}

export default FinanceiroToolbar;
