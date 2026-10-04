import { useId, useRef, useState } from "react";
import {
  CarFrontIcon,
  CircleCheckIcon,
  IdCardIcon,
  LoaderCircleIcon,
  LockIcon,
  MapPinIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  SquarePenIcon,
  UserPlusIcon,
  WrenchIcon,
} from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { fetchAddressByCep } from "../../../services/cep";
import { formatDateTime } from "../../../utils/dates";
import {
  isMobilePhone,
  maskCep,
  maskCpfCnpj,
  maskPhone,
} from "../../../utils/masks";
import { isValidCpfCnpj } from "../../../utils/validators";
import { vehiclesList } from "../clienteFilters";
import {
  emptyValues,
  toClientData,
  toFormValues,
  validateCliente,
} from "../clienteForm";
import { CLASSIFICATIONS, STATES, STATUS_OPTIONS } from "../constants";

function FormSection({ icon: Icon, title, aside, children }) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          <Icon className="size-4" />
          {title}
        </h3>
        {aside}
      </div>
      <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6">
        {children}
      </div>
    </section>
  );
}

function SummaryItem({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-blue-600" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-600">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{children}</p>
      </div>
    </div>
  );
}

/**
 * Pop-up de cadastro (mode="create") e de edição (mode="edit") de cliente.
 * Renderize apenas enquanto estiver aberto: o formulário é recriado a cada abertura.
 *
 * Props:
 * - mode: "create" | "edit"
 * - client: cliente editado (obrigatório em "edit")
 * - clients: lista completa (usada para impedir documentos duplicados)
 * - onSubmit(data): recebe os dados validados, já sem máscara
 * - onClose(): fecha o pop-up
 */
function ClienteFormModal({ mode, client, clients, onSubmit, onClose }) {
  const isEdit = mode === "edit";
  const titleId = useId();
  const formRef = useRef(null);

  const [values, setValues] = useState(() =>
    isEdit ? toFormValues(client) : emptyValues(),
  );
  const [errors, setErrors] = useState({});
  const [cep, setCep] = useState({ loading: false, error: "" });

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

  /** Atualiza um campo de texto; `transform` aplica a máscara, se houver. */
  const bind = (name, transform = (value) => value) => ({
    name,
    value: values[name],
    onChange: (event) => setField(name, transform(event.target.value)),
  });

  const handlePhoneChange = (event) => {
    const phone = maskPhone(event.target.value);
    setValues((current) => ({
      ...current,
      phone,
      // No cadastro, marca o WhatsApp sozinho quando o número vira um celular
      // (detecção apenas pelo formato; a confirmação real virá da API)
      hasWhatsapp:
        !isEdit && !isMobilePhone(current.phone) && isMobilePhone(phone)
          ? true
          : current.hasWhatsapp,
    }));
    clearError("phone");
  };

  const handleCepSearch = async () => {
    setCep({ loading: true, error: "" });
    try {
      const address = await fetchAddressByCep(values.cep);
      setValues((current) => ({ ...current, ...address }));
      clearError("cep", "street", "district", "city", "state");
      setCep({ loading: false, error: "" });
      formRef.current?.elements.namedItem("number")?.focus();
    } catch (error) {
      setCep({ loading: false, error: error.message });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const found = validateCliente(values, {
      mode,
      clients,
      currentId: client?.id,
    });
    setErrors(found);

    const [firstInvalid] = Object.keys(found);
    if (firstInvalid) {
      formRef.current?.elements.namedItem(firstInvalid)?.focus();
      return;
    }

    onSubmit(toClientData(values));
    onClose();
  };

  const showWhatsappBadge = values.hasWhatsapp && isMobilePhone(values.phone);

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ModalHeader
          icon={isEdit ? SquarePenIcon : UserPlusIcon}
          titleId={titleId}
          title={
            isEdit ? (
              <>
                Editar Cliente{" "}
                <span className="whitespace-nowrap">#{client.id}</span>
              </>
            ) : (
              "Cadastrar Novo Cliente"
            )
          }
          badge={
            isEdit && (
              <Badge variant={client.status === "ativo" ? "green" : "slate"}>
                {client.status === "ativo" ? "Ativo" : "Inativo"}
              </Badge>
            )
          }
          subtitle={
            isEdit ? (
              <>
                Editando dados de <strong>{client.name}</strong>
              </>
            ) : (
              "Preencha os dados cadastrais para vincular veículos e emitir ordens de serviço."
            )
          }
          onClose={onClose}
        />

        <ModalBody>
          {isEdit && (
            <div className="mb-6 grid gap-3 rounded-lg bg-blue-50 p-4 sm:grid-cols-2">
              <SummaryItem icon={CarFrontIcon} label="Veículos vinculados">
                {client.vehicles.length === 0
                  ? "Nenhum veículo"
                  : `${client.vehicles.length} (${vehiclesList(client.vehicles)})`}
              </SummaryItem>
              <SummaryItem icon={WrenchIcon} label="Histórico de serviços">
                {client.servicesCompleted === 1
                  ? "1 ordem de serviço concluída"
                  : `${client.servicesCompleted} ordens de serviço concluídas`}
              </SummaryItem>
            </div>
          )}

          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
            {/* Coluna 1: dados pessoais e contato */}
            <FormSection
              icon={IdCardIcon}
              title="1. Dados pessoais & contato"
              aside={
                <span className="text-xs text-slate-500">* Campos obrigatórios</span>
              }
            >
              <TextField
                className="sm:col-span-6"
                label="Nome Completo / Razão Social"
                required
                data-autofocus
                autoComplete="off"
                placeholder="Ex.: Roberto Alencar Lima"
                error={errors.name}
                {...bind("name")}
              />

              <TextField
                className="sm:col-span-3"
                label={isEdit ? "CPF / CNPJ (bloqueado)" : "CPF / CNPJ"}
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                disabled={isEdit}
                error={errors.document}
                trailing={
                  isEdit ? (
                    <LockIcon className="size-4 text-slate-500" />
                  ) : (
                    isValidCpfCnpj(values.document) && (
                      <CircleCheckIcon className="size-4 text-emerald-600" />
                    )
                  )
                }
                {...bind("document", maskCpfCnpj)}
              />
              <TextField
                className="sm:col-span-3"
                label="E-mail Principal"
                required
                type="email"
                autoComplete="off"
                placeholder="nome@email.com"
                error={errors.email}
                {...bind("email")}
              />

              <TextField
                className="sm:col-span-3"
                label="Telefone / WhatsApp"
                required
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="(11) 98765-4321"
                error={errors.phone}
                labelAddon={
                  showWhatsappBadge && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      WhatsApp
                    </span>
                  )
                }
                name="phone"
                value={values.phone}
                onChange={handlePhoneChange}
              />
              <TextField
                className="sm:col-span-3"
                label="Telefone Secundário (opcional)"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="(11) 3244-1000"
                error={errors.phoneSecondary}
                {...bind("phoneSecondary", maskPhone)}
              />

              {isEdit && (
                <>
                  <SelectField
                    className="sm:col-span-3"
                    label="Classificação do Cliente"
                    options={CLASSIFICATIONS}
                    {...bind("classification")}
                  />
                  <SelectField
                    className="sm:col-span-3"
                    label="Situação do Cadastro"
                    options={STATUS_OPTIONS}
                    {...bind("status")}
                  />
                </>
              )}

              <div className="space-y-2.5 rounded-lg bg-blue-50 p-3 sm:col-span-6">
                <Checkbox
                  checked={values.hasWhatsapp}
                  onChange={(event) => setField("hasWhatsapp", event.target.checked)}
                >
                  <strong className="text-blue-700">Número possui WhatsApp ativo</strong>{" "}
                  para envio de status de OS, fotos de peças e aprovação ágil de
                  orçamentos.
                </Checkbox>
                <Checkbox
                  checked={values.acceptsComms}
                  onChange={(event) => setField("acceptsComms", event.target.checked)}
                >
                  Cliente autoriza comunicações e avisos preventivos de revisão
                  periódica e troca de óleo (em conformidade com a LGPD).
                </Checkbox>
              </div>
            </FormSection>

            {/* Coluna 2: endereço */}
            <FormSection icon={MapPinIcon} title="2. Endereço da oficina / residencial">
              <div className="flex items-start gap-2 sm:col-span-6">
                <TextField
                  className="min-w-0 flex-1"
                  label="CEP"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00000-000"
                  error={errors.cep || cep.error}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleCepSearch();
                    }
                  }}
                  {...bind("cep", maskCep)}
                />
                <Button
                  variant="outline"
                  size="lg"
                  icon={cep.loading ? LoaderCircleIcon : SearchIcon}
                  onClick={handleCepSearch}
                  disabled={cep.loading}
                  className="mt-[1.625rem] shrink-0 bg-blue-50"
                >
                  {cep.loading ? "Buscando..." : "Buscar CEP"}
                </Button>
              </div>

              <TextField
                className="sm:col-span-6"
                label="Logradouro / Rua"
                required
                autoComplete="off"
                placeholder="Ex.: Rua Funchal"
                error={errors.street}
                {...bind("street")}
              />

              <TextField
                className="sm:col-span-2"
                label="Número"
                required
                autoComplete="off"
                placeholder="418"
                error={errors.number}
                {...bind("number")}
              />
              <TextField
                className="sm:col-span-4"
                label="Complemento"
                autoComplete="off"
                placeholder="Ex.: 35º andar"
                {...bind("complement")}
              />

              <TextField
                className="sm:col-span-6"
                label="Bairro"
                required
                autoComplete="off"
                placeholder="Ex.: Vila Olímpia"
                error={errors.district}
                {...bind("district")}
              />

              <TextField
                className="sm:col-span-3"
                label="Cidade"
                required
                autoComplete="off"
                placeholder="Ex.: São Paulo"
                error={errors.city}
                {...bind("city")}
              />
              <SelectField
                className="sm:col-span-3"
                label="UF (Estado)"
                required
                placeholder="Selecione"
                options={STATES}
                error={errors.state}
                {...bind("state")}
              />
            </FormSection>
          </div>
        </ModalBody>

        <ModalFooter>
          {isEdit && (
            <p className="text-xs text-slate-600 sm:mr-auto">
              Última modificação: <strong>{formatDateTime(client.updatedAt)}</strong>{" "}
              • Operador: <strong>{client.updatedBy}</strong>
            </p>
          )}
          <Button
            variant="soft"
            size="lg"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {isEdit ? "Descartar Alterações" : "Cancelar"}
          </Button>
          <Button
            type="submit"
            size="lg"
            icon={isEdit ? SaveIcon : PlusIcon}
            className="w-full sm:w-auto"
          >
            {isEdit ? "Salvar Alterações" : "Salvar Cadastro de Cliente"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default ClienteFormModal;
