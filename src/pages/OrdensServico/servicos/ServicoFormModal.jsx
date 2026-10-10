import { useId, useRef, useState } from "react";
import { ClockIcon, PackageIcon, SaveIcon, SquarePenIcon, WandSparklesIcon, WrenchIcon, XIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import MoneyInput from "../../../components/ui/MoneyInput";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { useEstoque } from "../../../hooks/useEstoque";
import { SERVICE_CATEGORIES } from "../../../mocks/catalogo";
import { formatBRL } from "../../../utils/format";
import { LABOR_RATE, validateService, warrantyOptions } from "./servicoUtils";

const categoryOptions = SERVICE_CATEGORIES.map((category) => ({ value: category, label: category }));

function Section({ icon: Icon, title, aside, children, className }) {
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

/**
 * Pop-up de cadastro / edição de serviço do catálogo.
 * - service: serviço editado (ausente = novo) · services: catálogo (evita duplicados)
 * - onSubmit(data) · onClose()
 */
function ServicoFormModal({ service, services, onSubmit, onClose }) {
  const isEdit = Boolean(service);
  const { parts, partsByCode } = useEstoque();
  const titleId = useId();
  const formRef = useRef(null);
  const [values, setValues] = useState(() => ({
    description: service?.description ?? "",
    detail: service?.detail ?? "",
    category: service?.category ?? "",
    hours: service?.hours ?? 1,
    price: service?.price ?? 0,
    warranty: service?.warranty ?? "90d-5000",
    suggestedParts: service?.suggestedParts ?? [],
    status: service?.status ?? "ativo",
  }));
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const bind = (name) => ({ name, value: values[name], onChange: (event) => setField(name, event.target.value) });
  const rate = Number(values.hours) > 0 ? values.price / Number(values.hours) : 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateService(values, { services, currentCode: service?.code });
    setErrors(found);
    const [first] = Object.keys(found);
    if (first) {
      formRef.current?.elements.namedItem(first)?.focus();
      return;
    }
    onSubmit({
      ...values,
      description: values.description.trim(),
      detail: values.detail.trim(),
      hours: Number(values.hours),
    });
    onClose();
  };

  const availableParts = parts.filter((part) => part.status === "ativo" && !values.suggestedParts.includes(part.code));

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={isEdit ? SquarePenIcon : WrenchIcon}
          titleId={titleId}
          title={isEdit ? `Editar Serviço ${service.code}` : "Cadastrar Novo Serviço"}
          subtitle={
            isEdit
              ? "As alterações valem para novas OS e orçamentos. Os já emitidos mantêm o valor antigo."
              : "O serviço fica disponível na tabela de mão de obra das OS e dos orçamentos."
          }
          onClose={onClose}
        />

        <ModalBody>
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
            <Section
              icon={WrenchIcon}
              title="1. Identificação"
              aside={<span className="text-xs text-slate-500">* Campos obrigatórios</span>}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  className="sm:col-span-2"
                  label="Descrição do serviço"
                  required
                  data-autofocus
                  autoComplete="off"
                  maxLength={90}
                  placeholder="Ex.: Substituição de Pastilhas de Freio Traseiras"
                  error={errors.description}
                  {...bind("description")}
                />
                <TextField
                  className="sm:col-span-2"
                  label="Detalhe (aparece abaixo da descrição)"
                  autoComplete="off"
                  maxLength={90}
                  placeholder="Ex.: Inclui limpeza e regulagem"
                  {...bind("detail")}
                />
                <SelectField label="Categoria" required placeholder="Selecione..." options={categoryOptions} error={errors.category} {...bind("category")} />
                <SelectField label="Garantia padrão" options={warrantyOptions} {...bind("warranty")} />
                {isEdit && (
                  <SelectField
                    label="Situação"
                    options={[
                      { value: "ativo", label: "Ativo (disponível)" },
                      { value: "inativo", label: "Inativo (oculto em novas OS)" },
                    ]}
                    {...bind("status")}
                  />
                )}
              </div>
            </Section>

            <div className="space-y-8">
              <Section icon={ClockIcon} title="2. Tempo & preço">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Tempo padrão — TMO (horas)"
                    required
                    type="number"
                    min="0"
                    step="0.1"
                    error={errors.hours}
                    {...bind("hours")}
                  />
                  <div>
                    <span className="mb-1.5 flex min-h-5 items-center text-xs font-semibold text-slate-700">Valor da mão de obra</span>
                    <MoneyInput value={values.price} onChange={(price) => setField("price", price)} aria-label="Valor da mão de obra" className="[&_input]:py-2.5" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 p-3 text-xs text-slate-700">
                  <span>
                    Valor por hora: <strong>{rate ? `${formatBRL(rate)}/h` : "—"}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={WandSparklesIcon}
                    onClick={() => setField("price", Math.round(Number(values.hours || 0) * LABOR_RATE))}
                  >
                    Sugerir pelo valor-hora ({formatBRL(LABOR_RATE, 0)}/h)
                  </Button>
                </div>
              </Section>

              <Section icon={PackageIcon} title="3. Peças sugeridas" aside={<span className="text-xs text-slate-500">Opcional</span>}>
                <p className="mb-3 text-xs text-slate-600">
                  Ao lançar o serviço em uma OS ou orçamento, o sistema oferece estas peças junto.
                </p>
                <SelectField
                  label="Adicionar peça sugerida"
                  placeholder="Selecione uma peça do estoque..."
                  options={availableParts.map((part) => ({ value: part.code, label: `${part.code} — ${part.description}` }))}
                  value=""
                  onChange={(event) => event.target.value && setField("suggestedParts", [...values.suggestedParts, event.target.value])}
                />
                {values.suggestedParts.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Peças sugeridas">
                    {values.suggestedParts.map((code) => (
                      <li key={code} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs font-semibold text-slate-700">
                        <span className="font-mono">{code}</span>
                        <span className="max-w-48 truncate font-normal">{partsByCode.get(code)?.description}</span>
                        <button
                          type="button"
                          onClick={() => setField("suggestedParts", values.suggestedParts.filter((item) => item !== code))}
                          aria-label={`Remover ${code}`}
                          className="grid size-5 place-items-center rounded-full hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            {isEdit ? "Descartar Alterações" : "Cancelar"}
          </Button>
          <Button type="submit" size="lg" icon={SaveIcon} className="w-full sm:w-auto">
            {isEdit ? "Salvar Alterações" : "Cadastrar Serviço"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default ServicoFormModal;
