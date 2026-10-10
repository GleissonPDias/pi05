import { createPortal } from "react-dom";
import PrintHeader from "../../../components/print/PrintHeader";
import { formatBRL } from "../../../utils/format";
import { formatDateTimeShort } from "../../OrdensServico/ordemUtils";

/** Pedido de compra impresso para um fornecedor. */
function PurchaseOrderPrint({ supplier, items }) {
  const total = items.reduce((sum, item) => sum + item.qty * item.part.cost, 0);
  const number = `PC-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${supplier.id.slice(-2)}`;

  return createPortal(
    <div className="print-doc bg-white font-sans text-black">
      <PrintHeader kind="Pedido de compra" number={number}>
        <p className="text-[10px]">Emitido em {formatDateTimeShort(new Date().toISOString())}</p>
      </PrintHeader>
      <div className="mt-4 text-[11px]">
        <p className="mb-1 border-b border-black font-bold uppercase">Fornecedor</p>
        <p><strong>{supplier.name}</strong> — A/C {supplier.contact}</p>
        <p>WhatsApp {supplier.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")} • {supplier.email}</p>
        <p>Prazo médio de entrega: {supplier.leadTimeDays} dia(s)</p>
      </div>
      <table className="mt-4 w-full text-[11px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1">Código</th>
            <th>Descrição</th>
            <th>Fabricante / OEM</th>
            <th className="text-center">Qtd</th>
            <th className="text-right">Custo ref.</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ part, qty }) => (
            <tr key={part.code} className="border-b border-gray-300">
              <td className="py-1 font-mono">{part.code}</td>
              <td>{part.description}</td>
              <td>{part.brand}{part.oem ? ` / ${part.oem}` : ""}</td>
              <td className="text-center">{qty} {part.unit}</td>
              <td className="text-right">{formatBRL(part.cost)}</td>
              <td className="text-right">{formatBRL(qty * part.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-right text-sm font-extrabold">Total de referência: {formatBRL(total)}</p>
      <p className="mt-4 text-[10px]">Valores de referência pelo último custo médio. Favor confirmar preço, disponibilidade e prazo.</p>
      <div className="mt-12 grid grid-cols-2 gap-12 text-center text-[10px]">
        <div className="border-t border-black pt-1">Comprador — Salvô</div>
        <div className="border-t border-black pt-1">Fornecedor</div>
      </div>
    </div>,
    document.body,
  );
}

export default PurchaseOrderPrint;
