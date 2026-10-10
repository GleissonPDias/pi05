import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Lista suspensa com visual de "chip" para barras de filtro
 * (o <select> nativo fica invisível por cima: funciona no teclado e no celular).
 *
 * - label: "Mecânico" -> mostra "Mecânico: Todos"
 * - allLabel: texto da opção vazia (sem filtro). Use null para não ter opção vazia.
 * - highlight: destaca o chip (padrão: quando há valor selecionado)
 */
function ChipSelect({ icon: Icon, label, value, options, onChange, allLabel = "Todos", highlight }) {
  const current = options.find((option) => option.value === value);
  const active = highlight ?? Boolean(value);

  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border py-2 pl-3 pr-8 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-blue-500",
        active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {label}: {current ? current.label : allLabel}
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      >
        {allLabel !== null && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ChipSelect;
