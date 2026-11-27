import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  PlusIcon,
  SearchIcon,
  TimerIcon,
  WrenchIcon,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ChipSelect from "../../components/ui/ChipSelect";
import StatCard from "../../components/ui/StatCard";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { demoApi } from "../../services/demoStore";
import { getMechanic, getMechanics } from "../../services/mechanics";
import { cn } from "../../utils/cn";
import AgendaCancelModal from "./AgendaCancelModal";
import AgendaDeleteModal from "./AgendaDeleteModal";
import AgendaFormModal from "./AgendaFormModal";
import AgendaList from "./AgendaList";
import {
  AGENDA_STATUS,
  PERIODS,
  STATUS_CHIPS,
  agendamentoToValues,
  dayKey,
  emptyAgendamento,
  isActive,
  isToday,
  periodDays,
  periodRange,
} from "./agendaUtils";

const asList = (data) => (Array.isArray(data) ? data : data?.content ?? []);

const normalizeText = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const time = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * Agenda da oficina (rota /agenda). Agendamentos via `/agendamentos`;
 * no modo demonstração usa dados de exemplo em memória (services/demoStore).
 * Os horários são exibidos no fuso local do navegador.
 */
function Agenda() {
  const { isDemo } = useAuth();
  const { toast, showToast, dismissToast } = useToast();
  const source = isDemo ? demoApi : api;

  const [period, setPeriod] = useState("7dias");
  const [day, setDay] = useState("");
  const [search, setSearch] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [status, setStatus] = useState("todos");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await source.agendamentos.list({ ...periodRange(period), page: 0, size: 200 });
      setItems(asList(data));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [source, period]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  /* Busca e mecânico valem para tudo; dia e situação filtram a lista. */
  const scope = useMemo(() => {
    const term = normalizeText(search.trim());
    return items.filter((item) => {
      if (mechanic && String(item.mecanicoId ?? "") !== mechanic) return false;
      if (!term) return true;
      return [item.titulo, item.descricao, getMechanic(item.mecanicoId)?.name].some((field) => normalizeText(field).includes(term));
    });
  }, [items, search, mechanic]);

  const dayScope = useMemo(() => (day ? scope.filter((item) => dayKey(item.inicio) === day) : scope), [scope, day]);
  const counts = useMemo(
    () =>
      STATUS_CHIPS.reduce((acc, chip) => {
        acc[chip.key] = chip.key === "todos" ? dayScope.length : dayScope.filter((item) => item.status === chip.key).length;
        return acc;
      }, {}),
    [dayScope],
  );
  const visible = useMemo(
    () => (status === "todos" ? dayScope : dayScope.filter((item) => item.status === status)),
    [dayScope, status],
  );

  const days = useMemo(() => (period === "7dias" ? periodDays(period) : []), [period]);
  const perDay = useMemo(
    () =>
      scope.filter(isActive).reduce((acc, item) => {
        const key = dayKey(item.inicio);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    [scope],
  );

  /* Indicadores (sempre sobre o período carregado, sem os filtros da lista). */
  const stats = useMemo(() => {
    const today = items.filter((item) => isToday(item.inicio) && item.status !== "CANCELADO");
    const nowMs = new Date().getTime();
    const upcoming = items
      .filter((item) => isActive(item) && item.status !== "EM_ANDAMENTO" && new Date(item.inicio).getTime() >= nowMs)
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0];
    return {
      today: today.length,
      todayDone: today.filter((item) => item.status === "CONCLUIDO").length,
      toConfirm: items.filter((item) => item.status === "AGENDADO").length,
      running: items.filter((item) => item.status === "EM_ANDAMENTO").length,
      upcoming,
    };
  }, [items]);

  const mechanicOptions = getMechanics().map((item) => ({ value: String(item.apiId ?? item.id), label: item.name }));
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? "";

  const changePeriod = (value) => {
    setPeriod(value);
    setDay("");
  };

  const run = async (item, action, message, tone) => {
    setBusyId(item.id);
    try {
      await action();
      showToast(message, tone);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const advance = (item, next) =>
    run(item, () => source.agendamentos.changeStatus(item.id, next.value), `${item.titulo}: ${AGENDA_STATUS[next.value].label.toLowerCase()}.`).catch(
      () => {
        // O aviso global da API mostra o motivo da falha.
      },
    );

  const cancel = (item) => run(item, () => source.agendamentos.changeStatus(item.id, "CANCELADO"), "Agendamento cancelado.", "warning");
  const remove = (item) => run(item, () => source.agendamentos.remove(item.id), "Agendamento excluído.", "warning");

  const save = async (payload) => {
    if (modal.item) {
      await source.agendamentos.update(modal.item.id, payload);
      showToast("Agendamento atualizado.");
    } else {
      await source.agendamentos.create(payload);
      showToast("Agendamento criado.");
    }
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Agenda da Oficina</h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
              {stats.today} {stats.today === 1 ? "horário hoje" : "horários hoje"}
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Horários reservados para serviços, mecânicos e boxes, com confirmação e acompanhamento do atendimento
          </p>
        </div>
        <Button icon={PlusIcon} size="lg" onClick={() => setModal({ type: "form", item: null })} className="w-full sm:w-auto">
          Novo Agendamento
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDaysIcon}
          iconClassName="bg-blue-100 text-blue-600"
          label="Hoje"
          value={stats.today}
          note={`${stats.todayDone} ${stats.todayDone === 1 ? "concluído" : "concluídos"}`}
        />
        <StatCard
          icon={CalendarClockIcon}
          iconClassName={stats.toConfirm ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}
          label="A confirmar"
          value={stats.toConfirm}
          note="ligue ou mande WhatsApp ao cliente"
        />
        <StatCard
          icon={WrenchIcon}
          iconClassName="bg-indigo-100 text-indigo-700"
          label="Em andamento"
          value={stats.running}
          note="veículos sendo atendidos"
        />
        <StatCard
          icon={TimerIcon}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="Próximo horário"
          value={stats.upcoming ? time(stats.upcoming.inicio) : "—"}
          note={<span className="line-clamp-1">{stats.upcoming ? stats.upcoming.titulo : "nenhum horário pendente"}</span>}
        />
      </div>

      <Card className="overflow-hidden p-0!">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div role="group" aria-label="Período" className="flex shrink-0 rounded-lg bg-blue-50 p-1">
              {PERIODS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={period === item.value}
                  onClick={() => changePeriod(item.value)}
                  className={cn(
                    "flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    period === item.value ? "bg-white font-bold text-blue-700 shadow-sm" : "font-medium text-slate-700 hover:bg-white/60",
                  )}
                >
                  {item.short}
                </button>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por serviço, veículo, placa ou mecânico..."
                aria-label="Pesquisar agendamentos"
                className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <ChipSelect icon={WrenchIcon} label="Mecânico" allLabel="TODOS" value={mechanic} options={mechanicOptions} onChange={setMechanic} />
          </div>

          {days.length > 0 && (
            <div role="group" aria-label="Filtrar por dia" className="grid grid-cols-7 gap-1.5">
              {days.map((item) => {
                const active = day === item.key;
                const count = perDay[item.key] ?? 0;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${item.weekday} ${item.day}: ${count} ${count === 1 ? "horário" : "horários"}`}
                    onClick={() => setDay(active ? "" : item.key)}
                    className={cn(
                      "flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50",
                    )}
                  >
                    <span className={cn("text-[10px] font-bold uppercase", active ? "text-blue-100" : "text-slate-500")}>
                      {isToday(new Date(`${item.key}T12:00`).toISOString()) ? "Hoje" : item.weekday}
                    </span>
                    <span className="text-lg font-extrabold leading-tight">{item.day}</span>
                    <span className={cn("text-[10px] font-semibold", active ? "text-white" : count ? "text-blue-700" : "text-slate-400")}>
                      {count ? (
                        <>
                          {count}
                          <span className="hidden sm:inline"> {count === 1 ? "horário" : "horários"}</span>
                        </>
                      ) : (
                        "livre"
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                aria-pressed={status === chip.key}
                onClick={() => setStatus(chip.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  status === chip.key ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
                )}
              >
                {chip.dot && <span className={cn("size-2 rounded-full", status === chip.key ? "bg-white" : chip.dot)} />}
                {chip.label} ({counts[chip.key] ?? 0})
              </button>
            ))}
          </div>
        </div>

        <div aria-busy={loading}>
          {loading && items.length === 0 ? (
            <p className="px-4 py-14 text-center text-sm text-slate-500">Carregando agenda...</p>
          ) : loadError && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
              <p className="text-sm font-bold text-slate-900">Não foi possível carregar a agenda</p>
              <Button variant="outline" onClick={load}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <AgendaList
              items={visible}
              busyId={busyId}
              onNext={advance}
              onCancel={(item) => setModal({ type: "cancel", item })}
              onEdit={(item) => setModal({ type: "form", item })}
              onDelete={(item) => setModal({ type: "delete", item })}
              emptyText="Troque o período ou os filtros, ou cadastre um novo horário."
            />
          )}
        </div>

        <div className="border-t border-slate-200 bg-blue-50/60 px-4 py-3">
          <p className="text-xs text-slate-600" aria-live="polite">
            Mostrando <strong className="text-slate-900">{visible.length}</strong> de{" "}
            <strong className="text-slate-900">{items.length}</strong> agendamentos em {periodLabel.toLowerCase()}
          </p>
        </div>
      </Card>

      {modal?.type === "form" && (
        <AgendaFormModal
          item={modal.item}
          items={items}
          initialValues={modal.item ? agendamentoToValues(modal.item) : emptyAgendamento()}
          onClose={() => setModal(null)}
          onSubmit={save}
        />
      )}
      {modal?.type === "cancel" && <AgendaCancelModal item={modal.item} onClose={() => setModal(null)} onConfirm={cancel} />}
      {modal?.type === "delete" && <AgendaDeleteModal item={modal.item} onClose={() => setModal(null)} onConfirm={remove} />}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Agenda;
