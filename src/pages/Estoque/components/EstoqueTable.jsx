import { CopyIcon, HistoryIcon, PencilIcon, PlusCircleIcon, SearchXIcon, ShoppingCartIcon, TruckIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { STOCK_STATUS } from "../constants";
import { markup, stockStatus } from "../estoqueUtils";

const actionButton =
  "grid size-8 place-items-center rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

function Sku({ part, onCopy }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn("rounded-md px-2 py-1 font-mono text-xs font-extrabold", part.status === "inativo" ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-800")}>
        {part.code}
      </span>
      <button type="button" onClick={() => onCopy(part.code)} aria-label={`Copiar código ${part.code}`} title="Copiar código" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <CopyIcon className="size-3.5" />
      </button>
    </div>
  );
}

function Description({ part }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold leading-snug text-slate-900">{part.description}</p>
      <p className="mt-0.5 text-[11px] text-slate-600">
        <span className="font-bold text-blue-700">{part.brand}</span>
        {part.application && <> • {part.application}</>}
      </p>
      {part.oem && <p className="text-[11px] text-slate-500">OEM {part.oem}</p>}
    </div>
  );
}

function Prices({ part }) {
  return (
    <div className="text-xs">
      <p className="text-slate-600">{formatBRL(part.cost)} <span className="text-slate-400">custo</span></p>
      <p className="font-bold text-slate-900">{formatBRL(part.price)} <span className="font-normal text-slate-400">venda</span></p>
      <p className="font-semibold text-emerald-700">+{markup(part).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% markup</p>
    </div>
  );
}

function Level({ part, reserved }) {
  const status = stockStatus(part, reserved);
  const style = STOCK_STATUS[status.key];
  const pct = part.maxStock ? Math.min(100, Math.round((Math.max(0, part.stock) / part.maxStock) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold text-slate-900">{part.stock} {part.unit}</span>
        <span className={status.key === "normal" ? "text-slate-500" : "font-semibold text-red-700"}>Mín: {part.minStock}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200" role="presentation">
        <div className={cn("h-full rounded-full", style.bar)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {reserved ? <span className="font-semibold text-indigo-700">{reserved} reservado(s) em OS • </span> : null}
        Prat. {part.location || "—"}
      </p>
    </div>
  );
}

function Status({ part, reserved }) {
  const status = stockStatus(part, reserved);
  const style = STOCK_STATUS[status.key];
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", style.badge)}>
        <span className={cn("size-1.5 rounded-full", style.dot)} />
        {style.label}
      </span>
      {status.key === "baixo" && status.toRestock > 0 && (
        <span className="text-[11px] font-semibold text-amber-800">{status.toRestock} p/ repor até o mínimo</span>
      )}
      {part.onOrder && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
          <TruckIcon className="size-3" />
          Pedido enviado ({part.onOrder.qty})
        </span>
      )}
    </div>
  );
}

function Actions({ part, reserved, onEntry, onEdit, onHistory, onBuy }) {
  const critical = stockStatus(part, reserved).key === "critico";
  return (
    <div className="flex items-center gap-0.5">
      {critical && !part.onOrder ? (
        <button type="button" onClick={() => onBuy(part)} aria-label={`Pedir compra de ${part.code}`} title="Pedir compra" className={cn(actionButton, "text-red-600 hover:bg-red-50")}>
          <ShoppingCartIcon className="size-4" />
        </button>
      ) : (
        <button type="button" onClick={() => onEntry(part)} aria-label={`Registrar entrada de ${part.code}`} title="Registrar entrada" className={cn(actionButton, "text-blue-600 hover:bg-blue-50")}>
          <PlusCircleIcon className="size-4" />
        </button>
      )}
      <button type="button" onClick={() => onEdit(part)} aria-label={`Editar ${part.code}`} title="Editar" className={cn(actionButton, "hover:bg-blue-50 hover:text-blue-700")}>
        <PencilIcon className="size-4" />
      </button>
      <button type="button" onClick={() => onHistory(part)} aria-label={`Histórico de ${part.code}`} title="Histórico de movimentações" className={cn(actionButton, "hover:bg-blue-50 hover:text-blue-700")}>
        <HistoryIcon className="size-4" />
      </button>
    </div>
  );
}

const columns = [
  { label: "Código / SKU", className: "w-[11%]" },
  { label: "Descrição & fabricante", className: "w-[25%]" },
  { label: "Categoria", className: "w-[10%]" },
  { label: "Custo / venda", className: "w-[12%]" },
  { label: "Estoque vs mínimo", className: "w-[16%]" },
  { label: "Status", className: "w-[15%]" },
  { label: "Ações", className: "w-[11%]" },
];

/** Inventário (tabela no desktop, cards no celular). */
function EstoqueTable({ parts, reserved, onCopy, ...handlers }) {
  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
          <SearchXIcon className="size-6" />
        </span>
        <p className="text-sm font-bold text-slate-900">Nenhuma peça encontrada</p>
        <p className="max-w-xs text-xs text-slate-500">Revise a busca ou os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[66rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Inventário de peças</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60">
              {columns.map((column) => (
                <th key={column.label} scope="col" className={`${column.className} px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parts.map((part) => {
              const qty = reserved.get(part.code) ?? 0;
              const critical = stockStatus(part, qty).key === "critico";
              return (
                <tr key={part.code} className={cn("transition-colors hover:bg-blue-50/40", critical && "bg-red-50/40", part.status === "inativo" && "opacity-70")}>
                  <td className="px-4 py-4"><Sku part={part} onCopy={onCopy} /></td>
                  <td className="px-4 py-4"><Description part={part} /></td>
                  <td className="px-4 py-4">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{part.category}</span>
                  </td>
                  <td className="px-4 py-4"><Prices part={part} /></td>
                  <td className="px-4 py-4"><Level part={part} reserved={qty} /></td>
                  <td className="px-4 py-4"><Status part={part} reserved={qty} /></td>
                  <td className="px-4 py-4"><Actions part={part} reserved={qty} {...handlers} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {parts.map((part) => {
          const qty = reserved.get(part.code) ?? 0;
          return (
            <li key={part.code} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <Sku part={part} onCopy={onCopy} />
                <Status part={part} reserved={qty} />
              </div>
              <Description part={part} />
              <div className="grid grid-cols-2 gap-4">
                <Prices part={part} />
                <Level part={part} reserved={qty} />
              </div>
              <Actions part={part} reserved={qty} {...handlers} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default EstoqueTable;
