import { CalendarX2Icon, CalendarSearchIcon, PencilIcon, Trash2Icon, WarehouseIcon, WrenchIcon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getBox, getMechanic } from "../../services/mechanics";
import { cn } from "../../utils/cn";
import { AGENDA_STATUS, NEXT_STATUS, formatDayHeading, groupByDay, isActive, isHappening } from "./agendaUtils";

const CANCELABLE = ["AGENDADO", "CONFIRMADO"];

const actionButton =
  "grid size-8 place-items-center rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40";

const time = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Barra lateral colorida de cada horário, conforme a situação. */
const ACCENT = {
  AGENDADO: "bg-blue-500",
  CONFIRMADO: "bg-emerald-500",
  EM_ANDAMENTO: "bg-indigo-500",
  CONCLUIDO: "bg-emerald-700",
  CANCELADO: "bg-slate-300",
  NAO_COMPARECEU: "bg-red-500",
};

function AgendaItem({ item, busy, onNext, onCancel, onEdit, onDelete }) {
  const status = AGENDA_STATUS[item.status] ?? { label: item.status, variant: "slate" };
  const next = NEXT_STATUS[item.status];
  const mechanic = getMechanic(item.mecanicoId);
  const box = getBox(item.boxId);
  const happening = isHappening(item);

  return (
    <li className={cn("relative flex flex-col gap-3 py-4 pl-4 sm:flex-row sm:items-center", !isActive(item) && "opacity-70")}>
      <span aria-hidden="true" className={cn("absolute inset-y-3 left-0 w-1 rounded-full", ACCENT[item.status] ?? "bg-slate-300")} />

      <div className="flex min-w-0 flex-1 gap-4">
        <div className="w-16 shrink-0 leading-tight">
          <p className="text-base font-extrabold text-slate-900">{time(item.inicio)}</p>
          <p className="text-xs text-slate-500">até {time(item.fim)}</p>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">{item.titulo}</p>
            <Badge variant={status.variant}>{status.label}</Badge>
            {happening && <Badge variant="amber">Acontecendo agora</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <WrenchIcon className="size-3.5 text-slate-400" aria-hidden="true" />
              {mechanic?.name ?? "Mecânico a definir"}
            </span>
            <span className="inline-flex items-center gap-1">
              <WarehouseIcon className="size-3.5 text-slate-400" aria-hidden="true" />
              {box?.name ?? "Box a definir"}
            </span>
          </p>
          {item.descricao && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.descricao}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:justify-end">
        {next && (
          <Button size="sm" variant="soft" disabled={busy} onClick={() => onNext(item, next)} className="mr-1">
            {next.label}
          </Button>
        )}
        {CANCELABLE.includes(item.status) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(item)}
            aria-label={`Cancelar agendamento: ${item.titulo}`}
            title="Cancelar agendamento"
            className={cn(actionButton, "hover:bg-amber-50 hover:text-amber-700")}
          >
            <CalendarX2Icon className="size-4" />
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onEdit(item)}
          aria-label={`Editar agendamento: ${item.titulo}`}
          title="Editar agendamento"
          className={cn(actionButton, "hover:bg-blue-50 hover:text-blue-700")}
        >
          <PencilIcon className="size-4" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(item)}
          aria-label={`Excluir agendamento: ${item.titulo}`}
          title="Excluir agendamento"
          className={cn(actionButton, "hover:bg-red-50 hover:text-red-600")}
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </li>
  );
}

/** Agendamentos agrupados por dia. */
function AgendaList({ items, busyId, onNext, onCancel, onEdit, onDelete, emptyText }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
          <CalendarSearchIcon className="size-6" />
        </span>
        <p className="text-sm font-bold text-slate-900">Nenhum agendamento encontrado</p>
        <p className="max-w-xs text-xs text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      {groupByDay(items).map(([day, dayItems]) => (
        <section key={day} aria-labelledby={`agenda-dia-${day}`} className="border-b border-slate-100 py-3 last:border-b-0">
          <h2
            id={`agenda-dia-${day}`}
            className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-blue-700"
          >
            <span className="first-letter:uppercase">{formatDayHeading(day)}</span>
            <span className="font-semibold normal-case tracking-normal text-slate-500">
              {dayItems.length} {dayItems.length === 1 ? "horário" : "horários"}
            </span>
          </h2>
          <ul className="divide-y divide-slate-100">
            {dayItems.map((item) => (
              <AgendaItem
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onNext={onNext}
                onCancel={onCancel}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default AgendaList;
