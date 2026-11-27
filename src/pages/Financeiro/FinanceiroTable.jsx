import { BanIcon, CircleCheckBigIcon, SearchXIcon, Trash2Icon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/dates";
import { formatBRL } from "../../utils/format";
import { KIND, KIND_CONFIG, STATUS_LABEL, STATUS_VARIANT, dueInfo, formaLabel, isOverdue } from "./financeiroUtils";

const columns = [
  { label: "Descrição", className: "w-[34%]" },
  { label: "Categoria / forma", className: "w-[16%]" },
  { label: "Vencimento", className: "w-[16%]" },
  { label: "Valor", className: "w-[12%] text-right" },
  { label: "Situação", className: "w-[11%]" },
  { label: "Ações", className: "w-[11%] text-right" },
];

const toneClass = {
  red: "text-red-600",
  amber: "text-amber-700",
  green: "text-emerald-700",
  slate: "text-slate-500",
};

const actionButton =
  "grid size-8 place-items-center rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40";

function EmptyState({ kind }) {
  const config = KIND_CONFIG[kind];
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
        <SearchXIcon className="size-6" />
      </span>
      <p className="text-sm font-bold text-slate-900">{config.emptyTitle}</p>
      <p className="max-w-xs text-xs text-slate-500">{config.emptyText}</p>
    </div>
  );
}

function Description({ item }) {
  return (
    <div className="min-w-0">
      <p className="line-clamp-2 font-bold text-slate-900 lg:line-clamp-none lg:truncate" title={item.descricao}>
        {item.descricao}
      </p>
      {item.observacoes && (
        <p className="truncate text-xs text-slate-500" title={item.observacoes}>
          {item.observacoes}
        </p>
      )}
    </div>
  );
}

function Detail({ item, kind }) {
  if (kind === KIND.PAGAR) return <span className="text-slate-700">{item.categoria || "—"}</span>;
  const parcelas = Number(item.parcelas) > 1 ? ` · ${item.parcelas}x` : "";
  return (
    <span className="text-slate-700">
      {formaLabel(item.formaPagamento)}
      {parcelas}
    </span>
  );
}

function Due({ item }) {
  const info = dueInfo(item);
  return (
    <div className="leading-tight">
      <p className={cn("font-semibold", isOverdue(item) ? "text-red-600" : "text-slate-800")}>{formatDate(String(item.vencimento ?? "").slice(0, 10))}</p>
      <p className={cn("text-xs font-medium", toneClass[info.tone])}>{info.text}</p>
    </div>
  );
}

function Status({ item }) {
  if (isOverdue(item)) return <Badge variant="red">Vencido</Badge>;
  return <Badge variant={STATUS_VARIANT[item.status] ?? "slate"}>{STATUS_LABEL[item.status] ?? item.status}</Badge>;
}

function Value({ item, kind }) {
  return (
    <span className={cn("whitespace-nowrap font-bold", kind === KIND.RECEBER ? "text-emerald-700" : "text-slate-900")}>
      {kind === KIND.PAGAR && "− "}
      {formatBRL(Number(item.valor) || 0)}
    </span>
  );
}

function Actions({ item, kind, busy, onPaid, onCancel, onDelete }) {
  const config = KIND_CONFIG[kind];
  const pending = item.status === "PENDENTE";
  return (
    <div className="flex items-center justify-end gap-1">
      {pending && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onPaid(item)}
            aria-label={`${config.paidAction}: ${item.descricao}`}
            title={config.paidAction}
            className={cn(actionButton, "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700")}
          >
            <CircleCheckBigIcon className="size-4" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(item)}
            aria-label={`Cancelar lançamento: ${item.descricao}`}
            title="Cancelar lançamento"
            className={cn(actionButton, "hover:bg-amber-50 hover:text-amber-700")}
          >
            <BanIcon className="size-4" />
          </button>
        </>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(item)}
        aria-label={`Excluir lançamento: ${item.descricao}`}
        title="Excluir lançamento"
        className={cn(actionButton, "hover:bg-red-50 hover:text-red-600")}
      >
        <Trash2Icon className="size-4" />
      </button>
    </div>
  );
}

/**
 * Lista de lançamentos (recebimentos ou despesas).
 * - lg+: tabela
 * - abaixo de lg: um card por lançamento
 */
function FinanceiroTable({ items, kind, busyId, onPaid, onCancel, onDelete }) {
  if (items.length === 0) return <EmptyState kind={kind} />;
  const actions = { kind, onPaid, onCancel, onDelete };

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">
            {kind === KIND.RECEBER ? "Contas a receber" : "Contas a pagar"} da oficina
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60">
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={`${column.className} px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "transition-colors hover:bg-blue-50/40",
                  isOverdue(item) && "bg-red-50/40",
                  item.status === "CANCELADO" && "text-slate-500 opacity-70",
                )}
              >
                <td className="px-4 py-3.5 align-middle">
                  <Description item={item} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <Detail item={item} kind={kind} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <Due item={item} />
                </td>
                <td className="px-4 py-3.5 text-right align-middle">
                  <Value item={item} kind={kind} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <Status item={item} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <Actions item={item} busy={busyId === item.id} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {items.map((item) => (
          <li key={item.id} className={cn("flex flex-col gap-3 p-4", isOverdue(item) && "bg-red-50/40")}>
            <div className="flex items-start justify-between gap-2">
              <Description item={item} />
              <Actions item={item} busy={busyId === item.id} {...actions} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Valor</dt>
                <dd className="text-sm">
                  <Value item={item} kind={kind} />
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Situação</dt>
                <dd>
                  <Status item={item} />
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Vencimento</dt>
                <dd>
                  <Due item={item} />
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {kind === KIND.PAGAR ? "Categoria" : "Forma"}
                </dt>
                <dd>
                  <Detail item={item} kind={kind} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export default FinanceiroTable;
