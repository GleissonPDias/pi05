import { SearchIcon } from "lucide-react";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";

const statusOptions = [
  { value: "todos", label: "Todas as situações" },
  { value: "ativos", label: "Somente ativos" },
  { value: "inativos", label: "Somente inativos" },
];

const roleOptions = [
  { value: "todos", label: "Toda a equipe" },
  { value: "mecanicos", label: "Executa OS" },
  { value: "sem-os", label: "Não executa OS" },
  { value: "admins", label: "Administradores" },
];

/** Filtros da lista de equipe: busca, situação e atuação. */
function EquipeToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
  counts,
}) {
  return (
    <div className="border-b border-slate-200 bg-blue-50/60 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute bottom-3 left-3 size-4 text-slate-500" />
          <TextField
            label="Buscar na equipe"
            type="search"
            autoComplete="off"
            placeholder="Nome, e-mail, cargo ou especialidade..."
            className="[&_input]:pl-9"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <SelectField
          label="Situação"
          options={statusOptions}
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        />
        <SelectField
          label="Atuação"
          options={roleOptions}
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
        />
      </div>
      <p className="mt-3 text-xs text-slate-600" aria-live="polite">
        <strong className="text-slate-900">{counts.total}</strong> integrante(s) na oficina •{" "}
        <strong className="text-slate-900">{counts.active}</strong> ativo(s) •{" "}
        <strong className="text-slate-900">{counts.mechanics}</strong> executa(m) OS
      </p>
    </div>
  );
}

export default EquipeToolbar;
