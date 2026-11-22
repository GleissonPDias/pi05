import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Lista suspensa com visual de "chip" para barras de filtro.
 */
function ChipSelect({ icon: Icon, label, value, options, onChange, allLabel = "Todos", highlight }) {
  const active = highlight ?? Boolean(value);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border py-2 pl-3 pr-8 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-blue-500",
        active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      <span className="pointer-events-none">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="cursor-pointer bg-transparent text-xs font-semibold outline-none appearance-none"
        style={{ color: "inherit" }}
      >
        {allLabel !== null && <option value="">{allLabel}</option>}
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value} className="text-slate-900">
            {option.label ?? option.value ?? ""}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5" />
    </div>
  );
}

export default ChipSelect;
