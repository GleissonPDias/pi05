import { MinusIcon, PlusIcon } from "lucide-react";

const button =
  "grid size-7 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40";

/** Quantidade com botões − e + (mínimo `min`). */
function QuantityStepper({ value, onChange, min = 1, max = 999, label = "Quantidade", disabled }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-blue-50 p-0.5">
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Diminuir ${label.toLowerCase()}`}
      >
        <MinusIcon className="size-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value.replace(/\D/g, "") || min);
          onChange(Math.min(max, Math.max(min, next)));
        }}
        className="w-9 bg-transparent text-center text-sm font-bold text-slate-900 focus:outline-none"
      />
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Aumentar ${label.toLowerCase()}`}
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}

export default QuantityStepper;
