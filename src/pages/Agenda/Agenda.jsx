import { useCallback, useEffect, useState } from "react";
import { CalendarDaysIcon, ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SelectField from "../../components/ui/SelectField";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { getBox, getMechanic } from "../../services/mechanics";
import { cn } from "../../utils/cn";
import AgendaDeleteModal from "./AgendaDeleteModal";
import AgendaFormModal from "./AgendaFormModal";
import {
  AGENDA_STATUS,
  NEXT_STATUS,
  PERIODS,
  agendamentoToValues,
  emptyAgendamento,
  formatDayHeading,
  formatTimeRange,
  groupByDay,
  periodRange,
} from "./agendaUtils";

const CANCELABLE = ["AGENDADO", "CONFIRMADO"];

function AgendaItem({ item, busy, onNext, onCancel, onEdit, onDelete }) {
  const status = AGENDA_STATUS[item.status] ?? { label: item.status, variant: "slate" };
  const next = NEXT_STATUS[item.status];
  const mechanic = item.mecanicoId ? getMechanic(item.mecanicoId) : null;
  const box = item.boxId ? getBox(item.boxId) : null;
  const finished = item.status === "CONCLUIDO" || item.status === "CANCELADO" || item.status === "NAO_COMPARECEU";

  return (
    <li className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between", finished && "opacity-70")}>
      <div className="flex min-w-0 gap-4">
        <div className="w-28 shrink-0 text-sm font-bold text-slate-700">{formatTimeRange(item.inicio, item.fim)}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-slate-900">{item.titulo}</p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-xs text-slate-500">
            {[mechanic?.name && `Mecânico: ${mechanic.name}`, box?.name && `Box: ${box.name}`]
              .filter(Boolean)
              .join(" • ") || "Sem mecânico ou box definido"}
          </p>
          {item.descricao && <p className="truncate text-xs text-slate-500">{item.descricao}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {next && (
          <Button size="sm" variant="soft" disabled={busy} onClick={() => onNext(item, next)}>
            {next.label}
          </Button>
        )}
        {CANCELABLE.includes(item.status) && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onCancel(item)}>
            Cancelar
          </Button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onEdit(item)}
          aria-label={`Editar ${item.titulo}`}
          title="Editar"
          className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
        >
          <PencilIcon className="size-4" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(item)}
          aria-label={`Excluir ${item.titulo}`}
          title="Excluir"
          className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </li>
  );
}

/**
 * Agenda de serviços (rota /agenda). Agendamentos via `/agendamentos`.
 * Os horários são exibidos no fuso local do navegador.
 */
function Agenda() {
  const { isDemo } = useAuth();
  const { toast, showToast, dismissToast } = useToast();

  const [period, setPeriod] = useState("7dias");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(() => !isDemo);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.agendamentos.list(periodRange(period));
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // O banner global já mostra o erro da API.
    } finally {
      setLoading(false);
    }
  }, [isDemo, period]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const runAction = async (item, action, message) => {
    setBusyId(item.id);
    try {
      await action();
      showToast(message);
      await load();
    } catch {
      // Erro exibido pelo banner global da API.
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = (item, status) =>
    runAction(item, () => api.agendamentos.changeStatus(item.id, status.value), `${item.titulo}: ${AGENDA_STATUS[status.value].label.toLowerCase()}.`);

  const cancel = (item) => runAction(item, () => api.agendamentos.changeStatus(item.id, "CANCELADO"), "Agendamento cancelado.");

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await api.agendamentos.remove(item.id);
      showToast("Agendamento excluído.", "warning");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const save = async (payload) => {
    if (modal.item) {
      await api.agendamentos.update(modal.item.id, payload);
      showToast("Agendamento atualizado.");
    } else {
      await api.agendamentos.create(payload);
      showToast("Agendamento criado.");
    }
    await load();
  };

  const groups = groupByDay(items);
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav
            aria-label="Trilha"
            className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Operação <ChevronRightIcon className="size-3" />{" "}
            <span className="text-blue-700">Agenda</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
            {isDemo && <Badge variant="slate">Demonstração</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Horários reservados para serviços, mecânicos e boxes da oficina.
          </p>
        </div>
        {!isDemo && (
          <Button icon={PlusIcon} size="lg" onClick={() => setModal({ open: true, item: null })} className="w-full sm:w-auto">
            Novo agendamento
          </Button>
        )}
      </div>

      {isDemo ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            A agenda depende da API. No modo demonstração nenhum agendamento é exibido ou gravado.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0!">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-blue-50/60 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:w-64">
              <SelectField
                label="Período"
                options={PERIODS.map(({ value, label }) => ({ value, label }))}
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              />
            </div>
            <p className="text-xs text-slate-600" aria-live="polite">
              <strong className="text-slate-900">{items.length}</strong> agendamento(s) em {periodLabel.toLowerCase()}
            </p>
          </div>

          <div className="px-4">
            {loading && items.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Carregando agenda...</p>}

            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <CalendarDaysIcon className="size-6" />
                </span>
                <p className="text-sm font-bold text-slate-900">Nenhum agendamento no período</p>
                <p className="max-w-md text-xs text-slate-500">Cadastre um horário para organizar a chegada dos veículos.</p>
              </div>
            )}

            {groups.map(([day, dayItems]) => (
              <section key={day} aria-label={formatDayHeading(day)} className="border-b border-slate-100 py-4 last:border-b-0">
                <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700 capitalize">
                  {formatDayHeading(day)}
                </h2>
                <ul className="divide-y divide-slate-100">
                  {dayItems.map((item) => (
                    <AgendaItem
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onNext={changeStatus}
                      onCancel={cancel}
                      onEdit={(target) => setModal({ open: true, item: target })}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Card>
      )}

      {modal.open && (
        <AgendaFormModal
          item={modal.item}
          initialValues={modal.item ? agendamentoToValues(modal.item) : emptyAgendamento()}
          onClose={() => setModal({ open: false, item: null })}
          onSubmit={save}
        />
      )}

      {deleteTarget && (
        <AgendaDeleteModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Agenda;
