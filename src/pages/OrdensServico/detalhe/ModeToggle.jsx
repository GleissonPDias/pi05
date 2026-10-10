import { cn } from "../../../utils/cn";

/** Alternância "Do catálogo" / "Item avulso". */
function ModeToggle({ value, onChange, options }) {
  return (
    <div role="group" className="inline-flex rounded-lg bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            value === option.value ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ModeToggle;
