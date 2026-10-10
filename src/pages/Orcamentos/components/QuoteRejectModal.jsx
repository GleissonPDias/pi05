import { useId, useState } from "react";
import { ThumbsDownIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextAreaField from "../../../components/ui/TextAreaField";
import { toOptions } from "../../OrdensServico/constants";
import { REJECT_REASONS, RESPONSE_CHANNELS } from "../constants";

/** Registra a rejeição da proposta (o motivo alimenta a análise comercial). */
function QuoteRejectModal({ quote, onConfirm, onClose }) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [channel, setChannel] = useState(quote.sentChannel ?? "whatsapp");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!reason) {
      setError("Selecione o motivo.");
      return;
    }
    if (reason === "Outro motivo" && note.trim().length < 5) {
      setError("Descreva o motivo.");
      return;
    }
    onConfirm({ reason: reason === "Outro motivo" ? note.trim() : reason, channel });
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={ThumbsDownIcon}
          iconClassName="bg-red-100 text-red-700"
          titleId={titleId}
          title={`Registrar Rejeição — ${quote.id}`}
          subtitle="O motivo ajuda a entender por que as propostas não fecham."
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <SelectField
            label="Motivo da rejeição"
            required
            data-autofocus
            placeholder="Selecione..."
            options={REJECT_REASONS}
            value={reason}
            error={error && !reason ? error : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
          />
          <TextAreaField
            label={reason === "Outro motivo" ? "Descreva o motivo" : "Observação (opcional)"}
            required={reason === "Outro motivo"}
            rows={2}
            maxLength={200}
            value={note}
            error={error && reason ? error : undefined}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
          />
          <SelectField label="Resposta recebida por" options={toOptions(RESPONSE_CHANNELS)} value={channel} onChange={(event) => setChannel(event.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            Voltar
          </Button>
          <Button type="submit" variant="danger" size="lg" icon={ThumbsDownIcon} className="w-full sm:w-auto">
            Registrar Rejeição
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default QuoteRejectModal;
