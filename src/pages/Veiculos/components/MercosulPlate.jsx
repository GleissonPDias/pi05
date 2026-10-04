import { cn } from "../../../utils/cn";
import { maskPlate } from "../../../utils/masks";

const sizes = {
  sm: { box: "w-[5.5rem]", strip: "h-3.5 px-1.5 text-[6px]", text: "py-1 text-sm" },
  md: { box: "w-28", strip: "h-4 px-2 text-[7px]", text: "py-1.5 text-base" },
  lg: { box: "w-40", strip: "h-5 px-2.5 text-[9px]", text: "py-2 text-2xl" },
};

/** Placa no estilo Mercosul: faixa azul "BRASIL" e caracteres em fonte monoespaçada. */
function MercosulPlate({ plate, size = "md", className }) {
  const style = sizes[size];

  return (
    <div
      role="img"
      aria-label={`Placa ${maskPlate(plate)}`}
      className={cn(
        "shrink-0 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm",
        style.box,
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between bg-blue-700 font-bold leading-none tracking-widest text-white",
          style.strip,
        )}
      >
        <span>BRASIL</span>
        <span className="size-1.5 rounded-full bg-yellow-300" />
      </div>
      <p
        className={cn(
          "text-center font-mono font-extrabold tracking-wider text-slate-900",
          style.text,
        )}
      >
        {maskPlate(plate)}
      </p>
    </div>
  );
}

export default MercosulPlate;
