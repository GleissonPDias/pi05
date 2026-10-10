import { cn } from "../../../utils/cn";
import { DAMAGE_AREAS } from "../constants";

/*
 * Desenho do carro visto de cima (frente para cima), montado com uma grade de
 * 5 colunas. Cada área é um botão: clicar seleciona a área para registrar avaria.
 */
const LAYOUT = [
  { key: "parachoqueDianteiro", className: "col-start-2 col-span-3 row-start-1 rounded-t-[2rem]" },
  { key: "paralamaDE", className: "col-start-1 row-start-2 row-span-2 rounded-tl-2xl" },
  { key: "capo", className: "col-start-2 col-span-3 row-start-2" },
  { key: "paralamaDD", className: "col-start-5 row-start-2 row-span-2 rounded-tr-2xl" },
  { key: "parabrisa", className: "col-start-2 col-span-3 row-start-3 bg-sky-100" },
  { key: "portaDE", className: "col-start-1 row-start-4" },
  { key: "teto", className: "col-start-2 col-span-3 row-start-4 row-span-2" },
  { key: "portaDD", className: "col-start-5 row-start-4" },
  { key: "portaTE", className: "col-start-1 row-start-5" },
  { key: "portaTD", className: "col-start-5 row-start-5" },
  { key: "lateralTE", className: "col-start-1 row-start-6 row-span-2 rounded-bl-2xl" },
  { key: "vidroTraseiro", className: "col-start-2 col-span-3 row-start-6 bg-sky-100" },
  { key: "lateralTD", className: "col-start-5 row-start-6 row-span-2 rounded-br-2xl" },
  { key: "tampaTraseira", className: "col-start-2 col-span-3 row-start-7" },
  { key: "parachoqueTraseiro", className: "col-start-2 col-span-3 row-start-8 rounded-b-[2rem]" },
];

/**
 * - damages: [{ area, type }] · selected: área selecionada
 * - onSelect(area)
 */
function CarDamageMap({ damages, selected, onSelect, disabled }) {
  const counts = damages.reduce((map, damage) => {
    map[damage.area] = (map[damage.area] ?? 0) + 1;
    return map;
  }, {});

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Frente</span>
      <div
        role="group"
        aria-label="Mapa de avarias do veículo"
        className="grid w-48 grid-cols-[1.5rem_1fr_1fr_1fr_1.5rem] grid-rows-[1.5rem_3rem_2rem_2.75rem_2.75rem_2rem_2rem_1.5rem] gap-1"
      >
        {LAYOUT.map(({ key, className }) => {
          const count = counts[key] ?? 0;
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(isSelected ? null : key)}
              aria-pressed={isSelected}
              aria-label={`${DAMAGE_AREAS[key]}${count ? ` — ${count} avaria(s)` : ""}`}
              title={DAMAGE_AREAS[key]}
              className={cn(
                "relative grid place-items-center rounded-md border text-[10px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-default",
                count ? "border-red-300 bg-red-200 text-red-800" : "border-slate-300 bg-slate-100 text-slate-500 hover:bg-blue-100",
                isSelected && "border-blue-600 bg-blue-200 ring-2 ring-blue-600",
                className,
                count && "bg-red-200",
              )}
            >
              {count > 0 && count}
            </button>
          );
        })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Traseira</span>
    </div>
  );
}

export default CarDamageMap;
