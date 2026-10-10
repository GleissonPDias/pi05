import { Link } from "react-router-dom";
import { ArrowLeftIcon, CircleCheckIcon, CircleSlashIcon, ClockIcon, PrinterIcon, Undo2Icon } from "lucide-react";
import Button from "../../../components/ui/Button";
import { CHANNELS } from "../constants";
import { boxName, formatDateTimeShort, formatOrderNumber } from "../ordemUtils";
import { PriorityBadge } from "../components/OrdemBadges";
import StatusMenu from "./StatusMenu";

/**
 * Cabeçalho da OS: voltar, número, dados de abertura, ações e etapa.
 */
function OrdemHeader({ order, dirty, readOnly, onPrint, onCancel, onSave, onDiscard, onStatusChange }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Link
          to="/ordens-de-servico"
          aria-label="Voltar para o quadro de OS"
          className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">OS {formatOrderNumber(order.number)}</h1>
            <PriorityBadge priority={order.priority} className="px-2 py-1 text-[11px] uppercase tracking-wide" />
            {order.boxId && (
              <span className="rounded bg-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                {boxName(order.boxId)}
              </span>
            )}
            {dirty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                <ClockIcon className="size-3" />
                Alterações não salvas
              </span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
            <span>Aberta em {formatDateTimeShort(order.openedAt)}</span>
            <span aria-hidden="true">•</span>
            <span>
              Operador: <strong className="text-slate-800">{order.openedBy}</strong>
            </span>
            <span aria-hidden="true">•</span>
            <span className="font-semibold text-emerald-700">{CHANNELS[order.channel]}</span>
            {order.quoteId && (
              <>
                <span aria-hidden="true">•</span>
                <Link to={`/orcamentos?busca=${order.quoteId}`} className="font-semibold text-blue-700 hover:underline">
                  Origem: orçamento {order.quoteId}
                </Link>
              </>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={PrinterIcon} onClick={onPrint}>
              Imprimir OS
            </Button>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                icon={CircleSlashIcon}
                onClick={onCancel}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Cancelar OS
              </Button>
            )}
            {dirty && (
              <Button variant="neutral" size="sm" icon={Undo2Icon} onClick={onDiscard}>
                Descartar
              </Button>
            )}
            {!readOnly && (
              <Button size="sm" icon={CircleCheckIcon} onClick={onSave} disabled={!dirty} className="disabled:opacity-50">
                Salvar Ordem
              </Button>
            )}
          </div>
        </div>
      </div>

      <StatusMenu status={order.status} onChange={onStatusChange} disabled={readOnly} />
    </div>
  );
}

export default OrdemHeader;
