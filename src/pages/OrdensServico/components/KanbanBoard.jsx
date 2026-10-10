import { useState } from "react";
import { InboxIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { STATUS, STATUS_ORDER } from "../constants";
import { orderTotals } from "../ordemUtils";
import OrdemCard from "./OrdemCard";

/**
 * Quadro Kanban: uma coluna por etapa.
 * Arraste um card para outra coluna (desktop) ou use o botão "Mover" do card.
 * As regras de cada mudança ficam em canMoveTo (ordemUtils.js).
 */
function KanbanBoard({ orders, hideCanceled, onMove }) {
  const [draggingNumber, setDraggingNumber] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const columns = STATUS_ORDER.filter((status) => !(hideCanceled && status === "cancelada"));
  const dragging = orders.find((order) => order.number === draggingNumber);

  const handleDrop = (event, status) => {
    event.preventDefault();
    setOverColumn(null);
    const number = Number(event.dataTransfer.getData("text/plain"));
    const order = orders.find((item) => item.number === number);
    setDraggingNumber(null);
    if (order && order.status !== status) onMove(order, status);
  };

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:snap-none"
      aria-label="Quadro de ordens de serviço"
    >
      {columns.map((status) => {
        const items = orders.filter((order) => order.status === status);
        const total = items.reduce((sum, order) => sum + orderTotals(order).total, 0);
        const isTarget = dragging && dragging.status !== status;

        return (
          <section
            key={status}
            aria-label={`${STATUS[status].label}: ${items.length} OS`}
            onDragOver={(event) => {
              if (!isTarget) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverColumn(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setOverColumn(null);
            }}
            onDrop={(event) => handleDrop(event, status)}
            className={cn(
              "flex w-[17.5rem] shrink-0 snap-start flex-col rounded-2xl bg-slate-100/80 p-3 transition-colors",
              isTarget && "outline-2 outline-offset-2 outline-dashed outline-blue-300",
              overColumn === status && "bg-blue-100 outline-blue-600",
            )}
          >
            <header className="mb-3 flex items-start gap-2 px-1">
              <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", STATUS[status].dot)} />
              <h2 className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900">
                {STATUS[status].label}
              </h2>
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-slate-700 shadow-sm">
                {items.length}
              </span>
              <span className="shrink-0 pt-0.5 text-xs font-semibold text-slate-500">
                {formatBRL(total, 0)}
              </span>
            </header>

            <div className="flex min-h-24 flex-1 flex-col gap-3">
              {items.length === 0 ? (
                <div className="grid flex-1 place-items-center rounded-xl border-2 border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
                  <span className="flex flex-col items-center gap-1">
                    <InboxIcon className="size-5" />
                    {isTarget ? "Solte aqui" : "Nenhuma OS nesta etapa"}
                  </span>
                </div>
              ) : (
                items.map((order) => (
                  <OrdemCard
                    key={order.number}
                    order={order}
                    onMove={onMove}
                    dragging={draggingNumber === order.number}
                    onDragStart={setDraggingNumber}
                    onDragEnd={() => {
                      setDraggingNumber(null);
                      setOverColumn(null);
                    }}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
