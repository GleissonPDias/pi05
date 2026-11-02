import { createPortal } from "react-dom";
import PrintHeader from "../../../components/print/PrintHeader";
import {
  PartsPrintTable,
  PrintItemsSummary,
  PrintTotals,
  ServicesPrintTable,
} from "../../../components/print/PrintItemTables";
import { CONSULTANTS } from "../../../mocks/oficina";
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
      <PrintItemsSummary services={quote.services} parts={quote.parts} />
      <ServicesPrintTable services={quote.services} />
      <PartsPrintTable parts={quote.parts} />
      <PrintTotals totals={totals} />

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
