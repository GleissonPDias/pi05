import { cn } from "../../../utils/cn";
import { DAMAGE_AREAS, DAMAGE_TYPES } from "../constants";
import { DAMAGE_MAP_LAYOUT } from "./damageMapLayout";

const GLASS = new Set(["parabrisa", "vidroTraseiro"]);

/** Mesma grade da vistoria, em escala menor para caber no papel. */
const PRINT_GRID =
  "grid grid-cols-[1rem_1fr_1fr_1fr_1rem] grid-rows-[1.1rem_2.1rem_1.4rem_1.9rem_1.9rem_1.4rem_1.4rem_1.1rem]";

/**
 * Mapa de avarias para documentos impressos (OS e comprovante de entrada).
 * Cada avaria recebe um número; o número aparece na área do desenho e na
 * tabela ao lado, para o cliente localizar cada registro.
 */
function PrintDamageMap({ damages }) {
  const numbersByArea = damages.reduce((map, damage, index) => {
    (map[damage.area] ??= []).push(index + 1);
    return map;
  }, {});

  return (
    <div className="flex break-inside-avoid items-start gap-6">
      <figure className="m-0 flex shrink-0 flex-col items-center gap-1">
        <span className="text-[8px] font-bold uppercase tracking-widest">Frente</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase [writing-mode:vertical-rl] rotate-180">Lado esquerdo</span>
          <div className={cn("w-32 gap-0.5", PRINT_GRID)}>
            {DAMAGE_MAP_LAYOUT.map(({ key, className }) => {
              const numbers = numbersByArea[key];
              return (
                <div
                  key={key}
                  title={DAMAGE_AREAS[key]}
                  className={cn(
                    "grid place-items-center rounded-md border text-[9px] font-extrabold leading-none",
                    className.replace(/\bbg-\S+/g, ""),
                    numbers
                      ? "border-red-700 bg-red-200 text-red-900"
                      : GLASS.has(key)
                        ? "border-gray-400 bg-sky-50"
                        : "border-gray-400 bg-white",
                  )}
                >
                  {numbers?.join(",")}
                </div>
              );
            })}
          </div>
          <span className="text-[8px] font-bold uppercase [writing-mode:vertical-rl]">Lado direito</span>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest">Traseira</span>
      </figure>

      <div className="min-w-0 flex-1">
        {damages.length ? (
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="w-8 px-1.5 py-1 text-center font-bold">Nº</th>
                <th className="px-1.5 py-1 font-bold">Área da carroceria</th>
                <th className="w-36 px-1.5 py-1 font-bold">Tipo de avaria</th>
              </tr>
            </thead>
            <tbody>
              {damages.map((damage, index) => (
                <tr key={damage.id ?? index} className="border-b border-gray-300">
                  <td className="px-1.5 py-1 text-center">
                    <span className="inline-grid size-4 place-items-center rounded-full bg-red-700 text-[9px] font-bold text-white">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-1.5 py-1">{DAMAGE_AREAS[damage.area]}</td>
                  <td className="px-1.5 py-1">{DAMAGE_TYPES[damage.type]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded border border-gray-400 px-2 py-1.5 text-[11px]">
            Nenhuma avaria registrada na vistoria de entrada.
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-gray-700">
          <span className="inline-block size-2.5 rounded-sm border border-red-700 bg-red-200" />
          Área com avaria (o número indica o registro na tabela)
        </p>
      </div>
    </div>
  );
}

export default PrintDamageMap;
