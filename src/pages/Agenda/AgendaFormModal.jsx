import { useId, useMemo, useState } from "react";
import { CalendarPlusIcon, PencilIcon, SaveIcon, TriangleAlertIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import SelectField from "../../components/ui/SelectField";
import TextAreaField from "../../components/ui/TextAreaField";
import TextField from "../../components/ui/TextField";
import { useVeiculos } from "../../hooks/useVeiculos";
import { getBox, getBoxes, getMechanic, getMechanics } from "../../services/mechanics";
import {
  AGENDA_STATUS,
  DURATIONS,
  agendamentoPayload,
  durationLabel,
  findConflicts,
  formatTimeRange,
  validateAgendamento,
  valuesRange,
} from "./agendaUtils";

/**
 * Criação e edição de um agendamento.
 * - items: agendamentos já carregados (para avisar choque de mecânico ou box)
 */
function AgendaFormModal({ item, initialValues, items = [], onSubmit, onClose }) {
  const titleId = useId();
  const listId = useId();
  const isEdit = Boolean(item);
  const { vehicles = [] } = useVeiculos();
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
    ...getBoxes()
      .filter((box) => box.active !== false)
      .map((box) => ({ value: String(box.apiId ?? box.id), label: box.type ? `${box.name} — ${box.type}` : box.name })),
  ];
  const durationOptions = [...new Set([...DURATIONS, Number(values.duracao)])]
    .filter((minutes) => minutes > 0)
    .sort((a, b) => a - b)
    .map((minutes) => ({ value: String(minutes), label: durationLabel(minutes) }));
  const statusOptions = Object.entries(AGENDA_STATUS).map(([value, { label }]) => ({ value, label }));

  /** Sugestões para o título: "SERVIÇO — MODELO (PLACA)". */
  const suggestions = useMemo(
    () => vehicles.filter((vehicle) => vehicle.plate).map((vehicle) => `${vehicle.model ?? "Veículo"} (${vehicle.plate})`.toUpperCase()),
    [vehicles],
  );

  const range = valuesRange(values);
  const conflicts = findConflicts(values, items, item?.id);

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
          icon={isEdit ? PencilIcon : CalendarPlusIcon}
          titleId={titleId}
          title={isEdit ? "Editar agendamento" : "Novo agendamento"}
          subtitle="Reserve o horário do serviço, o mecânico e o box."
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <TextField
            label="Serviço e veículo"
            required
            data-autofocus
            maxLength={120}
            list={listId}
            placeholder="Ex.: Revisão 40.000 km — Gol 2015 (ABC-1D23)"
            hint="Comece digitando o modelo ou a placa para ver os veículos cadastrados."
            value={values.titulo}
            error={errors.titulo}
            onChange={(event) => set({ titulo: event.target.value })}
          />
          <datalist id={listId}>
            {suggestions.map((text) => (
              <option key={text} value={text} />
            ))}
          </datalist>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Data"
              type="date"
              required
              value={values.data}
              error={errors.data}
              onChange={(event) => set({ data: event.target.value })}
            />
            <TextField
              label="Horário"
              type="time"
              required
              step={900}
              value={values.hora}
              error={errors.hora}
              onChange={(event) => set({ hora: event.target.value })}
            />
            <SelectField
              label="Duração"
              required
              options={durationOptions}
              value={values.duracao}
              error={errors.duracao}
              onChange={(event) => set({ duracao: event.target.value })}
            />
          </div>
          {range && (
            <p className="-mt-2 text-xs text-slate-600" aria-live="polite">
              Reservado das <strong className="text-slate-900">{formatTimeRange(range.inicio, range.fim)}</strong>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Mecânico"
              options={mechanicOptions}
              value={values.mecanicoId}
              onChange={(event) => set({ mecanicoId: event.target.value })}
            />
            <SelectField label="Box" options={boxOptions} value={values.boxId} onChange={(event) => set({ boxId: event.target.value })} />
          </div>

          {conflicts.length > 0 && (
            <div role="status" className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">Horário já ocupado</p>
                <ul className="mt-0.5 space-y-0.5 text-xs">
                  {conflicts.map(({ item: other, reason }) => (
                    <li key={`${other.id}-${reason}`}>
                      {reason === "mecanico"
                        ? `${getMechanic(other.mecanicoId)?.name ?? "O mecânico"} já atende`
                        : `${getBox(other.boxId)?.name ?? "O box"} já está reservado para`}{" "}
                      “{other.titulo}” ({formatTimeRange(other.inicio, other.fim)}).
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs">Você pode salvar mesmo assim ou escolher outro horário.</p>
              </div>
            </div>
          )}

          <TextAreaField
            label="Observações"
            rows={2}
            maxLength={500}
            counter
            placeholder="Ex.: cliente vai aguardar na oficina, trazer o manual..."
            value={values.descricao}
            onChange={(event) => set({ descricao: event.target.value })}
          />
          {isEdit && (
            <SelectField
              label="Situação"
              options={statusOptions}
              value={values.status}
              onChange={(event) => set({ status: event.target.value })}
            />
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
