import { useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CarFrontIcon, ClipboardCheckIcon, ClipboardPlusIcon, MessageSquareTextIcon, PlusIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextAreaField from "../../../components/ui/TextAreaField";
import TextField from "../../../components/ui/TextField";
import { BOXES, MECHANICS } from "../../../mocks/oficina";
import { maskKm } from "../../../utils/masks";
import VehicleFormModal from "../../Veiculos/components/VehicleFormModal";
import { CHANNELS, PRIORITIES, SERVICE_TYPES, toOptions } from "../constants";
import { emptyValues, toOrderData, validateNovaOrdem } from "../ordemForm";
import FuelLevelPicker from "./FuelLevelPicker";
import VehiclePicker from "./VehiclePicker";

function Section({ icon: Icon, title, aside, className, children }) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          <Icon className="size-4" />
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

const priorityOptions = Object.entries(PRIORITIES).map(([value, item]) => ({ value, label: item.label }));
const mechanicOptions = MECHANICS.map((m) => ({ value: m.id, label: `${m.name} — ${m.specialty}` }));

/**
 * Pop-up "Abrir Nova Ordem de Serviço" (horizontal no desktop).
 *
 * Props:
 * - orders / vehicles / clients: listas atuais (veículos já com `openOrder`)
 * - busyBoxes: Map(boxId -> OS) dos boxes ocupados
 * - initialVehicleId: veículo já escolhido (ex.: vindo da ficha do veículo)
 * - createVehicle / createClient / vehicleList: para o cadastro rápido de veículo
 * - onSubmit(data, { startInspection }) · onClose() · onToast(message, tone)
 */
function NovaOrdemModal({
  orders,
  vehicles,
  clients,
  busyBoxes,
  initialVehicleId,
  createVehicle,
  createClient,
  onSubmit,
  onClose,
  onToast,
}) {
  const titleId = useId();
  const formRef = useRef(null);
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const [values, setValues] = useState(() =>
    emptyValues(vehicles.find((vehicle) => vehicle.id === initialVehicleId)),
  );
  const [errors, setErrors] = useState({});
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);

  const vehicle = vehicles.find((item) => item.id === values.vehicleId);
  const activeOrder = vehicle?.openOrder ? orders.find((order) => order.number === vehicle.openOrder) : null;

  const boxOptions = BOXES.map((box) => {
    const busy = busyBoxes.get(box.id);
    return {
      value: box.id,
      label: busy ? `${box.name} — ocupado (OS #${busy.number})` : `${box.name} — ${box.type}`,
      busy: Boolean(busy),
    };
  }).filter((option) => !option.busy);

  const clearError = (name) =>
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    clearError(name);
  };

  const bind = (name, transform = (value) => value) => ({
    name,
    value: values[name],
    onChange: (event) => setField(name, transform(event.target.value)),
  });

  const selectVehicle = (id) => {
    const next = vehicles.find((item) => item.id === id);
    setValues((current) => ({
      ...current,
      vehicleId: id,
      mileageIn: next ? maskKm(String(next.mileage)) : current.mileageIn,
    }));
    clearError("vehicleId");
    clearError("mileageIn");
  };

  const submit = (startInspection) => {
    const found = validateNovaOrdem(values, { vehicle, activeOrder });
    setErrors(found);
    const [firstInvalid] = Object.keys(found);
    if (firstInvalid) {
      const field = formRef.current?.elements.namedItem(firstInvalid);
      (field?.length ? field[0] : field)?.focus?.();
      return;
    }
    onSubmit(toOrderData(values, vehicle), { startInspection });
    onClose();
  };

  return (
    <>
      <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
        <form
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit(true);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ModalHeader
            icon={ClipboardPlusIcon}
            titleId={titleId}
            title="Abrir Nova Ordem de Serviço"
            subtitle="Registre a entrada do veículo. Orçamento, peças e serviços são lançados na própria OS."
            onClose={onClose}
          />

          <ModalBody>
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Section icon={CarFrontIcon} title="1. Veículo & Cliente" className="min-w-0">
                <VehiclePicker
                  vehicles={vehicles}
                  clientsById={clientsById}
                  value={values.vehicleId}
                  onChange={selectVehicle}
                  onCreateVehicle={() => setNewVehicleOpen(true)}
                  error={errors.vehicleId}
                />
                {activeOrder && (
                  <p className="mt-2 text-xs">
                    <Link
                      to={`/ordens-de-servico/${activeOrder.number}`}
                      onClick={onClose}
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Abrir a OS #{activeOrder.number} deste veículo →
                    </Link>
                  </p>
                )}
              </Section>

              <Section
                icon={MessageSquareTextIcon}
                title="2. Atendimento & Relato"
                aside={<span className="text-xs text-slate-500">* Campos obrigatórios</span>}
                className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
              >
                <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6">
                  <SelectField
                    className="sm:col-span-3"
                    label="Tipo de atendimento"
                    required
                    placeholder="Selecione..."
                    options={toOptions(SERVICE_TYPES)}
                    error={errors.type}
                    {...bind("type")}
                  />
                  <SelectField
                    className="sm:col-span-3"
                    label="Canal de entrada"
                    options={toOptions(CHANNELS)}
                    {...bind("channel")}
                  />
                  <SelectField
                    className="sm:col-span-2"
                    label="Prioridade"
                    options={priorityOptions}
                    {...bind("priority")}
                  />
                  <TextField
                    className="sm:col-span-4"
                    label="Resumo (aparece no quadro)"
                    autoComplete="off"
                    maxLength={40}
                    placeholder="Ex.: Revisão 45k + freios"
                    {...bind("title")}
                  />
                  <TextAreaField
                    className="sm:col-span-6"
                    label="Relato do cliente (sintomas e pedidos)"
                    required
                    rows={4}
                    maxLength={600}
                    counter
                    placeholder="Ex.: Barulho metálico ao frear e volante vibrando acima de 80 km/h."
                    error={errors.complaint}
                    {...bind("complaint")}
                  />
                  <TextAreaField
                    className="sm:col-span-6"
                    label="Observações internas (não aparecem para o cliente)"
                    rows={2}
                    maxLength={300}
                    {...bind("internalNotes")}
                  />
                </div>
              </Section>

              <Section icon={ClipboardCheckIcon} title="3. Check-in & Planejamento" className="min-w-0 lg:col-start-1 lg:row-start-2">
                <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
                  <TextField
                    label="Km de entrada"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    inputClassName="font-mono"
                    error={errors.mileageIn}
                    {...bind("mileageIn", maskKm)}
                  />
                  <TextField
                    label="Previsão de entrega"
                    type="datetime-local"
                    error={errors.expectedAt}
                    {...bind("expectedAt")}
                  />
                  <div className="sm:col-span-2">
                    <FuelLevelPicker
                      required
                      value={values.fuelLevel}
                      onChange={(level) => setField("fuelLevel", level)}
                      error={errors.fuelLevel}
                    />
                  </div>
                  <SelectField
                    label="Mecânico responsável"
                    placeholder="Definir depois"
                    options={mechanicOptions}
                    {...bind("mechanicId")}
                  />
                  <SelectField
                    label="Box"
                    placeholder={boxOptions.length ? "Definir depois" : "Nenhum box livre"}
                    options={boxOptions}
                    {...bind("boxId")}
                  />
                </div>
              </Section>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="outline" size="lg" icon={PlusIcon} onClick={() => submit(false)} className="w-full sm:w-auto">
              Abrir OS
            </Button>
            <Button type="submit" size="lg" icon={ClipboardCheckIcon} className="w-full sm:w-auto">
              Abrir OS e Iniciar Vistoria
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {newVehicleOpen && (
        <VehicleFormModal
          mode="create"
          vehicles={vehicles}
          clients={clients}
          createClient={createClient}
          onToast={onToast}
          onClose={() => setNewVehicleOpen(false)}
          onSubmit={(data, { draft }) => {
            const created = createVehicle(data);
            if (draft) {
              onToast("Rascunho salvo. Complete o cadastro do veículo para abrir a OS.", "warning");
              return;
            }
            selectVehicle(created.id);
            setValues((current) => ({ ...current, mileageIn: maskKm(String(created.mileage)) }));
            onToast(`Veículo ${created.plate} cadastrado e selecionado.`);
          }}
        />
      )}
    </>
  );
}

export default NovaOrdemModal;
