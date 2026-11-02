/*
 * Desenho do carro visto de cima (frente para cima), montado com uma grade de
 * 5 colunas. Usado na vistoria (CarDamageMap) e na impressão (PrintDamageMap).
 */
export const DAMAGE_MAP_LAYOUT = [
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

/** Grade de 5 colunas x 8 linhas do desenho. */
export const DAMAGE_MAP_GRID =
  "grid grid-cols-[1.5rem_1fr_1fr_1fr_1.5rem] grid-rows-[1.5rem_3rem_2rem_2.75rem_2.75rem_2rem_2rem_1.5rem]";
