import { Link } from "react-router-dom";
import { ChevronRightIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import {
  boxName,
  formatDateTimeShort,
  formatOrderNumber,
  isOverdue,
  mechanicName,
  orderTitle,
  orderTotals,
  timeShort,
} from "../ordemUtils";
import { PriorityBadge, StatusBadge } from "./OrdemBadges";

const columns = [
  { label: "OS", className: "w-[9%]" },
  { label: "Veículo", className: "w-[22%]" },
  { label: "Cliente", className: "w-[16%]" },
  { label: "Etapa", className: "w-[14%]" },
  { label: "Responsável", className: "w-[13%]" },
  { label: "Previsão", className: "w-[12%]" },
  { label: "Total", className: "w-[10%] text-right" },
  { label: "", className: "w-[4%]" },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
        <SearchXIcon className="size-6" />
      </span>
      <p className="text-sm font-bold text-slate-900">Nenhuma OS encontrada</p>
      <p className="max-w-xs text-xs text-slate-500">Revise a busca ou os filtros selecionados.</p>
    </div>
  );
}

function Forecast({ order }) {
  if (order.status === "entregue") {
    return <span className="text-xs text-slate-600">Entregue em {formatDateTimeShort(order.deliveredAt)}</span>;
  }
  if (order.status === "cancelada") return <span className="text-xs text-slate-500">—</span>;
  if (!order.expectedAt) return <span className="text-xs text-slate-500">A definir</span>;
  return (
    <span className={cn("text-xs", isOverdue(order) ? "font-bold text-red-700" : "text-slate-700")}>
      {isOverdue(order) && <TriangleAlertIcon className="mr-1 inline size-3.5 align-[-2px]" />}
      {formatDateTimeShort(order.expectedAt)}
    </span>
  );
}

/** Visão em lista (tabela no desktop e cards no celular). */
function OrdensTable({ orders }) {
  if (orders.length === 0) return <EmptyState />;

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[62rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Lista de ordens de serviço</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60">
              {columns.map((column) => (
                <th
                  key={column.label || "acoes"}
                  scope="col"
                  className={`${column.className} px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600`}
                >
                  {column.label || <span className="sr-only">Abrir</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.number} className="relative transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-3.5">
                  <Link
                    to={`/ordens-de-servico/${order.number}`}
                    className="text-sm font-extrabold text-blue-700 hover:underline"
                  >
                    {formatOrderNumber(order.number)}
                  </Link>
                  <p className="text-[11px] text-slate-500">{timeShort(order.openedAt)}</p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {order.vehicle && <MercosulPlate plate={order.vehicle.plate} size="xs" />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "—"}
                      </p>
                      <p className="truncate text-xs text-slate-600">{orderTitle(order)}</p>
                    </div>
                  </div>
                </td>
                <td className="truncate px-4 py-3.5 text-sm text-slate-800">{order.client?.name ?? "—"}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={order.status} />
                    <PriorityBadge priority={order.priority} />
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-700">
                  <p className="truncate font-semibold">{mechanicName(order.mechanicId) || "A definir"}</p>
                  <p className="text-slate-500">{boxName(order.boxId) || "Sem box"}</p>
                </td>
                <td className="px-4 py-3.5">
                  <Forecast order={order} />
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-900">
                  {formatBRL(orderTotals(order).total)}
                </td>
                <td className="px-2 py-3.5">
                  <Link
                    to={`/ordens-de-servico/${order.number}`}
                    aria-label={`Abrir OS ${formatOrderNumber(order.number)}`}
                    className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {orders.map((order) => (
          <li key={order.number} className="relative p-4">
            <div className="flex items-center gap-2">
              <Link
                to={`/ordens-de-servico/${order.number}`}
                className="text-sm font-extrabold text-blue-700 after:absolute after:inset-0"
              >
                {formatOrderNumber(order.number)}
              </Link>
              <span className="text-[11px] text-slate-500">• {timeShort(order.openedAt)}</span>
              <span className="ml-auto">
                <StatusBadge status={order.status} />
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              {order.vehicle && <MercosulPlate plate={order.vehicle.plate} size="xs" />}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "—"}
                </p>
                <p className="truncate text-xs text-slate-600">
                  {orderTitle(order)} • {order.client?.name ?? "—"}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <Forecast order={order} />
              <span className="text-sm font-bold text-slate-900">{formatBRL(orderTotals(order).total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default OrdensTable;
