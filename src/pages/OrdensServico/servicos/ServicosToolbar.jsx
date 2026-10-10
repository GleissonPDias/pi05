import { DownloadIcon, SearchIcon, TagIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import ChipSelect from "../../../components/ui/ChipSelect";
import { SERVICE_CATEGORIES } from "../../../mocks/catalogo";
import { cn } from "../../../utils/cn";

const categoryOptions = SERVICE_CATEGORIES.map((category) => ({ value: category, label: category }));

/** Busca, categoria, situação e exportação do catálogo. */
function ServicosToolbar({ search, onSearchChange, category, onCategoryChange, status, onStatusChange, counts, onExport, canExport }) {
  const chips = [
    { key: "todos", label: `Todos (${counts.all})` },
    { key: "ativo", label: `Ativos (${counts.active})`, dot: "bg-emerald-500" },
    { key: "inativo", label: `Inativos (${counts.inactive})`, dot: "bg-slate-400" },
  ];

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por código, serviço ou categoria..."
          aria-label="Buscar serviços"
          className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Situação" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-pressed={status === chip.key}
              onClick={() => onStatusChange(chip.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                status === chip.key ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
              )}
            >
              {chip.dot && <span className={cn("size-2 rounded-full", chip.dot)} />}
              {chip.label}
            </button>
          ))}
        </div>
        <ChipSelect icon={TagIcon} label="Categoria" allLabel="Todas" value={category} options={categoryOptions} onChange={onCategoryChange} />
        <Button variant="outline" icon={DownloadIcon} onClick={onExport} disabled={!canExport} className="disabled:opacity-50">
          Exportar
        </Button>
      </div>
    </div>
  );
}

export default ServicosToolbar;
