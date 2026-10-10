import { useId } from "react";
import { FuelIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { FUEL_LEVELS } from "../constants";

/**
 * Seletor do nível de combustível (Reserva, 1/4, 1/2, 3/4, Cheio).
 * Funciona como um grupo de opções (setas do teclado mudam a seleção).
 */
function FuelLevelPicker({ label = "Nível de combustível", value, onChange, error, required, disabled, name = "fuelLevel" }) {
  const labelId = useId();

  const handleKeyDown = (event) => {
    if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const current = value ?? 0;
    const next = event.key === "ArrowRight" ? Math.min(4, current + 1) : Math.max(0, current - 1);
    onChange(next);
    event.currentTarget.querySelectorAll("button")[next]?.focus();
  };

  return (
    <div>
      <p id={labelId} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <FuelIcon className="size-3.5 text-slate-500" />
        {label}
        {required && <span aria-hidden="true" className="text-red-600">*</span>}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-invalid={error ? true : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          "grid grid-cols-5 gap-1 rounded-lg border p-1",
          error ? "border-red-500 bg-red-50" : "border-transparent bg-blue-50",
        )}
      >
        {FUEL_LEVELS.map((level, index) => {
          const selected = value === index;
          const filled = value !== null && index <= value;
          return (
            <button
              key={level}
              type="button"
              name={index === 0 ? name : undefined}
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (value === null && index === 0) ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(index)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed",
                selected ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white/60",
              )}
            >
              <span
                className={cn(
                  "h-2 w-full rounded-full",
                  filled ? (value === 0 ? "bg-red-500" : "bg-blue-600") : "bg-slate-300",
                )}
              />
              {level}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default FuelLevelPicker;
