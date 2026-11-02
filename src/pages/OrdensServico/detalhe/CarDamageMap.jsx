import { cn } from "../../../utils/cn";
import { DAMAGE_AREAS } from "../constants";
import { DAMAGE_MAP_GRID, DAMAGE_MAP_LAYOUT as LAYOUT } from "./damageMapLayout";


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
        className={cn("w-48 gap-1", DAMAGE_MAP_GRID)}
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
