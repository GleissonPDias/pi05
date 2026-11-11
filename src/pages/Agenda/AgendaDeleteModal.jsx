import { useId, useState } from "react";
import { Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import { formatDayHeading, formatTimeRange, dayKey, AGENDA_STATUS } from "./agendaUtils";

/** Confirmação de exclusão de um agendamento. */
function AgendaDeleteModal({ item, onConfirm, onClose }) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const status = AGENDA_STATUS[item.status]?.label ?? item.status;

  const run = async () => {
    if (pending || !confirmed) return;
    setPending(true);
    setError("");
    try {
      await onConfirm(item);
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível excluir o agendamento.");
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
        title="Excluir agendamento?"
        subtitle="Esta ação não pode ser desfeita."
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="truncate text-sm font-bold text-slate-900">{item.titulo}</p>
          <p className="text-xs capitalize text-slate-600">
            {formatDayHeading(dayKey(item.inicio))} • {formatTimeRange(item.inicio, item.fim)}
          </p>
          <p className="mt-1 text-xs text-slate-600">Situação: {status}</p>
        </div>
        <p className="text-sm text-slate-700">
          Para apenas liberar o horário, prefira <strong>cancelar</strong>: o agendamento continua no histórico.
        </p>
        <div className="rounded-lg bg-red-50 p-3">
          <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="text-sm">
            Confirmo a exclusão definitiva deste agendamento.
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
          {pending ? "Excluindo..." : "Excluir Agendamento"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AgendaDeleteModal;
