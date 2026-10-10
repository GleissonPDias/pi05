import { FlagIcon, KanbanSquareIcon, ListIcon, SearchIcon, UserCogIcon } from "lucide-react";
import ChipSelect from "../../../components/ui/ChipSelect";
import { MECHANICS } from "../../../mocks/oficina";
import { cn } from "../../../utils/cn";
import { PRIORITIES, STATUS } from "../constants";

const chip =
  "relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-blue-500";

const mechanicOptions = MECHANICS.map((m) => ({ value: m.id, label: m.name }));
const priorityOptions = Object.entries(PRIORITIES).map(([value, item]) => ({ value, label: item.label }));
const statusOptions = [
  { value: "ativas", label: "Ativas (no pátio)" },
  ...Object.entries(STATUS).map(([value, item]) => ({ value, label: item.label })),
];

/**
 * Busca, filtros e alternância entre Quadro e Lista.
 * `searchRef` vai para o campo de busca (atalho "F").
 */
function OrdensToolbar({
    view,
    onViewChange,
    search,
    onSearchChange,
    mechanic,
    onMechanicChange,
    priority,
    onPriorityChange,
    status,
    onStatusChange,
    hideCanceled,
    onHideCanceledChange,
  canceledCount,
  searchRef,
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por número de OS, placa, modelo ou cliente..."
          aria-label="Buscar ordens de serviço"
          aria-keyshortcuts="F"
          className="w-full truncate rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-300 bg-slate-50 px-1.5 text-[10px] font-semibold text-slate-500 sm:block">
          F
        </kbd>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ChipSelect
          icon={UserCogIcon}
          label="Mecânico"
          allLabel="Todos"
          value={mechanic}
          options={mechanicOptions}
          onChange={onMechanicChange}
        />
        <ChipSelect
          icon={FlagIcon}
          label="Prioridade"
          allLabel="Todas"
          value={priority}
          options={priorityOptions}
          onChange={onPriorityChange}
        />

        {view === "lista" ? (
          <ChipSelect
            icon={ListIcon}
            label="Etapa"
            allLabel="Todas"
            value={status === "todas" ? "" : status}
            options={statusOptions}
            onChange={(value) => onStatusChange(value || "todas")}
          />
        ) : (
          <label className={cn(chip, "cursor-pointer border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
            <input
              type="checkbox"
              checked={hideCanceled}
              onChange={(event) => onHideCanceledChange(event.target.checked)}
              className="size-4 cursor-pointer accent-blue-600 focus:outline-none"
            />
            Ocultar Canceladas ({canceledCount})
          </label>
        )}

        <div role="group" aria-label="Modo de visualização" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {[
            { key: "quadro", label: "Quadro", icon: KanbanSquareIcon },
            { key: "lista", label: "Lista", icon: ListIcon },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => onViewChange(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                view === key ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrdensToolbar;
