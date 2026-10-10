import { BadgeCheckIcon, PackageIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import Button from "../../../components/ui/Button";
import MoneyInput from "../../../components/ui/MoneyInput";
import QuantityStepper from "../../../components/ui/QuantityStepper";
import { useEstoque } from "../../../hooks/useEstoque";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { orderTotals, partStock } from "../ordemUtils";
import SectionCard from "./SectionCard";

const stockStyles = {
  ok: { dot: "bg-emerald-500", text: "text-emerald-700", label: (s) => `Pronta entrega (estoque: ${s.stock})` },
  baixo: { dot: "bg-amber-500", text: "text-amber-700", label: (s) => `Estoque baixo (${s.stock} un)` },
  encomenda: { dot: "bg-orange-500", text: "text-orange-700", label: (s) => `Sob encomenda (estoque: ${s.stock})` },
  avulsa: { dot: "bg-slate-400", text: "text-slate-600", label: () => "Peça avulsa (fora do catálogo)" },
};

function StockInfo({ line }) {
  const { partsByCode } = useEstoque();
  const stock = partStock(line, partsByCode);
  const style = stockStyles[stock.state];
  return (
    <p className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold", style.text)}>
      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{line.code || "AVULSA"}</span>
      <span className="inline-flex items-center gap-1">
        <span className={cn("size-1.5 rounded-full", style.dot)} />
        {style.label(stock)}
      </span>
      {stock.note && <span className="font-normal text-slate-500">• {stock.note}</span>}
    </p>
  );
}

/** Tabela de peças da OS (cards no celular). */
function PecasTable({ parts, readOnly, onChange, onAdd }) {
  const subtotal = orderTotals({ parts, services: [], discount: { value: 0 } }).parts;

  const updateLine = (id, patch) => onChange(parts.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  const removeLine = (id) => onChange(parts.filter((line) => line.id !== id));

  const actions = (line) => (
    <div className="flex items-center justify-end gap-1">
      {!line.quoted && !readOnly && (
        <button
          type="button"
          onClick={() => updateLine(line.id, { quoted: true })}
          title="Confirmar preço com o fornecedor"
          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <RefreshCwIcon className="size-3" />
          Confirmar cotação
        </button>
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={() => removeLine(line.id)}
          aria-label={`Remover ${line.description}`}
          className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Trash2Icon className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <SectionCard
      icon={PackageIcon}
      title="Peças e Componentes Aplicados"
      badge={
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          {parts.length} {parts.length === 1 ? "item vinculado" : "itens vinculados"}
        </span>
      }
      actions={
        !readOnly && (
          <Button size="sm" icon={PlusIcon} onClick={onAdd}>
            Adicionar Peça
          </Button>
        )
      }
      flush
    >
      <p className="-mt-2 mb-3 flex items-center gap-1.5 px-5 text-[11px] font-semibold text-emerald-700">
        <BadgeCheckIcon className="size-3.5" />
        Baixa automática no almoxarifado na entrega do veículo
      </p>

      {parts.length === 0 ? (
        <p className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
          Nenhuma peça lançada. Use “Adicionar Peça” para buscar no estoque.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-5 py-2.5">Código / descrição da peça</th>
                  <th scope="col" className="w-28 px-2 py-2.5 text-center">Qtd</th>
                  <th scope="col" className="w-36 px-2 py-2.5 text-right">Valor unitário</th>
                  <th scope="col" className="w-28 px-2 py-2.5 text-right">Subtotal</th>
                  <th scope="col" className="w-14 px-3 py-2.5"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parts.map((line) => (
                  <tr key={line.id}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-slate-900">{line.description}</p>
                      <StockInfo line={line} />
                    </td>
                    <td className="px-2 py-3 text-center">
                      {readOnly ? (
                        <span className="text-sm font-bold">{line.qty} {line.unit}</span>
                      ) : (
                        <QuantityStepper value={line.qty} onChange={(qty) => updateLine(line.id, { qty })} />
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <MoneyInput
                        value={line.unitPrice}
                        disabled={readOnly}
                        aria-label={`Valor unitário de ${line.description}`}
                        onChange={(unitPrice) => updateLine(line.id, { unitPrice, quoted: true })}
                      />
                    </td>
                    <td className="px-2 py-3 text-right text-sm font-bold text-slate-900">
                      {formatBRL(line.qty * line.unitPrice)}
                    </td>
                    <td className="px-3 py-3">{actions(line)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
            {parts.map((line) => (
              <li key={line.id} className="space-y-3 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{line.description}</p>
                  <StockInfo line={line} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {readOnly ? (
                    <span className="text-sm font-bold">{line.qty} {line.unit}</span>
                  ) : (
                    <QuantityStepper value={line.qty} onChange={(qty) => updateLine(line.id, { qty })} />
                  )}
                  <MoneyInput
                    className="w-32"
                    value={line.unitPrice}
                    disabled={readOnly}
                    aria-label={`Valor unitário de ${line.description}`}
                    onChange={(unitPrice) => updateLine(line.id, { unitPrice, quoted: true })}
                  />
                  <span className="ml-auto text-sm font-bold">{formatBRL(line.qty * line.unitPrice)}</span>
                </div>
                {actions(line)}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm">
        <span className="text-slate-600">Total parcial peças</span>
        <strong className="text-slate-900">{formatBRL(subtotal)}</strong>
      </div>
    </SectionCard>
  );
}

export default PecasTable;
