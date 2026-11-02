import { createPortal } from "react-dom";
import PrintHeader from "../../../components/print/PrintHeader";
import {
  PartsPrintTable,
  PrintItemsSummary,
  PrintTotals,
  ServicesPrintTable,
} from "../../../components/print/PrintItemTables";
import { formatKm } from "../../../utils/format";
import { maskCpfCnpj, maskPhone, maskPlate } from "../../../utils/masks";
import {
  CHANNELS,
  CHECKLIST_ITEMS,
  CHECKLIST_STATES,
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
import PrintDamageMap from "./PrintDamageMap";

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

/** Itens do checklist que não estão OK, ex.: "Pneus (desgaste e calibragem): Atenção". */
function checklistExceptions(inspection) {
  return CHECKLIST_ITEMS.filter((item) => inspection.checklist[item.key] && inspection.checklist[item.key] !== "ok").map(
    (item) => `${item.label}: ${CHECKLIST_STATES[inspection.checklist[item.key]].label}`,
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
          <Block title="Vistoria de entrada — checklist">
            <div className="grid grid-cols-3 gap-x-6 gap-y-0.5">
              {CHECKLIST_ITEMS.map((item) => {
                const state = order.inspection.checklist[item.key];
                return (
                  <p key={item.key} className="text-[11px]">
                    {item.label}:{" "}
                    <strong className={state && state !== "ok" ? "underline" : undefined}>
                      {CHECKLIST_STATES[state]?.label ?? "Não verificado"}
                    </strong>
                  </p>
                );
              })}
            </div>
          </Block>
          <Block title="Mapa de avarias">
            <PrintDamageMap damages={order.inspection.damages} />
          </Block>
          <Block title="Pertences e observações">
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
          <Block title="Vistoria de entrada — mapa de avarias">
            {order.inspection.done || order.inspection.damages.length ? (
              <>
                <PrintDamageMap damages={order.inspection.damages} />
                <p className="mt-1.5 text-[11px]">
                  <span className="font-bold">Checklist: </span>
                  {checklistExceptions(order.inspection).join("; ") || "todos os itens verificados estão OK."}
                </p>
              </>
            ) : (
              <p className="text-[11px]">Vistoria de entrada ainda não realizada.</p>
            )}
          </Block>
          {order.diagnosis.text && (
            <Block title="Laudo técnico">
              <p className="text-[11px]">{order.diagnosis.text}</p>
            </Block>
          )}
          <PrintItemsSummary services={order.services} parts={order.parts} />
          <ServicesPrintTable services={order.services} mechanicName={mechanicName} />
          <PartsPrintTable parts={order.parts} />
          <PrintTotals totals={totals} note={paymentCondition(order)} />
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
