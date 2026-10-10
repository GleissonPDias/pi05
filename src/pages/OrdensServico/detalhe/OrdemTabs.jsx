import { useRef } from "react";
import { ClipboardCheckIcon, ClipboardListIcon, ReceiptIcon, WrenchIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { TABS } from "../constants";
import { inspectionSummary, orderTotals } from "../ordemUtils";

const icons = {
  dados: ClipboardListIcon,
  vistoria: ClipboardCheckIcon,
  diagnostico: WrenchIcon,
  fechamento: ReceiptIcon,
};

/** Selo de cada aba (situação daquela parte da OS). */
function TabBadge({ tab, order }) {
  if (tab === "dados") {
    const complete = order.complaint && order.type && order.mileageIn && order.fuelLevel !== null;
    return (
      <span
        className={cn("size-2 rounded-full", complete ? "bg-emerald-500" : "bg-amber-500")}
        title={complete ? "Completo" : "Faltam informações"}
      />
    );
  }
  if (tab === "vistoria") {
    const { flagged } = inspectionSummary(order.inspection);
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          order.inspection.done ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-900",
        )}
      >
        {order.inspection.done ? `${flagged} ${flagged === 1 ? "item" : "itens"}` : "Pendente"}
      </span>
    );
  }
  if (tab === "diagnostico") {
    const count = order.parts.length + order.services.length;
    return order.status === "execucao" ? (
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">Ativa</span>
    ) : (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">{count} itens</span>
    );
  }
  return <span className="text-xs font-extrabold">{formatBRL(orderTotals(order).total)}</span>;
}

/** Abas da OS (setas do teclado navegam entre elas). */
function OrdemTabs({ active, onChange, order, idPrefix }) {
  const listRef = useRef(null);

  const handleKeyDown = (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = TABS.findIndex((tab) => tab.key === active);
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    onChange(TABS[next].key);
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Etapas da ordem de serviço"
      onKeyDown={handleKeyDown}
      className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0"
    >
      {TABS.map((tab) => {
        const Icon = icons[tab.key];
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.key}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
              selected
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900",
            )}
          >
            <Icon className="size-4" />
            {tab.label}
            <TabBadge tab={tab.key} order={order} />
          </button>
        );
      })}
    </div>
  );
}

export default OrdemTabs;
