import { CalendarRangeIcon, DownloadIcon, SearchIcon, UserRoundIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import ChipSelect from "../../../components/ui/ChipSelect";
import { CONSULTANTS } from "../../../mocks/oficina";
import { cn } from "../../../utils/cn";
import { PERIODS, STATUS_FILTERS } from "../constants";

const sellerOptions = CONSULTANTS.map((c) => ({ value: c.id, label: c.name }));

/** Busca, vendedor, período, chips de situação e exportação. */
function OrcamentosToolbar({ search, onSearchChange, seller, onSellerChange, period, onPeriodChange, status, onStatusChange, counts, onExport, canExport }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Pesquisar por cliente, veículo, placa ou número do orçamento..."
            aria-label="Pesquisar orçamentos"
            className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipSelect icon={UserRoundIcon} label="Vendedor" allLabel="Todos" value={seller} options={sellerOptions} onChange={onSellerChange} />
          <ChipSelect
            icon={CalendarRangeIcon}
            label="Período"
            allLabel={null}
            value={period}
            options={PERIODS}
            onChange={onPeriodChange}
            highlight={false}
          />
          <Button variant="outline" icon={DownloadIcon} onClick={onExport} disabled={!canExport} className="disabled:opacity-50">
            Exportar
          </Button>
        </div>
      </div>

      <div role="group" aria-label="Situação comercial" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.filter((chip) => chip.key !== "rascunho" || counts.rascunho > 0).map((chip) => (
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
            {chip.label} ({counts[chip.key]})
          </button>
        ))}
      </div>
    </div>
  );
}

export default OrcamentosToolbar;
