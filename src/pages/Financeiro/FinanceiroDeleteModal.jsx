import { useId, useState } from "react";
import { Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import { formatBRL } from "../../utils/format";
import { formatDate } from "../../utils/dates";
import { KIND_CONFIG, STATUS_LABEL } from "./financeiroUtils";

/** Confirmação de exclusão de um recebimento ou despesa. */
function FinanceiroDeleteModal({ item, kind, onConfirm, onClose }) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const config = KIND_CONFIG[kind];

  const run = async () => {
    if (pending || !confirmed) return;
    setPending(true);
    setError("");
    try {
      await onConfirm(item);
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível excluir o lançamento.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <ModalHeader
        icon={TriangleAlertIcon}
        iconClassName="bg-red-600 text-white"
        className="border-red-100 bg-red-50"
        subtitleClassName="text-red-700"
        titleId={titleId}
        title={`Excluir ${config.singular.toLowerCase()}?`}
        subtitle="Esta ação não pode ser desfeita."
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{item.descricao}</p>
            <p className="text-xs text-slate-600">
              Vencimento {formatDate(item.vencimento)} • {STATUS_LABEL[item.status] ?? item.status}
            </p>
          </div>
          <p className="shrink-0 text-lg font-extrabold">{formatBRL(item.valor)}</p>
        </div>
        <p className="text-sm text-slate-700">
          Se o lançamento já foi pago ou recebido, prefira <strong>cancelar</strong>: assim o histórico
          financeiro continua registrado.
        </p>
        <div className="rounded-lg bg-red-50 p-3">
          <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="text-sm">
            Confirmo a exclusão definitiva deste lançamento.
          </Checkbox>
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
          variant="danger"
          size="lg"
          icon={Trash2Icon}
          disabled={!confirmed || pending}
          onClick={run}
          className="w-full sm:w-auto"
        >
          {pending ? "Excluindo..." : "Excluir Lançamento"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default FinanceiroDeleteModal;
