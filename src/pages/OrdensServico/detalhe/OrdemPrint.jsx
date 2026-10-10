import { createPortal } from "react-dom";
import PrintHeader from "../../../components/print/PrintHeader";
import { formatBRL, formatKm } from "../../../utils/format";
import { maskCpfCnpj, maskPhone, maskPlate } from "../../../utils/masks";
import {
  CHANNELS,
  CHECKLIST_ITEMS,
  CHECKLIST_STATES,
  DAMAGE_AREAS,
  DAMAGE_TYPES,
  FUEL_LEVELS,
  SERVICE_TYPES,
  STATUS,
} from "../constants";
import {
  formatDateTimeShort,
  formatOrderNumber,
  mechanicName,
  orderTotals,
  paymentCondition,
  warrantyLabel,
} from "../ordemUtils";

function Block({ title, children }) {
  return (
    <section className="mt-4 break-inside-avoid">
      <h2 className="mb-1.5 border-b border-black pb-0.5 text-[11px] font-bold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <p className="text-[11px]">
      <span className="font-bold">{label}: </span>
      {value || "—"}
    </p>
  );
}

/**
 * Documento impresso da OS (variant="os") ou do comprovante de entrada
 * (variant="entrada"). Fica escondido na tela e só aparece na impressão
 * (veja ".print-doc" em index.css).
 */
function OrdemPrint({ order, variant }) {
  const { vehicle, client } = order;
  const totals = orderTotals(order);
  const isReceipt = variant === "entrada";

  return createPortal(
    <div className="print-doc bg-white font-sans text-black">
      <PrintHeader kind={isReceipt ? "Comprovante de entrada" : "Ordem de serviço"} number={formatOrderNumber(order.number)}>
        <p className="text-[10px]">Aberta em {formatDateTimeShort(order.openedAt)}</p>
        {!isReceipt && <p className="text-[10px]">Etapa: {STATUS[order.status].label}</p>}
      </PrintHeader>

      <div className="mt-3 grid grid-cols-2 gap-6">
        <Block title="Cliente">
          <Field label="Nome" value={client?.name} />
          <Field label={client?.document.length > 11 ? "CNPJ" : "CPF"} value={client && maskCpfCnpj(client.document)} />
          <Field label="Telefone" value={client && maskPhone(client.phone)} />
          <Field label="E-mail" value={client?.email} />
        </Block>
        <Block title="Veículo">
          <Field label="Placa" value={vehicle && maskPlate(vehicle.plate)} />
          <Field label="Modelo" value={vehicle && `${vehicle.brand} ${vehicle.model} (${vehicle.yearManufacture}/${vehicle.yearModel})`} />
          <Field label="Cor / combustível" value={vehicle && `${vehicle.color} • ${vehicle.fuel}`} />
          <Field label="Chassi" value={vehicle?.chassis} />
        </Block>
      </div>

      <Block title="Entrada">
        <div className="grid grid-cols-3 gap-x-6">
          <Field label="Km de entrada" value={formatKm(order.mileageIn ?? 0)} />
          <Field label="Combustível" value={FUEL_LEVELS[order.fuelLevel]} />
          <Field label="Atendimento" value={SERVICE_TYPES[order.type]} />
          <Field label="Canal" value={CHANNELS[order.channel]} />
          <Field label="Responsável" value={mechanicName(order.mechanicId)} />
          <Field label="Previsão" value={order.expectedAt ? formatDateTimeShort(order.expectedAt) : "A definir"} />
        </div>
        <p className="mt-1 text-[11px]">
          <span className="font-bold">Relato do cliente: </span>
          {order.complaint || "—"}
        </p>
      </Block>

      {isReceipt ? (
        <>
          <Block title="Vistoria de entrada">
            <div className="grid grid-cols-3 gap-x-6 gap-y-0.5">
              {CHECKLIST_ITEMS.map((item) => (
                <p key={item.key} className="text-[11px]">
                  {item.label}: <strong>{CHECKLIST_STATES[order.inspection.checklist[item.key]]?.label ?? "Não verificado"}</strong>
                </p>
              ))}
            </div>
            <p className="mt-1.5 text-[11px]">
              <span className="font-bold">Avarias: </span>
              {order.inspection.damages.length
                ? order.inspection.damages.map((d) => `${DAMAGE_AREAS[d.area]} (${DAMAGE_TYPES[d.type]})`).join("; ")
                : "Nenhuma avaria registrada."}
            </p>
            <Field label="Pertences no veículo" value={order.inspection.belongings} />
            <Field label="Observações" value={order.inspection.notes} />
          </Block>
          <p className="mt-4 text-[10px]">
            Declaro que acompanhei a vistoria e estou de acordo com o estado do veículo descrito acima. Autorizo a
            oficina a realizar o diagnóstico e a enviar o orçamento para aprovação antes de qualquer serviço.
          </p>
        </>
      ) : (
        <>
          {order.diagnosis.text && (
            <Block title="Laudo técnico">
              <p className="text-[11px]">{order.diagnosis.text}</p>
            </Block>
          )}
          <Block title="Peças">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left">
                  <th className="py-0.5">Código</th>
                  <th>Descrição</th>
                  <th className="text-center">Qtd</th>
                  <th className="text-right">Unitário</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.parts.map((line) => (
                  <tr key={line.id} className="border-t border-gray-300">
                    <td className="py-0.5 font-mono">{line.code || "—"}</td>
                    <td>{line.description}</td>
                    <td className="text-center">{line.qty} {line.unit}</td>
                    <td className="text-right">{formatBRL(line.unitPrice)}</td>
                    <td className="text-right">{formatBRL(line.qty * line.unitPrice)}</td>
                  </tr>
                ))}
                {order.parts.length === 0 && (
                  <tr><td colSpan={5} className="py-1">Nenhuma peça.</td></tr>
                )}
              </tbody>
            </table>
          </Block>
          <Block title="Serviços / mão de obra">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left">
                  <th className="py-0.5">Descrição</th>
                  <th>Mecânico</th>
                  <th className="text-center">Tempo</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {order.services.map((line) => (
                  <tr key={line.id} className="border-t border-gray-300">
                    <td className="py-0.5">{line.description}</td>
                    <td>{mechanicName(line.mechanicId) || "—"}</td>
                    <td className="text-center">{line.hours}h</td>
                    <td className="text-right">{formatBRL(line.price)}</td>
                  </tr>
                ))}
                {order.services.length === 0 && (
                  <tr><td colSpan={4} className="py-1">Nenhum serviço.</td></tr>
                )}
              </tbody>
            </table>
          </Block>
          <div className="mt-4 flex justify-end break-inside-avoid">
            <dl className="w-64 text-[11px]">
              <div className="flex justify-between"><dt>Peças</dt><dd>{formatBRL(totals.parts)}</dd></div>
              <div className="flex justify-between"><dt>Mão de obra</dt><dd>{formatBRL(totals.labor)}</dd></div>
              <div className="flex justify-between"><dt>Desconto</dt><dd>-{formatBRL(totals.discount)}</dd></div>
              <div className="mt-1 flex justify-between border-t border-black pt-1 text-sm font-extrabold">
                <dt>Total</dt><dd>{formatBRL(totals.total)}</dd>
              </div>
              <p className="mt-1 text-[10px]">{paymentCondition(order)}</p>
            </dl>
          </div>
          <Block title="Garantia e observações">
            <Field label="Garantia" value={`${warrantyLabel(order.warranty)}, contada a partir da entrega`} />
            {order.customerNotes && <p className="text-[11px]">{order.customerNotes}</p>}
          </Block>
        </>
      )}

      <div className="mt-12 grid grid-cols-2 gap-12 break-inside-avoid text-center text-[10px]">
        <div className="border-t border-black pt-1">Assinatura do cliente</div>
        <div className="border-t border-black pt-1">Responsável pela oficina</div>
      </div>
      <p className="mt-4 text-center text-[9px] text-gray-600">
        Documento gerado pelo Salvô Gestão Automotiva em {formatDateTimeShort(new Date().toISOString())}
      </p>
    </div>,
    document.body,
  );
}

export default OrdemPrint;
