import { useId, useState } from "react";
import { BanIcon, CircleCheckBigIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import { formatDate } from "../../utils/dates";
import { formatBRL } from "../../utils/format";
import { KIND, KIND_CONFIG, dueInfo, formaLabel } from "./financeiroUtils";

/**
 * Confirmação de baixa (pago/recebido) ou cancelamento de um lançamento.
 * - action: "PAGO" | "CANCELADO"
 */
function FinanceiroStatusModal({ item, kind, action, onConfirm, onClose }) {
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const config = KIND_CONFIG[kind];
  const isPaid = action === "PAGO";
  const info = dueInfo(item);

  const run = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onConfirm(item, action);
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível atualizar o lançamento.");
      setPending(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md">
      <ModalHeader
        icon={isPaid ? CircleCheckBigIcon : BanIcon}
        iconClassName={isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}
        titleId={titleId}
        title={isPaid ? `${config.paidAction}?` : "Cancelar lançamento?"}
        subtitle={
          isPaid
            ? `O lançamento sai das pendências e entra no fluxo de caixa como ${config.paidVerb} hoje.`
            : "O lançamento continua no histórico, mas deixa de contar nos totais."
        }
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{item.descricao}</p>
            <p className="text-xs text-slate-600">
              {kind === KIND.PAGAR ? item.categoria || "Sem categoria" : formaLabel(item.formaPagamento)} • Vencimento{" "}
              {formatDate(String(item.vencimento ?? "").slice(0, 10))} ({info.text.toLowerCase()})
            </p>
          </div>
          <p className="shrink-0 text-lg font-extrabold text-slate-900">{formatBRL(Number(item.valor) || 0)}</p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="soft" size="lg" onClick={onClose} disabled={pending} data-autofocus className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button
          variant={isPaid ? "success" : "neutral"}
          size="lg"
          icon={isPaid ? CircleCheckBigIcon : BanIcon}
          disabled={pending}
          onClick={run}
          className="w-full sm:w-auto"
        >
          {pending ? "Salvando..." : isPaid ? `Confirmar ${config.paidLabel.toLowerCase()}` : "Cancelar lançamento"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default FinanceiroStatusModal;
