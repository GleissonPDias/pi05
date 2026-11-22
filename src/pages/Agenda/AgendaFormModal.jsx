import { useId, useState } from "react";
import { CalendarPlusIcon, SaveIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
import { getBoxes, getMechanics } from "../../services/mechanics";
import { AGENDA_STATUS, agendamentoPayload, validateAgendamento } from "./agendaUtils";

/** Criação e edição de um agendamento. */
function AgendaFormModal({ item, initialValues, onSubmit, onClose }) {
  const titleId = useId();
  const isEdit = Boolean(item);
  const [values, setValues] = useState(() => initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (patch) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const mechanicOptions = [
    { value: "", label: "Sem mecânico definido" },
    ...getMechanics().map((mechanic) => ({ value: String(mechanic.apiId ?? mechanic.id), label: mechanic.name })),
  ];
  const boxOptions = [
    { value: "", label: "Sem box definido" },
    ...getBoxes().map((box) => ({ value: String(box.apiId ?? box.id), label: box.name })),
  ];
  const statusOptions = Object.entries(AGENDA_STATUS).map(([value, { label }]) => ({ value, label }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const found = validateAgendamento(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit(agendamentoPayload(values, { isEdit }));
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Não foi possível salvar o agendamento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={CalendarPlusIcon}
          titleId={titleId}
          title={isEdit ? "Editar agendamento" : "Novo agendamento"}
          subtitle="Reserve horário para um serviço, mecânico e box."
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <TextField
            label="Título"
            required
            data-autofocus
            maxLength={120}
            placeholder="Ex.: Revisão — Gol 2015 (ABC-1D23)"
            value={values.titulo}
            error={errors.titulo}
            onChange={(event) => set({ titulo: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Início"
              type="datetime-local"
              required
              value={values.inicio}
              error={errors.inicio}
              onChange={(event) => set({ inicio: event.target.value })}
            />
            <TextField
              label="Fim"
              type="datetime-local"
              required
              value={values.fim}
              error={errors.fim}
              onChange={(event) => set({ fim: event.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Mecânico" options={mechanicOptions} value={values.mecanicoId} onChange={(event) => set({ mecanicoId: event.target.value })} />
            <SelectField label="Box" options={boxOptions} value={values.boxId} onChange={(event) => set({ boxId: event.target.value })} />
          </div>
          <TextField
            label="Observações"
            maxLength={500}
            value={values.descricao}
            onChange={(event) => set({ descricao: event.target.value })}
          />
          {isEdit && (
            <SelectField label="Situação" options={statusOptions} value={values.status} onChange={(event) => set({ status: event.target.value })} />
          )}
          {submitError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={SaveIcon} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Agendar"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default AgendaFormModal;
