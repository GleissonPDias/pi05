import { formatBRL } from "../../../utils/format";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import { formatOrderNumber, orderTitle, orderTotals } from "../ordemUtils";
import { StatusBadge } from "./OrdemBadges";

/** Resumo da OS usado nos pop-ups de cancelamento e entrega. */
function OrdemSummary({ order }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
      {order.vehicle && <MercosulPlate plate={order.vehicle.plate} size="lg" />}
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <p className="text-sm font-extrabold text-blue-700">{formatOrderNumber(order.number)}</p>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm font-bold text-slate-900">
          {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : "—"}
        </p>
        <p className="text-xs text-slate-600">
          {orderTitle(order)} • {order.client?.name ?? "Sem cliente"}
        </p>
      </div>
      <div className="text-center sm:text-right">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</p>
        <p className="text-lg font-extrabold text-slate-900">{formatBRL(orderTotals(order).total)}</p>
      </div>
    </div>
  );
}

export default OrdemSummary;
