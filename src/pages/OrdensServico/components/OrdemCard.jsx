import { Link } from "react-router-dom";
import { ArrowRightLeftIcon, ClockIcon, EyeIcon, MessageCircleIcon, PackageSearchIcon, TriangleAlertIcon } from "lucide-react";
import { useEstoque } from "../../../hooks/useEstoque";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import { APPROVAL_CHANNELS, STATUS, STATUS_ORDER } from "../constants";
import {
  boxName,
  firstName,
  formatOrderNumber,
  isOverdue,
  mechanicName,
  missingParts,
  orderTitle,
  orderTotals,
  quotedProgress,
  servicesProgress,
  timeShort,
} from "../ordemUtils";
import { PriorityBadge, ProgressBar } from "./OrdemBadges";

/** Texto à direita do nome do cliente: box, canal de aprovação ou responsável. */
function cardMeta(order) {
  if (order.boxId && ["execucao", "aguardando_pecas"].includes(order.status)) {
    return { text: `${boxName(order.boxId)} • ${firstName(mechanicName(order.mechanicId))}`, tone: "text-blue-700" };
  }
  if (order.status === "aprovacao" && order.approval.sentAt) {
    return {
      text: order.approval.viewedAt ? "Visualizado" : `Enviado ${APPROVAL_CHANNELS[order.approval.channel] ?? ""}`,
      tone: "text-indigo-700",
    };
  }
  if (order.mechanicId) return { text: firstName(mechanicName(order.mechanicId)), tone: "text-slate-600" };
  return { text: "Triagem", tone: "text-slate-500" };
}

/** Rodapé do card: muda conforme a etapa (vistoria, cotação, aprovação, execução...). */
function CardFooter({ order }) {
  const { partsByCode } = useEstoque();
  const label = "text-xs font-medium text-slate-600";

  switch (order.status) {
    case "aberta":
      return <p className={label}>{order.inspection.done ? "Vistoria concluída" : "Check-in pendente"}</p>;
    case "orcamento": {
      const { quoted, total, pct } = quotedProgress(order);
      return total ? (
        <div className="min-w-0 flex-1">
          <ProgressBar value={pct} tone="amber" label="Peças cotadas" />
          <p className="mt-1 text-xs font-semibold text-amber-700">
            {quoted}/{total} peças cotadas
          </p>
        </div>
      ) : (
        <p className={label}>Diagnóstico em andamento</p>
      );
    }
    case "aprovacao":
      return (
        <p className={cn(label, "inline-flex items-center gap-1.5")}>
          {order.approval.sentAt ? (
            <>
              <ClockIcon className="size-3.5 shrink-0" />
              Enviado {timeShort(order.approval.sentAt).toLowerCase()}
            </>
          ) : (
            <>
              <MessageCircleIcon className="size-3.5 shrink-0" />
              Orçamento não enviado
            </>
          )}
        </p>
      );
    case "execucao": {
      const { done, total, pct } = servicesProgress(order);
      return (
        <div className="min-w-0 flex-1">
          <ProgressBar value={pct} label="Serviços concluídos" />
          <p className="mt-1 text-xs font-semibold text-blue-700">
            {done}/{total} concluídos ({pct}%)
          </p>
        </div>
      );
    }
    case "aguardando_pecas": {
      const missing = missingParts(order, partsByCode).length;
      return (
        <p className={cn(label, "inline-flex items-center gap-1.5 text-orange-700")}>
          <PackageSearchIcon className="size-3.5 shrink-0" />
          {missing ? `${missing} peça(s) em falta` : "Aguardando fornecedor"}
        </p>
      );
    }
    case "pronta":
      return <p className={cn(label, "text-emerald-700")}>Pronta {timeShort(order.readyAt).toLowerCase()}</p>;
    case "entregue":
      return <p className={label}>Entregue {timeShort(order.deliveredAt).toLowerCase()}</p>;
    case "cancelada":
      return <p className={cn(label, "line-clamp-2 text-red-700")}>{order.cancelReason}</p>;
    default:
      return null;
  }
}

/**
 * Card de uma OS no quadro.
 * - O card inteiro é um link para os detalhes (link "esticado")
 * - Arrastável no desktop; no celular use o botão "Mover"
 */
function OrdemCard({ order, onMove, onDragStart, onDragEnd, dragging }) {
  const vehicle = order.vehicle;
  const meta = cardMeta(order);
  const overdue = isOverdue(order);
  const closed = order.status === "entregue" || order.status === "cancelada";

  return (
    <article
      draggable={!closed}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(order.number));
        event.dataTransfer.effectAllowed = "move";
        onDragStart(order.number);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition",
        "hover:border-blue-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500",
        !closed && "cursor-grab active:cursor-grabbing",
        STATUS[order.status].accent,
        dragging && "opacity-40",
        closed && "opacity-80",
      )}
    >
      <div className="flex items-center gap-2">
        <Link
          to={`/ordens-de-servico/${order.number}`}
          draggable={false}
          className="text-sm font-extrabold text-blue-700 after:absolute after:inset-0 after:rounded-xl focus:outline-none"
        >
          {formatOrderNumber(order.number)}
        </Link>
        {overdue ? (
          <span
            title="Passou da previsão de entrega"
            className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-red-700"
          >
            <TriangleAlertIcon className="size-3" />
            Atrasada
          </span>
        ) : (
          <span className="whitespace-nowrap text-[11px] text-slate-500">• {timeShort(order.openedAt)}</span>
        )}
        <PriorityBadge priority={order.priority} className="ml-auto" />
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        {vehicle && <MercosulPlate plate={vehicle.plate} size="xs" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Veículo removido"}
          </p>
          <p className="truncate text-xs text-slate-600">{orderTitle(order)}</p>
        </div>
        {/* Ações acima do link esticado (z-10); no desktop aparecem ao passar o mouse */}
        <div className="relative z-10 flex shrink-0 gap-1 lg:hidden lg:group-focus-within:flex lg:group-hover:flex">
          {!closed && (
            <label
              title="Mover para outra etapa"
              className="relative grid size-7 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 focus-within:ring-2 focus-within:ring-blue-500"
            >
              <ArrowRightLeftIcon className="size-3.5" />
              <select
                value=""
                onChange={(event) => onMove(order, event.target.value)}
                aria-label={`Mover OS ${formatOrderNumber(order.number)} para outra etapa`}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="" disabled>
                  Mover para...
                </option>
                {STATUS_ORDER.filter((key) => key !== order.status).map((key) => (
                  <option key={key} value={key}>
                    {STATUS[key].label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Link
            to={`/ordens-de-servico/${order.number}`}
            draggable={false}
            title="Abrir OS"
            aria-label={`Abrir OS ${formatOrderNumber(order.number)}`}
            className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-blue-700"
          >
            <EyeIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="truncate text-slate-700">{order.client?.name ?? "Sem cliente"}</span>
        <span className={cn("shrink-0 font-semibold", meta.tone)}>{meta.text}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-2.5">
        <CardFooter order={order} />
        <p className="shrink-0 text-sm font-extrabold text-slate-900">
          {order.parts.length || order.services.length ? formatBRL(orderTotals(order).total) : "—"}
        </p>
      </div>

    </article>
  );
}

export default OrdemCard;
