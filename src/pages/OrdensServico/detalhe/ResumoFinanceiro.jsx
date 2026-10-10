import { ArrowRightIcon, CalculatorIcon, ReceiptTextIcon, SaveIcon, TagIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import {
  formatForecast,
  formatOrderNumber,
  isOverdue,
  mechanicName,
  nextStep,
  orderTotals,
  paymentCondition,
  warrantyLabel,
} from "../ordemUtils";

const approvalChip = {
  pendente: { label: "Orçamento", className: "text-slate-600" },
  enviado: { label: "Aguardando cliente", className: "text-indigo-700" },
  aprovado: { label: "Aprovado", className: "text-emerald-700" },
  recusado: { label: "Recusado", className: "text-red-700" },
};

function Row({ label, value, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-sm", className)}>
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-bold text-slate-900">{value}</dd>
    </div>
  );
}

/**
 * Resumo financeiro (lateral): totais, condição de pagamento, previsão,
 * próximo passo e ações de salvar / comprovante.
 */
function ResumoFinanceiro({ order, dirty, readOnly, onSave, onPrintReceipt, onNextStep }) {
  const totals = orderTotals(order);
  const chip = approvalChip[order.approval.status];
  const step = readOnly ? null : nextStep(order);
  const partsCount = order.parts.reduce((sum, line) => sum + line.qty, 0);

  return (
    <section aria-label="Resumo financeiro" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
          <CalculatorIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold leading-tight text-slate-900">Resumo Financeiro</h2>
          <p className="text-xs text-slate-500">Consolidação em tempo real</p>
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">
          OS {formatOrderNumber(order.number)}
        </span>
      </div>

      <dl className="mt-5 space-y-3">
        <Row label={`Subtotal de Peças (${partsCount} un)`} value={formatBRL(totals.parts)} />
        <Row
          label={`Mão de Obra (${totals.hours.toLocaleString("pt-BR")}h)`}
          value={formatBRL(totals.labor)}
        />
        {totals.discount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <dt className="inline-flex items-center gap-1.5 font-semibold">
              <TagIcon className="size-3.5" />
              Desconto
            </dt>
            <dd className="font-bold">-{formatBRL(totals.discount)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 rounded-xl bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Valor total</p>
          <p className={cn("text-[11px] font-extrabold uppercase tracking-wide", chip.className)}>{chip.label}</p>
        </div>
        <p className="mt-1 text-3xl font-extrabold leading-tight text-blue-800">{formatBRL(totals.total)}</p>
        <p className="mt-2 text-xs text-slate-600">{paymentCondition(order)}</p>
      </div>

      <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
        <Row
          label="Previsão de entrega"
          value={
            <span className={isOverdue(order) ? "text-red-700" : undefined}>
              {formatForecast(order.expectedAt)}
              {isOverdue(order) && " (atrasada)"}
            </span>
          }
          className="text-xs"
        />
        <Row label="Mecânico líder" value={mechanicName(order.mechanicId) || "A definir"} className="text-xs" />
        <Row label="Garantia oferecida" value={warrantyLabel(order.warranty)} className="text-xs" />
      </dl>

      <div className="mt-5 space-y-2" data-print-hide>
        {step && (
          <Button variant="success" size="lg" fullWidth onClick={() => onNextStep(step)}>
            {step.label}
            <ArrowRightIcon className="size-4" />
          </Button>
        )}
        {!readOnly && (
          <Button size="lg" fullWidth icon={SaveIcon} onClick={onSave} disabled={!dirty} className="disabled:opacity-50">
            {dirty ? "Salvar e Atualizar OS" : "OS salva"}
          </Button>
        )}
        <Button variant="soft" size="md" fullWidth icon={ReceiptTextIcon} onClick={onPrintReceipt}>
          Emitir Comprovante de Entrada
        </Button>
      </div>
    </section>
  );
}

export default ResumoFinanceiro;
