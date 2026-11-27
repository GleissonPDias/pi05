import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BellIcon,
  BellRingIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  FilePlusIcon,
  FileXIcon,
  HourglassIcon,
  InfoIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useClientes } from "../../hooks/useClientes";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { api } from "../../services/api";
import { demoApi } from "../../services/demoStore";
import { getMechanic } from "../../services/mechanics";
import { cn } from "../../utils/cn";
import { CATEGORIES, buildNotifications, loadReadIds, saveReadIds } from "./notificationUtils";

const REFRESH_MS = 2 * 60_000;

const KIND_STYLE = {
  agenda: { icon: CalendarCheckIcon, className: "bg-emerald-100 text-emerald-700", label: "Agenda" },
  "agenda-confirm": { icon: CalendarClockIcon, className: "bg-blue-100 text-blue-700", label: "Agenda" },
  "quote-new": { icon: FilePlusIcon, className: "bg-indigo-100 text-indigo-700", label: "Orçamento novo" },
  "quote-expiring": { icon: HourglassIcon, className: "bg-amber-100 text-amber-700", label: "Orçamento expirando" },
  "quote-expired": { icon: FileXIcon, className: "bg-red-100 text-red-600", label: "Orçamento vencido" },
  system: { icon: InfoIcon, className: "bg-slate-100 text-slate-600", label: "Sistema" },
};

/** Início do dia atual (ISO) e o fim de amanhã, para buscar só a agenda que interessa ao sino. */
function agendaWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return { inicio: start.toISOString(), fim: end.toISOString() };
}

/**
 * Sino de notificações ao lado do perfil.
 * Junta avisos da agenda (próximos horários), dos orçamentos (novos, expirando e
 * vencidos) e as notificações da API. O contador mostra o que ainda não foi lido.
 */
function NotificationsMenu() {
  const { isDemo, hasPermission } = useAuth();
  const { quotes = [] } = useOrcamentos();
  const { clients = [] } = useClientes();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const panelId = useId();
  const titleId = useId();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("todas");
  const [agenda, setAgenda] = useState([]);
  const [system, setSystem] = useState([]);
  const [readIds, setReadIds] = useState(loadReadIds);
  const [now, setNow] = useState(() => new Date().getTime());
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const canAgenda = !hasPermission || hasPermission("AGENDA");
  const canQuotes = !hasPermission || hasPermission("ORCAMENTOS");

  const refresh = useCallback(async () => {
    setNow(new Date().getTime());
    const source = isDemo ? demoApi : api;
    const [agendaResult, systemResult] = await Promise.allSettled([
      canAgenda ? source.agendamentos.list({ ...agendaWindow(), page: 0, size: 50 }, { background: true }) : [],
      isDemo ? [] : api.notificacoes.list({ limite: 15 }),
    ]);
    if (agendaResult.status === "fulfilled") {
      const data = agendaResult.value;
      setAgenda(Array.isArray(data) ? data : data?.content ?? []);
    }
    if (systemResult.status === "fulfilled") setSystem(Array.isArray(systemResult.value) ? systemResult.value : []);
  }, [isDemo, canAgenda]);

  // Atualiza ao trocar de tela e a cada 2 minutos.
  useEffect(() => {
    queueMicrotask(refresh);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh, pathname]);

  const clientsById = useMemo(() => new Map(clients.map((client) => [String(client.id), client.name])), [clients]);

  const notifications = useMemo(
    () =>
      buildNotifications({
        agenda,
        quotes: canQuotes ? quotes : [],
        system,
        mechanicName: (id) => getMechanic(id)?.name ?? null,
        clientName: (id) => clientsById.get(String(id)) ?? null,
        now,
      }).map((item) => ({ ...item, read: item.category === "sistema" ? item.apiRead || readIds.has(item.id) : readIds.has(item.id) })),
    [agenda, quotes, canQuotes, system, clientsById, readIds, now],
  );

  const unread = notifications.filter((item) => !item.read).length;
  const categories = CATEGORIES.filter((item) => item.key !== "sistema" || !isDemo).map((item) => ({
    ...item,
    count: notifications.filter((n) => !n.read && (item.key === "todas" || n.category === item.key)).length,
  }));
  const visible = notifications.filter((item) => category === "todas" || item.category === category);

  // Fecha ao clicar fora ou com Esc (devolvendo o foco ao sino).
  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const markRead = (ids) => {
    setReadIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      saveReadIds(next);
      return next;
    });
  };

  const openItem = async (item) => {
    markRead([item.id]);
    setOpen(false);
    if (item.apiId && !item.apiRead) {
      try {
        await api.notificacoes.markRead(item.apiId);
      } catch {
        // Sem conexão: fica marcado como lido só neste navegador.
      }
    }
    if (item.link) navigate(item.link);
  };

  const markAll = async () => {
    markRead(notifications.map((item) => item.id));
    if (!isDemo && system.some((item) => !item.lida)) {
      try {
        await api.notificacoes.markAllRead();
        setSystem((current) => current.map((item) => ({ ...item, lida: true })));
      } catch {
        // Mantém a marcação local.
      }
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) queueMicrotask(refresh);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread ? `Notificações: ${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Notificações"}
        title="Notificações"
        className={cn(
          "relative grid size-10 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          open && "bg-blue-50 text-blue-700",
        )}
      >
        {unread ? <BellRingIcon className="size-5" /> : <BellIcon className="size-5" />}
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className="fixed inset-x-2 top-16 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h2 id={titleId} className="text-sm font-bold text-slate-900">
              Notificações
              {unread > 0 && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700">{unread} novas</span>}
            </h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 rounded text-xs font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <CheckCheckIcon className="size-3.5" aria-hidden="true" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div role="group" aria-label="Filtrar notificações" className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
            {categories.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={category === item.key}
                onClick={() => setCategory(item.key)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  category === item.key ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
                )}
              >
                {item.label}
                {item.count > 0 && ` (${item.count})`}
              </button>
            ))}
          </div>

          <ul className="max-h-[min(26rem,calc(100vh-12rem))] divide-y divide-slate-100 overflow-y-auto">
            {visible.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <BellIcon className="size-5" />
                </span>
                <p className="text-sm font-bold text-slate-900">Tudo em dia</p>
                <p className="text-xs text-slate-500">Nenhum aviso nesta categoria no momento.</p>
              </li>
            )}
            {visible.map((item) => {
              const style = KIND_STYLE[item.kind] ?? KIND_STYLE.system;
              const Icon = style.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                      !item.read && "bg-blue-50/50",
                    )}
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", style.className)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.title}</span>
                        {!item.read && (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600">
                            <span className="sr-only">Não lida</span>
                          </span>
                        )}
                      </span>
                      {item.message && <span className="line-clamp-2 text-xs text-slate-700">{item.message}</span>}
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        <span className="font-semibold">{style.label}</span>
                        {item.meta && ` · ${item.meta}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
