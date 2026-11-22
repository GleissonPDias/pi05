import { KeyRoundIcon, PowerIcon, SquarePenIcon, UserCheckIcon, UsersIcon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import { initials, profileLabel } from "./equipeUtils";

function ActionButton({ label, icon: Icon, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg border transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          : "border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Lista da equipe com ações de edição, senha e situação. */
function EquipeTable({ members, currentUserId, loading, onEdit, onReset, onToggle }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-bold">Integrante</th>
            <th className="px-4 py-3 font-bold">Cargo</th>
            <th className="px-4 py-3 font-bold">Atuação</th>
            <th className="px-4 py-3 font-bold">Situação</th>
            <th className="px-4 py-3 text-right font-bold">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && members.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                Carregando equipe...
              </td>
            </tr>
          )}

          {!loading && members.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <UsersIcon className="size-6" />
                  </span>
                  <p className="text-sm font-bold text-slate-900">Nenhum integrante encontrado</p>
                  <p className="max-w-md text-xs text-slate-500">
                    Ajuste os filtros ou cadastre o primeiro funcionário da oficina.
                  </p>
                </div>
              </td>
            </tr>
          )}

          {members.map((member) => {
            const isSelf = member.id === currentUserId;
            return (
              <tr key={member.id} className={cn("align-middle", !member.active && "bg-slate-50/70")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                        member.active ? "bg-blue-600" : "bg-slate-400",
                      )}
                      aria-hidden="true"
                    >
                      {initials(member.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-slate-900">{member.name}</p>
                        {member.profile === "ADMIN" && (
                          <Badge variant="blue">{profileLabel(member.profile)}</Badge>
                        )}
                        {member.lead && <Badge variant="green">Líder</Badge>}
                        {isSelf && <Badge variant="slate">Você</Badge>}
                      </div>
                      <p className="truncate text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{member.role}</p>
                  {member.specialties && (
                    <p className="max-w-56 truncate text-xs text-slate-500">{member.specialties}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {member.executesOrders ? (
                    <Badge variant="green">Executa OS</Badge>
                  ) : (
                    <Badge variant="slate">Não executa</Badge>
                  )}
                  {member.mustChangePassword && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">Senha temporária</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={member.active ? "green" : "slate"}>
                    {member.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <ActionButton
                      label={`Editar ${member.name}`}
                      icon={SquarePenIcon}
                      onClick={() => onEdit(member)}
                    />
                    <ActionButton
                      label={`Redefinir senha de ${member.name}`}
                      icon={KeyRoundIcon}
                      onClick={() => onReset(member)}
                      disabled={member.profile === "ADMIN" && isSelf}
                    />
                    <ActionButton
                      label={member.active ? `Desativar ${member.name}` : `Reativar ${member.name}`}
                      icon={member.active ? PowerIcon : UserCheckIcon}
                      onClick={() => onToggle(member)}
                      disabled={isSelf && member.active}
                      danger={member.active}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EquipeTable;
