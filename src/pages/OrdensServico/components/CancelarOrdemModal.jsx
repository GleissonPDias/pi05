import { useId, useState } from "react";
import { CircleSlashIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextAreaField from "../../../components/ui/TextAreaField";
import { CANCEL_REASONS } from "../constants";
import { formatOrderNumber } from "../ordemUtils";
import OrdemSummary from "./OrdemSummary";

/**
 * Pop-up de cancelamento da OS (motivo obrigatório para auditoria).
 * - order: OS com `vehicle` e `client`
 * - onConfirm({ reason, note })
 */
function CancelarOrdemModal({ order, onConfirm, onClose }) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const needsNote = reason === "Outro motivo";

  const handleSubmit = (event) => {
    event.preventDefault();
    if (needsNote && note.trim().length < 5) {
      setError("Descreva o motivo do cancelamento.");
      return;
    }
    onConfirm({ reason: needsNote ? note.trim() : reason, note: note.trim() });
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <ModalHeader
          icon={TriangleAlertIcon}
          iconClassName="bg-red-600 text-white"
          className="border-red-100 bg-red-50"
          subtitleClassName="text-red-700"
          titleId={titleId}
          title={`Cancelar OS ${formatOrderNumber(order.number)}?`}
          subtitle="A ordem será encerrada e sairá do quadro do pátio."
          onClose={onClose}
        />

        <ModalBody className="space-y-5">
          <OrdemSummary order={order} />

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
              <ShieldCheckIcon className="size-4" />
              O que acontece ao cancelar
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>O box e o mecânico ficam livres para outras ordens.</li>
              <li>As peças reservadas voltam a ficar disponíveis no estoque.</li>
              <li>O histórico (vistoria, orçamento e linha do tempo) continua registrado.</li>
            </ul>
          </div>

          <SelectField
            label="Motivo do cancelamento"
            required
            data-autofocus
            placeholder="Selecione o motivo..."
            options={CANCEL_REASONS}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />

          <TextAreaField
            label={needsNote ? "Descreva o motivo" : "Observação (opcional)"}
            required={needsNote}
            rows={2}
            maxLength={300}
            counter
            value={note}
            error={error}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
          />

          <div className="rounded-lg bg-red-50 p-3">
            <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="text-sm">
              Confirmo o cancelamento desta ordem de serviço.
            </Checkbox>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            Voltar
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="lg"
            icon={CircleSlashIcon}
            disabled={!reason || !confirmed}
            className="w-full sm:w-auto"
          >
            Cancelar OS
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default CancelarOrdemModal;
