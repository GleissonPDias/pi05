import { Link } from "react-router-dom";
import { SearchXIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { formatDateTimeShort } from "../../OrdensServico/ordemUtils";
import { MOVEMENT_TYPES } from "../constants";
import { suppliersById } from "../estoqueUtils";

function Qty({ movement, unit }) {
  return (
    <span className={cn("font-mono text-sm font-extrabold", movement.qty > 0 ? "text-emerald-700" : movement.qty < 0 ? "text-red-700" : "text-slate-500")}>
      {movement.qty > 0 ? "+" : ""}
      {movement.qty} {unit}
    </span>
  );
}

function Document({ movement }) {
  if (movement.orderNumber) {
    return (
      <Link to={`/ordens-de-servico/${movement.orderNumber}`} className="font-semibold text-blue-700 hover:underline">
        {movement.document}
      </Link>
    );
  }
  return <span>{movement.document || "—"}</span>;
}

/**
 * Histórico de movimentações.
 * - movements: lista (mais recente primeiro) · partsByCode: para descrição e unidade
 * - compact: esconde a coluna da peça (usado no histórico de uma peça)
 */
function MovementsTable({ movements, partsByCode, compact = false }) {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <SearchXIcon className="size-6 text-slate-400" />
        <p className="text-sm text-slate-500">Nenhuma movimentação encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Tipo</th>
              {!compact && <th scope="col" className="px-4 py-3">Peça</th>}
              <th scope="col" className="px-4 py-3 text-right">Quantidade</th>
              <th scope="col" className="px-4 py-3 text-right">Saldo</th>
              <th scope="col" className="px-4 py-3">Documento</th>
              <th scope="col" className="px-4 py-3">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((movement) => {
              const part = partsByCode.get(movement.code);
              const type = MOVEMENT_TYPES[movement.type];
              return (
                <tr key={movement.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{formatDateTimeShort(movement.at)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", type.badge)}>{type.label}</span>
                  </td>
                  {!compact && (
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-blue-700">{movement.code}</p>
                      <p className="max-w-64 truncate text-xs text-slate-700">{part?.description ?? "Peça removida"}</p>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right"><Qty movement={movement} unit={part?.unit ?? ""} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{movement.balance}</td>
                  <td className="px-4 py-3 text-xs">
                    <Document movement={movement} />
                    {movement.unitCost ? <p className="text-slate-500">{formatBRL(movement.unitCost)}/un</p> : null}
                    {movement.supplierId && <p className="text-slate-500">{suppliersById.get(movement.supplierId)?.name}</p>}
                    {movement.note && <p className="text-slate-500">{movement.note}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{movement.by}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden">
        {movements.map((movement) => {
          const part = partsByCode.get(movement.code);
          const type = MOVEMENT_TYPES[movement.type];
          return (
            <li key={movement.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", type.badge)}>{type.label}</span>
                <Qty movement={movement} unit={part?.unit ?? ""} />
              </div>
              {!compact && <p className="text-sm font-semibold text-slate-900">{movement.code} — {part?.description}</p>}
              <p className="text-xs text-slate-600">
                {formatDateTimeShort(movement.at)} • Saldo {movement.balance} • <Document movement={movement} />
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default MovementsTable;
