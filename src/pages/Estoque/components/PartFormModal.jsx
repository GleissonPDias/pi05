import { useId, useRef, useState } from "react";
import { BoxesIcon, PackagePlusIcon, SaveIcon, SquarePenIcon, TagIcon, Trash2Icon, WarehouseIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import MoneyInput from "../../../components/ui/MoneyInput";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { PART_CATEGORIES, SUPPLIERS } from "../../../mocks/catalogo";
import { formatBRL } from "../../../utils/format";
import { DEFAULT_MARKUP, UNITS } from "../constants";

const categoryOptions = PART_CATEGORIES.map((category) => ({ value: category, label: category }));
const supplierOptions = SUPPLIERS.map((supplier) => ({ value: supplier.id, label: supplier.name }));
const round = (value) => Math.round(value * 100) / 100;

function Section({ icon: Icon, title, aside, children }) {
  return (
    <section>
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

const cleanCode = (value) => value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);

/**
 * Cadastro / edição de peça.
 * - part: peça editada (ausente = nova) · parts: catálogo (evita códigos repetidos)
 * - onSubmit(data) · onDelete() (só na edição) · onClose()
 */
function PartFormModal({ part, parts, onSubmit, onDelete, onClose }) {
  const isEdit = Boolean(part);
  const titleId = useId();
  const formRef = useRef(null);
  const [values, setValues] = useState(() => ({
    code: part?.code ?? "",
    oem: part?.oem ?? "",
    description: part?.description ?? "",
    brand: part?.brand ?? "",
    category: part?.category ?? "",
    application: part?.application ?? "",
    unit: part?.unit ?? "un",
    note: part?.note ?? "",
    cost: part?.cost ?? 0,
    price: part?.price ?? 0,
    stock: 0,
    minStock: String(part?.minStock ?? 2),
    maxStock: String(part?.maxStock ?? 6),
    location: part?.location ?? "",
    supplierId: part?.supplierId ?? "",
    status: part?.status ?? "ativo",
  }));
  const [errors, setErrors] = useState({});

  const set = (patch) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };
  const bind = (name, transform = (value) => value) => ({
    name,
    value: values[name],
    onChange: (event) => set({ [name]: transform(event.target.value) }),
  });

  const markupValue = values.cost > 0 ? ((values.price - values.cost) / values.cost) * 100 : 0;
  const marginValue = values.price > 0 ? ((values.price - values.cost) / values.price) * 100 : 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = {};
    if (!isEdit) {
      if (values.code.length < 3) found.code = "Informe o código (SKU) da peça.";
      else if (parts.some((item) => item.code === values.code)) found.code = "Já existe uma peça com este código.";
    }
    if (values.description.trim().length < 4) found.description = "Descreva a peça.";
    if (!values.brand.trim()) found.brand = "Informe o fabricante / marca.";
    if (!values.category) found.category = "Selecione a categoria.";
    if (!(values.cost > 0)) found.cost = "Informe o custo.";
    if (!(values.price > 0)) found.price = "Informe o preço de venda.";
    else if (values.price < values.cost) found.price = "O preço de venda está abaixo do custo.";
    if (Number(values.maxStock) && Number(values.maxStock) < Number(values.minStock)) found.maxStock = "O máximo deve ser maior que o mínimo.";
    setErrors(found);
    const [first] = Object.keys(found);
    if (first) {
      formRef.current?.elements.namedItem(first)?.focus();
      return;
    }
    const data = {
      ...values,
      description: values.description.trim(),
      brand: values.brand.trim(),
      application: values.application.trim(),
      note: values.note.trim(),
      oem: values.oem.trim(),
      location: values.location.trim().toUpperCase(),
      minStock: Number(values.minStock) || 0,
      maxStock: Number(values.maxStock) || 0,
      stock: Number(values.stock) || 0,
    };
    if (isEdit) {
      delete data.code;
      delete data.stock;
    }
    onSubmit(data);
    onClose();
  };

  const moneyField = (name, label, extra) => (
    <div>
      <span className="mb-1.5 flex min-h-5 items-center text-xs font-semibold text-slate-700">
        {label} <span aria-hidden="true" className="ml-1 text-red-600">*</span>
      </span>
      <MoneyInput
        name={name}
        value={values[name]}
        aria-label={label}
        aria-invalid={errors[name] ? true : undefined}
        onChange={(value) => set({ [name]: value })}
        className="[&_input]:py-2.5"
      />
      {errors[name] ? <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p> : extra}
    </div>
  );

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={isEdit ? SquarePenIcon : PackagePlusIcon}
          titleId={titleId}
          title={isEdit ? `Editar Peça ${part.code}` : "Nova Peça / Produto"}
          subtitle={
            isEdit
              ? "A quantidade em estoque muda só por movimentação (entrada, saída ou ajuste)."
              : "Cadastre a peça no almoxarifado para usar nas OS e nos orçamentos."
          }
          onClose={onClose}
        />

        <ModalBody>
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
            <Section icon={TagIcon} title="1. Identificação" aside={<span className="text-xs text-slate-500">* Campos obrigatórios</span>}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Código interno (SKU)"
                  required
                  data-autofocus
                  disabled={isEdit}
                  autoComplete="off"
                  placeholder="Ex.: PF-2041"
                  inputClassName="font-mono uppercase"
                  error={errors.code}
                  {...bind("code", cleanCode)}
                />
                <TextField label="Código OEM (opcional)" autoComplete="off" placeholder="Código original" inputClassName="font-mono" {...bind("oem")} />
                <TextField className="sm:col-span-2" label="Descrição da peça" required autoComplete="off" maxLength={90} error={errors.description} {...bind("description")} />
                <TextField label="Fabricante / marca" required autoComplete="off" placeholder="Ex.: Bosch" error={errors.brand} {...bind("brand")} />
                <SelectField label="Categoria" required placeholder="Selecione..." options={categoryOptions} error={errors.category} {...bind("category")} />
                <TextField className="sm:col-span-2" label="Aplicação / compatibilidade" autoComplete="off" placeholder="Ex.: VW Nivus / T-Cross / Polo" {...bind("application")} />
                <SelectField label="Unidade" options={UNITS} {...bind("unit")} />
                <TextField label="Observação técnica" autoComplete="off" placeholder="Ex.: Norma VW 508.00" {...bind("note")} />
              </div>
            </Section>

            <div className="space-y-8">
              <Section icon={BoxesIcon} title="2. Preço & margem">
                <div className="grid gap-4 sm:grid-cols-3">
                  {moneyField("cost", "Custo unitário")}
                  <TextField
                    label="Markup (%)"
                    type="number"
                    min="0"
                    step="1"
                    value={Math.round(markupValue)}
                    onChange={(event) => set({ price: round(values.cost * (1 + Number(event.target.value) / 100)) })}
                    hint="Ajusta a venda"
                  />
                  {moneyField("price", "Preço de venda")}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 p-3 text-xs text-slate-700">
                  <span>
                    Lucro por unidade: <strong>{formatBRL(Math.max(0, values.price - values.cost))}</strong> • Margem bruta{" "}
                    <strong>{marginValue.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => set({ price: round(values.cost * (1 + DEFAULT_MARKUP / 100)) })} disabled={!values.cost}>
                    Aplicar markup padrão ({DEFAULT_MARKUP}%)
                  </Button>
                </div>
              </Section>

              <Section icon={WarehouseIcon} title="3. Estoque & reposição">
                <div className="grid gap-4 sm:grid-cols-3">
                  {isEdit ? (
                    <div>
                      <span className="mb-1.5 flex min-h-5 items-center text-xs font-semibold text-slate-700">Estoque atual</span>
                      <p className="rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700">
                        {part.stock} {part.unit}
                      </p>
                    </div>
                  ) : (
                    <TextField label="Estoque inicial" type="number" min="0" {...bind("stock")} />
                  )}
                  <TextField label="Estoque mínimo" type="number" min="0" hint="Ponto de pedido" {...bind("minStock")} />
                  <TextField label="Estoque ideal" type="number" min="0" error={errors.maxStock} hint="Base da compra" {...bind("maxStock")} />
                  <TextField label="Prateleira" autoComplete="off" placeholder="Ex.: A1-03" inputClassName="uppercase" {...bind("location")} />
                  <SelectField className="sm:col-span-2" label="Fornecedor preferencial" placeholder="Selecione..." options={supplierOptions} {...bind("supplierId")} />
                  {isEdit && (
                    <SelectField
                      className="sm:col-span-3"
                      label="Situação"
                      options={[
                        { value: "ativo", label: "Ativa (disponível para OS e orçamentos)" },
                        { value: "inativo", label: "Inativa (descontinuada — some das buscas)" },
                      ]}
                      {...bind("status")}
                    />
                  )}
                </div>
              </Section>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className={isEdit ? "sm:justify-between" : undefined}>
          {isEdit && (
            <Button variant="outline" icon={Trash2Icon} onClick={onDelete} className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto">
              Excluir
            </Button>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" size="lg" icon={SaveIcon} className="w-full sm:w-auto">
              {isEdit ? "Salvar Alterações" : "Cadastrar Peça"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default PartFormModal;
