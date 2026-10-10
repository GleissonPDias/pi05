import { CircleSlashIcon, DownloadIcon, PowerOffIcon, SearchIcon, TagIcon, TriangleAlertIcon, TruckIcon, WarehouseIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import ChipSelect from "../../../components/ui/ChipSelect";
import { PART_CATEGORIES, SUPPLIERS } from "../../../mocks/catalogo";
import { cn } from "../../../utils/cn";
import { STATUS_FILTERS } from "../constants";

const icons = { alert: TriangleAlertIcon, x: CircleSlashIcon, truck: TruckIcon, off: PowerOffIcon };
const categoryOptions = PART_CATEGORIES.map((category) => ({ value: category, label: category }));
const supplierOptions = SUPPLIERS.map((supplier) => ({ value: supplier.id, label: supplier.name }));

/** Busca, chips de situação, categoria, fornecedor e exportação do inventário. */
function EstoqueToolbar({ search, onSearchChange, status, onStatusChange, category, onCategoryChange, supplier, onSupplierChange, counts, onExport, canExport }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Pesquisar peças, código OEM, SKU, fornecedor ou prateleira..."
            aria-label="Pesquisar peças"
            className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipSelect icon={TagIcon} label="Categoria" allLabel="Todas as peças" value={category} options={categoryOptions} onChange={onCategoryChange} />
          <ChipSelect icon={WarehouseIcon} label="Fornecedor" allLabel="Todos" value={supplier} options={supplierOptions} onChange={onSupplierChange} />
          <Button variant="outline" icon={DownloadIcon} onClick={onExport} disabled={!canExport} className="disabled:opacity-50">
            Exportar Inventário
          </Button>
        </div>
      </div>
      <div role="group" aria-label="Situação do estoque" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((chip) => {
          const Icon = icons[chip.icon];
          const active = status === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusChange(chip.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                active ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
                !active && chip.key === "critico" && "text-red-700",
                !active && chip.key === "baixo" && "text-amber-800",
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {chip.label} ({counts[chip.key]})
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EstoqueToolbar;
