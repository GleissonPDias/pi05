import { useId, useState } from "react";
import { CalendarX2Icon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import { formatDayHeading, formatTimeRange, dayKey } from "./agendaUtils";

/** Confirmação de cancelamento de um agendamento (o registro continua no histórico). */
function AgendaCancelModal({ item, onConfirm, onClose }) {
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onConfirm(item);
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível cancelar o agendamento.");
      setPending(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md">
      <ModalHeader
        icon={CalendarX2Icon}
        iconClassName="bg-amber-100 text-amber-700"
        titleId={titleId}
        title="Cancelar agendamento?"
        subtitle="O horário fica livre e o agendamento continua no histórico como cancelado."
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{item.titulo}</p>
          <p className="text-xs text-slate-600 first-letter:uppercase">
            {formatDayHeading(dayKey(item.inicio))} • {formatTimeRange(item.inicio, item.fim)}
          </p>
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
        <Button variant="neutral" size="lg" icon={CalendarX2Icon} disabled={pending} onClick={run} className="w-full sm:w-auto">
          {pending ? "Cancelando..." : "Cancelar agendamento"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AgendaCancelModal;
