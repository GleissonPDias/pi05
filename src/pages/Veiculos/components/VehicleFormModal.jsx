import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CameraIcon,
  CarFrontIcon,
  CircleCheckIcon,
  FilePenLineIcon,
  PlusIcon,
  SaveIcon,
  SquarePenIcon,
  UserIcon,
  WrenchIcon,
} from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import ClienteFormModal from "../../Clientes/components/ClienteFormModal";
import { maskCpfCnpj, maskKm, maskPlate } from "../../../utils/masks";
import { isValidPlate } from "../../../utils/validators";
import { BRAND_SUGGESTIONS, CATEGORIES, FUELS, TRANSMISSIONS } from "../constants";
import {
  emptyValues,
  toFormValues,
  toVehicleData,
  validateVeiculo,
} from "../vehicleForm";
import { vehicleName } from "../vehicleUtils";
import PhotoUpload from "./PhotoUpload";

function FormSection({ icon: Icon, title, aside, className, children }) {
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

const grid = "grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6";

/** Só dígitos, no máximo 4 (anos). */
const maskYear = (value) => value.replace(/\D/g, "").slice(0, 4);

/** Chassi: maiúsculas, só letras e números, até 17 caracteres. */
const maskChassis = (value) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);

/**
 * Pop-up de cadastro (mode="create") e de edição (mode="edit") de veículo.
 * Renderize apenas enquanto estiver aberto: o formulário é recriado a cada abertura.
 *
 * Props:
 * - mode: "create" | "edit"
 * - vehicle: veículo editado (obrigatório em "edit")
 * - vehicles: lista completa (impede placas duplicadas)
 * - clients: clientes cadastrados (opções do proprietário)
 * - createClient(data): cadastra um cliente e devolve o registro (atalho "+ Novo Cliente")
 * - onSubmit(data, { draft }): recebe os dados validados, já sem máscara
 * - onClose(): fecha o pop-up
 * - onToast(message, tone): exibe um aviso na tela
 */
function VehicleFormModal({
  mode,
  vehicle,
  vehicles,
  clients,
  createClient,
  onSubmit,
  onClose,
  onToast,
}) {
  const isEdit = mode === "edit";
  // Cadastros novos e rascunhos podem ser salvos como rascunho ou finalizados
  const isDraftFlow = !isEdit || vehicle.draft;
  const titleId = useId();
  const formRef = useRef(null);

  const [values, setValues] = useState(() => (isEdit ? toFormValues(vehicle) : emptyValues()));
  const [errors, setErrors] = useState({});
  const [photoUrl, setPhotoUrl] = useState(vehicle?.photoUrl ?? null);
  const [newClientOpen, setNewClientOpen] = useState(false);

  // Endereços temporários das fotos escolhidas: os que não forem salvos são liberados ao fechar
  const photos = useRef({ created: new Set(), saved: null });
  useEffect(() => {
    const state = photos.current;
    return () => {
      state.created.forEach((url) => {
        if (url !== state.saved) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const ownerOptions = useMemo(() => {
    const options = clients
      .filter((client) => client.status === "ativo" || client.id === vehicle?.ownerId)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((client) => ({
        value: client.id,
        label: `${client.name} — ${client.document.length > 11 ? "CNPJ" : "CPF"} ${maskCpfCnpj(client.document)}`,
      }));
    return options;
  }, [clients, vehicle?.ownerId]);

  const clearError = (...names) =>
    setErrors((current) => {
      const next = { ...current };
      names.forEach((name) => delete next[name]);
      return next;
    });

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    clearError(name);
  };

  /** Atualiza um campo; `transform` aplica a máscara, se houver. */
  const bind = (name, transform = (value) => value) => ({
    name,
    value: values[name],
    onChange: (event) => setField(name, transform(event.target.value)),
  });

  const handlePhotoSelect = (file) => {
    const url = URL.createObjectURL(file);
    photos.current.created.add(url);
    setPhotoUrl(url);
  };

  const submit = (draft) => {
    const found = validateVeiculo(values, {
      draft,
      vehicles,
      currentId: vehicle?.id,
    });
    setErrors(found);

    const [firstInvalid] = Object.keys(found);
    if (firstInvalid) {
      formRef.current?.elements.namedItem(firstInvalid)?.focus();
      return;
    }

    photos.current.saved = photoUrl;
    onSubmit(toVehicleData(values, { draft, photoUrl }), { draft });
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(false);
  };

  const handleNewClient = (data) => {
    const created = createClient(data);
    setField("ownerId", created.id);
    onToast(`Cliente "${created.name}" cadastrado e vinculado ao veículo.`);
  };

  const plateIsValid = isValidPlate(values.plate);

  return (
    <>
      <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
        <form
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ModalHeader
            icon={isEdit ? SquarePenIcon : CarFrontIcon}
            titleId={titleId}
            title={
              isEdit ? (
                <>
                  Editar Veículo <span className="whitespace-nowrap">#{vehicle.id}</span>
                </>
              ) : (
                "Cadastrar Novo Veículo na Frota"
              )
            }
            badge={isEdit && vehicle.draft && <Badge variant="slate">Rascunho</Badge>}
            subtitle={
              isEdit
                ? `Editando ${vehicleName(vehicle)} • placa ${maskPlate(vehicle.plate)}`
                : "Preencha os dados técnicos para vincular o veículo ao proprietário e abrir ordens de serviço."
            }
            onClose={onClose}
          />

          <ModalBody>
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              {/* Coluna da esquerda: titularidade e foto */}
              <FormSection
                icon={UserIcon}
                title="1. Identificação & Titularidade"
                className="min-w-0"
              >
                <div className="space-y-4">
                  <SelectField
                    label="Proprietário (Cliente)"
                    required
                    data-autofocus
                    placeholder="Selecione o proprietário..."
                    options={ownerOptions}
                    error={errors.ownerId}
                    labelAddon={
                      <button
                        type="button"
                        onClick={() => setNewClientOpen(true)}
                        className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <PlusIcon className="size-3.5" />
                        Novo Cliente
                      </button>
                    }
                    {...bind("ownerId")}
                  />

                  <TextField
                    label="Placa do Veículo"
                    required
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="ABC-1D23"
                    hint="Padrão Mercosul (ABC-1D23) ou modelo antigo (ABC-1234)."
                    error={errors.plate}
                    inputClassName="font-mono font-bold uppercase tracking-wider"
                    trailing={plateIsValid && <CircleCheckIcon className="size-4 text-emerald-600" />}
                    {...bind("plate", maskPlate)}
                  />
                </div>
              </FormSection>

              {/* Coluna da direita: especificações (ocupa as duas linhas) */}
              <FormSection
                icon={WrenchIcon}
                title="2. Especificações Técnicas"
                aside={<span className="text-xs text-slate-500">* Campos obrigatórios</span>}
                className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
              >
                <div className={grid}>
                  <TextField
                    className="sm:col-span-3"
                    label="Marca"
                    required
                    list="marcas-sugeridas"
                    autoComplete="off"
                    placeholder="Ex.: Volkswagen"
                    error={errors.brand}
                    {...bind("brand")}
                  />
                  <datalist id="marcas-sugeridas">
                    {BRAND_SUGGESTIONS.map((brand) => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>

                  <TextField
                    className="sm:col-span-3"
                    label="Modelo / Versão"
                    required
                    autoComplete="off"
                    placeholder="Ex.: Nivus Highline"
                    error={errors.model}
                    {...bind("model")}
                  />

                  <TextField
                    className="sm:col-span-2"
                    label="Ano Fabricação"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="2023"
                    error={errors.yearManufacture}
                    {...bind("yearManufacture", maskYear)}
                  />
                  <TextField
                    className="sm:col-span-2"
                    label="Ano Modelo"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="2024"
                    error={errors.yearModel}
                    {...bind("yearModel", maskYear)}
                  />
                  <TextField
                    className="sm:col-span-2"
                    label="Cor"
                    required
                    autoComplete="off"
                    placeholder="Cinza Platinum"
                    error={errors.color}
                    {...bind("color")}
                  />

                  <TextField
                    className="sm:col-span-3"
                    label="Quilometragem Atual (km)"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="45.200"
                    error={errors.mileage}
                    inputClassName="font-mono"
                    {...bind("mileage", maskKm)}
                  />
                  <SelectField
                    className="sm:col-span-3"
                    label="Tipo de Combustível"
                    required
                    placeholder="Selecione..."
                    options={FUELS}
                    error={errors.fuel}
                    {...bind("fuel")}
                  />

                  <TextField
                    className="sm:col-span-3"
                    label="Motorização (opcional)"
                    autoComplete="off"
                    placeholder="Ex.: 1.0 TSI Turbo (128 cv)"
                    {...bind("engine")}
                  />
                  <SelectField
                    className="sm:col-span-3"
                    label="Câmbio (opcional)"
                    placeholder="Selecione..."
                    options={TRANSMISSIONS}
                    {...bind("transmission")}
                  />

                  <SelectField
                    className="sm:col-span-3"
                    label="Categoria (opcional)"
                    placeholder="Selecione..."
                    options={CATEGORIES}
                    {...bind("category")}
                  />
                  <TextField
                    className="sm:col-span-3"
                    label="Chassi (opcional)"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="17 caracteres"
                    error={errors.chassis}
                    inputClassName="font-mono uppercase"
                    {...bind("chassis", maskChassis)}
                  />
                </div>
              </FormSection>

              <FormSection
                icon={CameraIcon}
                title="3. Foto do Veículo"
                aside={<span className="text-xs text-slate-500">Opcional</span>}
                className="min-w-0 lg:col-start-1 lg:row-start-2"
              >
                <PhotoUpload
                  url={photoUrl}
                  onSelect={handlePhotoSelect}
                  onRemove={() => setPhotoUrl(null)}
                />
              </FormSection>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
              {isEdit && !isDraftFlow ? "Descartar Alterações" : "Cancelar"}
            </Button>
            {isDraftFlow && (
              <Button
                variant="outline"
                size="lg"
                icon={FilePenLineIcon}
                onClick={() => submit(true)}
                className="w-full sm:w-auto"
              >
                Salvar como Rascunho
              </Button>
            )}
            <Button
              type="submit"
              size="lg"
              icon={isDraftFlow ? PlusIcon : SaveIcon}
              className="w-full sm:w-auto"
            >
              {isDraftFlow ? "Salvar e Cadastrar Veículo" : "Salvar Alterações"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Fica ao lado (não dentro) do modal do veículo para não misturar teclado e envio */}
      {newClientOpen && (
        <ClienteFormModal
          mode="create"
          clients={clients}
          onSubmit={handleNewClient}
          onClose={() => setNewClientOpen(false)}
        />
      )}
    </>
  );
}

export default VehicleFormModal;
