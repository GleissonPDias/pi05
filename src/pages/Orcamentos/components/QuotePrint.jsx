import { createPortal } from "react-dom";
import PrintHeader from "../../../components/print/PrintHeader";
import { CONSULTANTS } from "../../../mocks/oficina";
import { formatBRL } from "../../../utils/format";
import { maskCpfCnpj, maskPhone, maskPlate } from "../../../utils/masks";
import { formatDateTimeShort } from "../../OrdensServico/ordemUtils";
import { quoteTitle, quoteTotals } from "../quoteUtils";

const sellers = new Map(CONSULTANTS.map((c) => [c.id, c]));

/** Proposta comercial impressa (fica escondida na tela; veja ".print-doc" em index.css). */
function QuotePrint({ quote }) {
  const { vehicle, client } = quote;
  const totals = quoteTotals(quote);

  return createPortal(
    <div className="print-doc bg-white font-sans text-black">
      <PrintHeader kind="Proposta comercial" number={quote.id}>
        <p className="text-[10px]">Emitida em {formatDateTimeShort(quote.issuedAt)}</p>
        <p className="text-[10px] font-bold">Válida até {new Date(quote.validUntil).toLocaleDateString("pt-BR")}</p>
      </PrintHeader>

      <div className="mt-4 grid grid-cols-2 gap-6 text-[11px]">
        <div>
          <p className="mb-1 border-b border-black text-[11px] font-bold uppercase">Cliente</p>
          <p><strong>{client?.name}</strong></p>
          {client && <p>{client.document.length > 11 ? "CNPJ" : "CPF"} {maskCpfCnpj(client.document)}</p>}
          {client && <p>{maskPhone(client.phone)} • {client.email}</p>}
        </div>
        <div>
          <p className="mb-1 border-b border-black text-[11px] font-bold uppercase">Veículo</p>
          {vehicle && (
            <>
              <p><strong>{maskPlate(vehicle.plate)}</strong> — {vehicle.brand} {vehicle.model}</p>
              <p>{vehicle.yearManufacture}/{vehicle.yearModel} • {vehicle.color} • {vehicle.fuel}</p>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm font-bold">{quoteTitle(quote)}</p>
      <table className="mt-2 w-full text-[11px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1">Descrição</th>
            <th className="text-center">Qtd</th>
            <th className="text-right">Unitário</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.services.map((line) => (
            <tr key={line.id} className="border-b border-gray-300">
              <td className="py-1">{line.description} <span className="text-gray-600">(mão de obra)</span></td>
              <td className="text-center">1</td>
              <td className="text-right">{formatBRL(line.price)}</td>
              <td className="text-right">{formatBRL(line.price)}</td>
            </tr>
          ))}
          {quote.parts.map((line) => (
            <tr key={line.id} className="border-b border-gray-300">
              <td className="py-1">{line.description}{line.code && <span className="text-gray-600"> ({line.code})</span>}</td>
              <td className="text-center">{line.qty} {line.unit}</td>
              <td className="text-right">{formatBRL(line.unitPrice)}</td>
              <td className="text-right">{formatBRL(line.qty * line.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end">
        <dl className="w-64 text-[11px]">
          <div className="flex justify-between"><dt>Mão de obra</dt><dd>{formatBRL(totals.labor)}</dd></div>
          <div className="flex justify-between"><dt>Peças</dt><dd>{formatBRL(totals.parts)}</dd></div>
          <div className="flex justify-between"><dt>Desconto</dt><dd>-{formatBRL(totals.discount)}</dd></div>
          <div className="mt-1 flex justify-between border-t border-black pt-1 text-sm font-extrabold"><dt>Total</dt><dd>{formatBRL(totals.total)}</dd></div>
        </dl>
      </div>

      {quote.notes && <p className="mt-4 text-[11px]"><strong>Observações: </strong>{quote.notes}</p>}
      <p className="mt-4 text-[10px]">
        Valores sujeitos a confirmação após a avaliação presencial do veículo. Garantia legal mínima de 90 dias para
        serviços e peças (CDC, art. 26). Consultor: {sellers.get(quote.sellerId)?.name ?? "—"}.
      </p>

      <div className="mt-12 grid grid-cols-2 gap-12 text-center text-[10px]">
        <div className="border-t border-black pt-1">De acordo — cliente</div>
        <div className="border-t border-black pt-1">Consultor responsável</div>
      </div>
    </div>,
    document.body,
  );
}

export default QuotePrint;
