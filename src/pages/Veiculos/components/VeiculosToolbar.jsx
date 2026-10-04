import { ChevronDownIcon, DownloadIcon, SearchIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";

const chip =
  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

/** Busca, filtros rápidos (OS em aberto, marca, mais recentes) e exportação. */
function VeiculosToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  brand,
  brands,
  onBrandChange,
  sort,
  onSortChange,
  counts,
  onExport,
  canExport,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquisar por Placa, Modelo ou Nome do Cliente..."
          aria-label="Pesquisar veículos"
          className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div role="group" aria-label="Filtros rápidos" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => onFilterChange("all")}
            className={cn(
              chip,
              filter === "all"
                ? "bg-blue-600 font-bold text-white"
                : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
            )}
          >
            Todos ({counts.all})
          </button>

          <button
            type="button"
            aria-pressed={filter === "open"}
            onClick={() => onFilterChange(filter === "open" ? "all" : "open")}
            className={cn(
              chip,
              filter === "open"
                ? "bg-blue-600 font-bold text-white"
                : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
            )}
          >
            <span className="size-2 rounded-full bg-amber-500" />
            Com OS em Aberto ({counts.open})
          </button>

          <label
            className={cn(
              chip,
              "relative cursor-pointer pr-8",
              brand
                ? "bg-blue-600 font-bold text-white"
                : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
            )}
          >
            <span className="sr-only">Filtrar por marca</span>
            {brand || "Por Marca"}
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5" />
            <select
              value={brand}
              onChange={(event) => onBrandChange(event.target.value)}
              aria-label="Filtrar por marca"
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            >
              <option value="">Todas as marcas</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            aria-pressed={sort === "recent"}
            onClick={() => onSortChange(sort === "recent" ? "default" : "recent")}
            className={cn(
              chip,
              sort === "recent"
                ? "bg-blue-600 font-bold text-white"
                : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
            )}
          >
            Últimos Cadastrados
          </button>
        </div>

        <Button
          variant="outline"
          icon={DownloadIcon}
          onClick={onExport}
          disabled={!canExport}
          className="shrink-0 disabled:opacity-50"
        >
          Exportar Lista
        </Button>
      </div>
    </div>
  );
}

export default VeiculosToolbar;
