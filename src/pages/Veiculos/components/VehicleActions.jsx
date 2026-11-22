import { EyeIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { cn } from "../../../utils/cn";

const base =
  "grid size-8 place-items-center rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

/** Botões de ver ficha, editar e excluir de uma linha da lista. */
function VehicleActions({ vehicle, onView, onEdit, onDelete, onReactivate }) {
  const name = `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
  const inactive = vehicle.status === "inativo";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onView(vehicle)}
        aria-label={`Ver ficha de ${name}`}
        title="Ver ficha técnica"
        className={cn(base, "hover:bg-blue-50 hover:text-blue-700")}
      >
        <EyeIcon className="size-4" />
      </button>
      {inactive ? (
        <button
          type="button"
          onClick={() => onReactivate(vehicle)}
          aria-label={`Reativar ${name}`}
          title="Reativar veículo"
          className={cn(base, "hover:bg-emerald-50 hover:text-emerald-700")}
        >
          <RotateCcwIcon className="size-4" />
        </button>
      ) : (
        <>
      <button
        type="button"
        onClick={() => onEdit(vehicle)}
        aria-label={`Editar ${name}`}
        title="Editar veículo"
        className={cn(base, "hover:bg-blue-50 hover:text-blue-700")}
      >
        <PencilIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(vehicle)}
        aria-label={`Inativar ${name}`}
        title="Inativar veículo"
        className={cn(base, "hover:bg-red-50 hover:text-red-600")}
      >
        <Trash2Icon className="size-4" />
      </button>
        </>
      )}
    </div>
  );
}

export default VehicleActions;
