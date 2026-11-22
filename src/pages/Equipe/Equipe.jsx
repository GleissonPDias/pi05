import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRightIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useOficina } from "../../hooks/useOficina";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import EquipeAuditoria from "./EquipeAuditoria";
import EquipeFormModal from "./EquipeFormModal";
import EquipeSenhaModal from "./EquipeSenhaModal";
import EquipeStatusModal from "./EquipeStatusModal";
import EquipeTable from "./EquipeTable";
import EquipeToolbar from "./EquipeToolbar";
import {
  buildDemoMembers,
  createUsuarioPayload,
  filterMembers,
  generateDemoPassword,
  mapUsuario,
  updateUsuarioPayload,
} from "./equipeUtils";

/**
 * Cadastro e gestão da equipe da oficina (rota /equipe, somente ADMIN).
 *
 * A lista real vem de `/usuarios`. Após criar, editar ou desativar alguém que
 * executa OS, recarregamos `/mecanicos` para o seletor da OS refletir a equipe.
 */
function Equipe() {
  const { user, isDemo } = useAuth();
  const { reload: reloadMechanics } = useOficina();
  const { toast, showToast, dismissToast } = useToast();

  const [members, setMembers] = useState(() =>
    isDemo ? buildDemoMembers(user) : [],
  );
  const [loading, setLoading] = useState(() => !isDemo);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [aba, setAba] = useState("equipe");
  const [role, setRole] = useState("todos");
  const [formState, setFormState] = useState({ open: false, member: null });
  const [statusMember, setStatusMember] = useState(null);
  const [passwordInfo, setPasswordInfo] = useState(null);

  const currentUserId = isDemo ? "demo-admin" : String(user?.id ?? "");

  const load = useCallback(async () => {
    if (isDemo) {
      setMembers(buildDemoMembers(user));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const dtos = await api.usuarios.list();
      setMembers((Array.isArray(dtos) ? dtos : []).map(mapUsuario));
    } catch {
      // O banner global já mostra o erro da API.
    } finally {
      setLoading(false);
    }
  }, [isDemo, user]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const counts = useMemo(
    () => ({
      total: members.length,
      active: members.filter((member) => member.active).length,
      mechanics: members.filter((member) => member.active && member.executesOrders).length,
      admins: members.filter((member) => member.active && member.profile === "ADMIN").length,
    }),
    [members],
  );

  const visible = useMemo(
    () =>
      filterMembers(members, { search, status, role }).sort(
        (a, b) =>
          Number(b.profile === "ADMIN") - Number(a.profile === "ADMIN") ||
          Number(b.active) - Number(a.active) ||
          a.name.localeCompare(b.name, "pt-BR"),
      ),
    [members, search, status, role],
  );

  const replaceMember = (updated) => {
    setMembers((current) =>
      current.map((member) => (member.id === updated.id ? updated : member)),
    );
  };

  const handleCreate = async (values) => {
    if (isDemo) {
      const password = values.password.trim() || generateDemoPassword();
      const created = {
        id: `demo-${Date.now()}`,
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role.trim(),
        profile: "FUNCIONARIO",
        phone: values.phone.trim(),
        specialties: values.specialties.trim(),
        lead: Boolean(values.lead),
        commission: Number(values.commission || 0),
        color: values.color.trim(),
        photo: "",
        active: true,
        executesOrders: Boolean(values.executesOrders),
        mustChangePassword: !values.password.trim(),
      };
      setMembers((current) => [created, ...current]);
      showToast(`${created.name} adicionado à equipe (demonstração).`);
      if (!values.password.trim()) {
        setPasswordInfo({ member: created, password, mode: "created" });
      }
      return;
    }

    const response = await api.usuarios.create(createUsuarioPayload(values));
    const created = mapUsuario(response.usuario);
    setMembers((current) => [created, ...current]);
    await reloadMechanics();
    showToast(`${created.name} cadastrado na equipe.`);
    if (response.senhaTemporaria) {
      setPasswordInfo({ member: created, password: response.senhaTemporaria, mode: "created" });
    }
  };

  const handleUpdate = async (values) => {
    const member = formState.member;
    if (isDemo) {
      const updated = {
        ...member,
        name: values.name.trim(),
        role: values.role.trim(),
        phone: values.phone.trim(),
        specialties: values.specialties.trim(),
        lead: Boolean(values.lead),
        commission: Number(values.commission || 0),
        color: values.color.trim(),
        executesOrders: Boolean(values.executesOrders),
      };
      replaceMember(updated);
      showToast(`${updated.name} atualizado (demonstração).`);
      return;
    }

    const response = await api.usuarios.update(member.id, updateUsuarioPayload(values));
    const updated = mapUsuario(response);
    replaceMember(updated);
    await reloadMechanics();
    showToast(`${updated.name} atualizado.`);
  };

  const handleStatus = async (active) => {
    if (!statusMember) return;
    if (isDemo) {
      const updated = { ...statusMember, active };
      replaceMember(updated);
      showToast(active ? `${updated.name} reativado (demonstração).` : `${updated.name} desativado (demonstração).`);
      return;
    }

    const response = await api.usuarios.changeStatus(statusMember.id, active);
    const updated = mapUsuario(response);
    replaceMember(updated);
    await reloadMechanics();
    showToast(active ? `${updated.name} reativado.` : `${updated.name} desativado.`, active ? "success" : "warning");
  };

  const handleResetPassword = async (member) => {
    try {
      if (isDemo) {
        const password = generateDemoPassword();
        replaceMember({ ...member, mustChangePassword: true });
        setPasswordInfo({ member, password, mode: "reset" });
        return;
      }

      const response = await api.usuarios.resetPassword(member.id);
      replaceMember({ ...member, mustChangePassword: true });
      setPasswordInfo({ member, password: response.senhaTemporaria, mode: "reset" });
    } catch {
      // O banner global já mostra o erro da API.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav
            aria-label="Trilha"
            className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Administração <ChevronRightIcon className="size-3" />{" "}
            <span className="text-blue-700">Equipe</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Equipe da Oficina</h1>
            {isDemo && <Badge variant="slate">Demonstração</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Cadastre funcionários, defina quem executa OS e controle o acesso. Funcionários não
            acessam Financeiro, Equipe nem Configurações.
          </p>
        </div>
        <Button
          icon={PlusIcon}
          size="lg"
          onClick={() => setFormState({ open: true, member: null })}
          className="w-full sm:w-auto"
        >
          Novo Funcionário
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          iconClassName="bg-blue-100 text-blue-600"
          label="Equipe"
          value={counts.total}
          note="integrantes cadastrados"
        />
        <StatCard
          icon={UserCheckIcon}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="Ativos"
          value={counts.active}
          note="com acesso liberado"
        />
        <StatCard
          icon={WrenchIcon}
          iconClassName="bg-amber-100 text-amber-700"
          label="Executam OS"
          value={counts.mechanics}
          note="aparecem como responsáveis"
        />
        <StatCard
          icon={ShieldCheckIcon}
          iconClassName="bg-slate-200 text-slate-700"
          label="Administradores"
          value={counts.admins}
          note="acesso total à oficina"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setAba("equipe")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${aba === "equipe" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>Equipe</button>
        <button type="button" onClick={() => setAba("auditoria")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${aba === "auditoria" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>Relatório de ações</button>
      </div>

      {aba === "auditoria" && <EquipeAuditoria members={members} />}

      {aba === "equipe" && (
      <Card className="overflow-hidden p-0!">
        <EquipeToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          role={role}
          onRoleChange={setRole}
          counts={counts}
        />
        <EquipeTable
          members={visible}
          currentUserId={currentUserId}
          loading={loading}
          onEdit={(member) => setFormState({ open: true, member })}
          onReset={handleResetPassword}
          onToggle={setStatusMember}
        />
        <div className="border-t border-slate-200 bg-blue-50/60 px-4 py-3">
          <p className="text-xs text-slate-600" aria-live="polite">
            Mostrando <strong className="text-slate-900">{visible.length}</strong> de{" "}
            <strong className="text-slate-900">{members.length}</strong> integrante(s).
          </p>
        </div>
      </Card>
      )}

      {formState.open && (
        <EquipeFormModal
          member={formState.member}
          isDemo={isDemo}
          onClose={() => setFormState({ open: false, member: null })}
          onSubmit={formState.member ? handleUpdate : handleCreate}
        />
      )}

      {statusMember && (
        <EquipeStatusModal
          member={statusMember}
          isSelf={statusMember.id === currentUserId}
          onClose={() => setStatusMember(null)}
          onConfirm={handleStatus}
        />
      )}

      {passwordInfo && (
        <EquipeSenhaModal
          member={passwordInfo.member}
          password={passwordInfo.password}
          mode={passwordInfo.mode}
          onClose={() => setPasswordInfo(null)}
        />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Equipe;
