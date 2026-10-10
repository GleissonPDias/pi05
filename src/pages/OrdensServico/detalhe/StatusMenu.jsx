import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { STATUS, STATUS_ORDER } from "../constants";

/**
 * Pílula com a etapa atual que abre a lista de etapas (select nativo invisível
 * por cima: funciona com teclado e no celular).
 */
function StatusMenu({ status, onChange, disabled }) {
  const item = STATUS[status];
  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
        item.badge,
        disabled ? "cursor-default" : "cursor-pointer",
      )}
    >
      <span className={cn("size-2 rounded-full", status === "execucao" ? "bg-white" : item.dot)} />
      {item.label}
      {!disabled && <ChevronDownIcon className="size-4" />}
      <select
        value={status}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Etapa da OS"
        className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-default"
      >
        {STATUS_ORDER.map((key) => (
          <option key={key} value={key}>
            {STATUS[key].label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default StatusMenu;
