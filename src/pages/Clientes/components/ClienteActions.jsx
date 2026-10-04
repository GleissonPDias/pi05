import { PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "../../../utils/cn";

const base =
  "grid size-8 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

/** Botões de editar e excluir de uma linha da lista. */
function ClienteActions({ client, onEdit, onDelete }) {
  const isInactive = client.status === "inativo";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(client)}
        aria-label={`Editar ${client.name}`}
        title="Editar cliente"
        className={cn(base, "text-slate-500 hover:bg-blue-50 hover:text-blue-700")}
      >
        <PencilIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(client)}
        disabled={isInactive}
        aria-label={`Excluir ${client.name}`}
        title={isInactive ? "Cadastro já está inativo" : "Excluir cliente"}
        className={cn(
          base,
          "text-slate-500 hover:bg-red-50 hover:text-red-600",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500",
        )}
      >
        <Trash2Icon className="size-4" />
      </button>
    </div>
  );
}

export default ClienteActions;
