import { DownloadIcon, SearchIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { FILTERS } from "../constants";

/** Busca + abas de filtro + botão de exportar. */
function ClientesToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
  onExport,
  canExport,
}) {
  const tabCounts = { all: counts.all, open: counts.open, inactive: counts.inactive };

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquisar por Nome, CPF, Telefone ou Placa..."
          aria-label="Pesquisar clientes"
          className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Filtrar clientes"
          className="flex overflow-x-auto rounded-lg bg-blue-50 p-1"
        >
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                filter === item.value
                  ? "bg-white font-bold text-blue-700 shadow-sm"
                  : "font-medium text-slate-700 hover:bg-white/60",
              )}
            >
              {item.label} ({tabCounts[item.value]})
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          icon={DownloadIcon}
          onClick={onExport}
          disabled={!canExport}
          className="shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Exportar Lista
        </Button>
      </div>
    </div>
  );
}

export default ClientesToolbar;
