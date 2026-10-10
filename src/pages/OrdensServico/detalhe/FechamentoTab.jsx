import { useState } from "react";
import {
  CopyIcon,
  KeyRoundIcon,
  MessageCircleIcon,
  PercentIcon,
  ShieldCheckIcon,
  StarIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  WalletIcon,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import MoneyInput from "../../../components/ui/MoneyInput";
import SelectField from "../../../components/ui/SelectField";
import TextAreaField from "../../../components/ui/TextAreaField";
import TextField from "../../../components/ui/TextField";
import { cn } from "../../../utils/cn";
import { formatBRL, formatKm } from "../../../utils/format";
import { APPROVAL_CHANNELS, PAYMENT_METHODS, WARRANTIES, toOptions } from "../constants";
import { formatDateTimeShort, orderTotals, paymentCondition, timeShort } from "../ordemUtils";
import ModeToggle from "./ModeToggle";
import SectionCard from "./SectionCard";

const approvalStyles = {
  pendente: { label: "Orçamento ainda não enviado", className: "border-slate-200 bg-slate-50 text-slate-700" },
  enviado: { label: "Aguardando resposta do cliente", className: "border-indigo-200 bg-indigo-50 text-indigo-900" },
  aprovado: { label: "Orçamento aprovado", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  recusado: { label: "Orçamento recusado", className: "border-red-200 bg-red-50 text-red-900" },
};

const installmentOptions = Array.from({ length: 10 }, (_, index) => ({
  value: String(index + 1),
  label: index === 0 ? "À vista" : `${index + 1}x sem juros`,
}));

/**
 * Aba 4: aprovação do orçamento, desconto, pagamento, garantia e entrega.
 * As ações de aprovação/entrega são gravadas na hora (onApprovalAction).
 */
function FechamentoTab({ order, onChange, readOnly, onApprovalAction, onDeliver, onCopy }) {
  const [channel, setChannel] = useState("whatsapp");
  const totals = orderTotals(order);
  const { approval } = order;
  const style = approvalStyles[approval.status];
  const hasItems = order.parts.length > 0 || order.services.length > 0;
  const canDecide = !readOnly && hasItems && approval.status !== "aprovado";

  return (
    <div className="space-y-6">
      <SectionCard icon={ThumbsUpIcon} title="Aprovação do Orçamento">
        <div className={cn("rounded-lg border p-4 text-sm", style.className)}>
          <p className="font-bold">{style.label}</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {approval.sentAt && (
              <li>
                Enviado via {APPROVAL_CHANNELS[approval.channel] ?? "—"} em {formatDateTimeShort(approval.sentAt)} (
                {timeShort(approval.sentAt).toLowerCase()})
              </li>
            )}
            {approval.viewedAt && <li>Visualizado pelo cliente em {formatDateTimeShort(approval.viewedAt)}</li>}
            {approval.decidedAt && (
              <li>
                {approval.status === "aprovado" ? "Aprovado" : "Recusado"} via{" "}
                {APPROVAL_CHANNELS[approval.channel] ?? "—"} em {formatDateTimeShort(approval.decidedAt)}
              </li>
            )}
            {!hasItems && <li>Adicione peças ou serviços na aba “Diagnóstico & Serviços” para montar o orçamento.</li>}
          </ul>
        </div>

        {canDecide && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="success" icon={MessageCircleIcon} onClick={() => onApprovalAction("send")} disabled={!order.client?.phone}>
                {approval.sentAt ? "Reenviar por WhatsApp" : "Enviar orçamento por WhatsApp"}
              </Button>
              <Button variant="outline" icon={CopyIcon} onClick={() => onCopy("quote")}>
                Copiar mensagem
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-end">
              <SelectField
                className="sm:w-56"
                label="Resposta recebida por"
                options={toOptions(APPROVAL_CHANNELS)}
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button icon={ThumbsUpIcon} onClick={() => onApprovalAction("approve", channel)}>
                  Cliente aprovou
                </Button>
                <Button
                  variant="outline"
                  icon={ThumbsDownIcon}
                  onClick={() => onApprovalAction("reject", channel)}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  Cliente recusou
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Ao registrar a aprovação, a OS segue automaticamente para “Em Execução” (ou “Aguard. Peças”, se faltar
              alguma peça no estoque).
            </p>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard icon={WalletIcon} title="Desconto & Pagamento">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Desconto</span>
                <ModeToggle
                  value={order.discount.type}
                  onChange={(type) => onChange({ discount: { type, value: 0 } })}
                  options={[
                    { value: "valor", label: "R$" },
                    { value: "percentual", label: "%" },
                  ]}
                />
              </div>
              {order.discount.type === "valor" ? (
                <MoneyInput
                  value={order.discount.value}
                  disabled={readOnly}
                  aria-label="Desconto em reais"
                  onChange={(value) => onChange({ discount: { type: "valor", value: Math.min(value, totals.subtotal) } })}
                />
              ) : (
                <TextField
                  label="Percentual de desconto"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={order.discount.value}
                  trailing={<PercentIcon className="size-4 text-slate-400" />}
                  onChange={(event) =>
                    onChange({ discount: { type: "percentual", value: Math.min(100, Math.max(0, Number(event.target.value))) } })
                  }
                />
              )}
              {totals.discount > 0 && (
                <p className="mt-1 text-xs text-emerald-700">Desconto aplicado: -{formatBRL(totals.discount)}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <SelectField
                label="Forma de pagamento"
                placeholder="A definir"
                options={toOptions(PAYMENT_METHODS)}
                value={order.payment.method}
                onChange={(event) => onChange({ payment: { ...order.payment, method: event.target.value, installments: 1 } })}
              />
              {order.payment.method === "credito" && (
                <SelectField
                  label="Parcelas"
                  options={installmentOptions}
                  value={String(order.payment.installments)}
                  onChange={(event) => onChange({ payment: { ...order.payment, installments: Number(event.target.value) } })}
                />
              )}
            </div>
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
              <strong className="text-slate-900">{formatBRL(totals.total)}</strong> — {paymentCondition(order)}
            </p>
          </div>
        </SectionCard>

        <SectionCard icon={ShieldCheckIcon} title="Garantia & Observações">
          <div className="space-y-4">
            <SelectField
              label="Garantia oferecida"
              options={toOptions(WARRANTIES)}
              value={order.warranty}
              onChange={(event) => onChange({ warranty: event.target.value })}
            />
            <p className="text-[11px] text-slate-500">
              O Código de Defesa do Consumidor garante no mínimo 90 dias para serviços e peças (art. 26).
            </p>
            <TextAreaField
              label="Observações para o cliente (saem na OS impressa)"
              rows={4}
              maxLength={500}
              counter
              placeholder="Ex.: Recomendamos a troca dos pneus dianteiros nos próximos 5.000 km."
              value={order.customerNotes}
              onChange={(event) => onChange({ customerNotes: event.target.value })}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard icon={KeyRoundIcon} title="Entrega do Veículo">
        {order.status === "entregue" ? (
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Entregue em</dt>
              <dd className="font-bold text-slate-900">{formatDateTimeShort(order.deliveredAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Km de saída</dt>
              <dd className="font-bold text-slate-900">{order.mileageOut ? formatKm(order.mileageOut) : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Pagamento</dt>
              <dd className="font-bold text-slate-900">{PAYMENT_METHODS[order.payment.method] ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Avaliação</dt>
              <dd className="flex gap-0.5" aria-label={order.rating ? `${order.rating} de 5 estrelas` : "Sem avaliação"}>
                {order.rating
                  ? [1, 2, 3, 4, 5].map((value) => (
                      <StarIcon
                        key={value}
                        className={cn("size-4", value <= order.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
                      />
                    ))
                  : <span className="font-bold text-slate-900">—</span>}
              </dd>
            </div>
          </dl>
        ) : order.status === "cancelada" ? (
          <p className="text-sm text-red-700">OS cancelada: {order.cancelReason}</p>
        ) : order.status === "pronta" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm text-slate-700">
              Veículo pronto {timeShort(order.readyAt).toLowerCase()}. Avise o cliente e registre a entrega quando ele
              retirar.
            </p>
            <Button variant="outline" icon={MessageCircleIcon} onClick={() => onApprovalAction("notifyReady")}>
              Avisar cliente
            </Button>
            <Button variant="success" icon={KeyRoundIcon} onClick={onDeliver}>
              Registrar Entrega
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            A entrega fica disponível quando todos os serviços forem concluídos e a OS estiver em “Pronta p/ Retirada”.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

export default FechamentoTab;
