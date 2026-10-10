import { useId, useMemo, useRef, useState } from "react";
import { FileTextIcon, ListPlusIcon, MessageCircleIcon, PercentIcon, SaveIcon, SquarePenIcon, UserIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import MoneyInput from "../../../components/ui/MoneyInput";
import SelectField from "../../../components/ui/SelectField";
import TextAreaField from "../../../components/ui/TextAreaField";
import TextField from "../../../components/ui/TextField";
import { CONSULTANTS } from "../../../mocks/oficina";
import { currentUser } from "../../../mocks/user";
import { formatBRL } from "../../../utils/format";
import AdicionarPecaModal from "../../OrdensServico/detalhe/AdicionarPecaModal";
import AdicionarServicoModal from "../../OrdensServico/detalhe/AdicionarServicoModal";
import ModeToggle from "../../OrdensServico/detalhe/ModeToggle";
import VehiclePicker from "../../OrdensServico/components/VehiclePicker";
import VehicleFormModal from "../../Veiculos/components/VehicleFormModal";
import { SERVICE_TYPES, toOptions } from "../../OrdensServico/constants";
import { mergeParts } from "../../OrdensServico/ordemUtils";
import { VALIDITY_OPTIONS } from "../constants";
import { quoteTotals } from "../quoteUtils";
import QuoteItemsEditor from "./QuoteItemsEditor";

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

const sellerOptions = CONSULTANTS.map((c) => ({ value: c.id, label: `${c.name} — ${c.role}` }));
const defaultSeller = CONSULTANTS.find((c) => c.name === currentUser.name)?.id ?? CONSULTANTS[0].id;

/**
 * Pop-up de criação / edição de orçamento (horizontal no desktop).
 * - quote: orçamento editado (ausente = novo) · initialVehicleId: veículo pré-selecionado
 * - vehicles / clients: listas atuais
 * - createVehicle / createClient: cadastro rápido de veículo (e cliente) sem sair do pop-up
 * - onSubmit(data, { send }) · onClose() · onToast(message, tone)
 */
function QuoteFormModal({ quote, initialVehicleId, vehicles, clients, createVehicle, createClient, onSubmit, onClose, onToast }) {
  const isEdit = Boolean(quote);
  const titleId = useId();
  const formRef = useRef(null);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const [values, setValues] = useState(() => ({
    vehicleId: quote?.vehicleId ?? initialVehicleId ?? "",
    sellerId: quote?.sellerId ?? defaultSeller,
    type: quote?.type ?? "corretiva",
    title: quote?.title ?? "",
    validityDays: String(quote?.validityDays ?? 7),
    notes: quote?.notes ?? "",
    services: quote?.services ?? [],
    parts: quote?.parts ?? [],
    discount: quote?.discount ?? { type: "valor", value: 0 },
  }));
  const [errors, setErrors] = useState({});
  const [adding, setAdding] = useState(null);

  const vehicle = vehicles.find((item) => item.id === values.vehicleId);
  const totals = quoteTotals(values);

  const update = (patch) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      if (patch.services || patch.parts) delete next.items;
      return next;
    });
  };

  const submit = (send) => {
    const found = {};
    if (!vehicle) found.vehicleId = "Selecione o veículo do orçamento.";
    else if (!vehicle.ownerId) found.vehicleId = "Vincule um proprietário ao veículo antes de orçar.";
    if (!values.services.length && !values.parts.length) found.items = "Adicione ao menos um serviço ou peça.";
    if (send && vehicle && !clientsById.get(vehicle.ownerId)?.phone) found.vehicleId = "O cliente não tem telefone para envio.";
    setErrors(found);
    if (Object.keys(found).length) {
      if (found.vehicleId) formRef.current?.elements.namedItem("vehicleId")?.focus();
      return;
    }
    onSubmit(
      {
        vehicleId: vehicle.id,
        clientId: vehicle.ownerId,
        sellerId: values.sellerId,
        type: values.type,
        title: values.title.trim(),
        validityDays: Number(values.validityDays),
        notes: values.notes.trim(),
        services: values.services,
        parts: values.parts,
        discount: values.discount,
      },
      { send },
    );
    onClose();
  };

  const canSend = !quote || quote.status !== "aprovado";

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
            icon={isEdit ? SquarePenIcon : FileTextIcon}
            titleId={titleId}
            title={isEdit ? `Editar Orçamento #${quote.id}` : "Novo Orçamento"}
            subtitle={
              isEdit
                ? "Ao reenviar, o cliente recebe a proposta atualizada."
                : "Monte a proposta comercial e envie ao cliente pelo WhatsApp."
            }
            onClose={onClose}
          />

          <ModalBody>
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Section icon={UserIcon} title="1. Cliente & Veículo" className="min-w-0">
                <VehiclePicker
                  vehicles={vehicles}
                  clientsById={clientsById}
                  value={values.vehicleId}
                  onChange={(vehicleId) => update({ vehicleId })}
                  onCreateVehicle={() => setAdding("veiculo")}
                  error={errors.vehicleId}
                />
              </Section>

              <Section
                icon={ListPlusIcon}
                title="2. Itens da proposta"
                aside={<span className="text-sm font-extrabold text-slate-900">{formatBRL(totals.total)}</span>}
                className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
              >
                <QuoteItemsEditor
                  services={values.services}
                  parts={values.parts}
                  error={errors.items}
                  onChange={update}
                  onAddService={() => setAdding("servico")}
                  onAddPart={() => setAdding("peca")}
                />

                <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">Desconto</span>
                      <ModeToggle
                        value={values.discount.type}
                        onChange={(type) => update({ discount: { type, value: 0 } })}
                        options={[
                          { value: "valor", label: "R$" },
                          { value: "percentual", label: "%" },
                        ]}
                      />
                    </div>
                    {values.discount.type === "valor" ? (
                      <MoneyInput
                        value={values.discount.value}
                        aria-label="Desconto em reais"
                        onChange={(value) => update({ discount: { type: "valor", value: Math.min(value, totals.subtotal) } })}
                      />
                    ) : (
                      <TextField
                        label="Percentual"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={values.discount.value}
                        trailing={<PercentIcon className="size-4 text-slate-400" />}
                        onChange={(event) =>
                          update({ discount: { type: "percentual", value: Math.min(100, Math.max(0, Number(event.target.value))) } })
                        }
                      />
                    )}
                  </div>
                  <dl className="space-y-1 self-end text-sm">
                    <div className="flex justify-between"><dt className="text-slate-600">Mão de obra</dt><dd>{formatBRL(totals.labor)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-600">Peças</dt><dd>{formatBRL(totals.parts)}</dd></div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-emerald-700"><dt>Desconto</dt><dd>-{formatBRL(totals.discount)}</dd></div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-extrabold">
                      <dt>Total</dt><dd>{formatBRL(totals.total)}</dd>
                    </div>
                  </dl>
                </div>
              </Section>

              <Section icon={FileTextIcon} title="3. Condições da proposta" className="min-w-0 lg:col-start-1 lg:row-start-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField label="Vendedor" options={sellerOptions} value={values.sellerId} onChange={(event) => update({ sellerId: event.target.value })} />
                  <SelectField label="Validade" options={VALIDITY_OPTIONS} value={values.validityDays} onChange={(event) => update({ validityDays: event.target.value })} />
                  <SelectField label="Tipo de atendimento" options={toOptions(SERVICE_TYPES)} value={values.type} onChange={(event) => update({ type: event.target.value })} />
                  <TextField
                    label="Resumo (aparece na lista)"
                    maxLength={40}
                    autoComplete="off"
                    placeholder="Ex.: Troca pastilhas + discos"
                    value={values.title}
                    onChange={(event) => update({ title: event.target.value })}
                  />
                  <TextAreaField
                    className="sm:col-span-2"
                    label="Observações ao cliente"
                    rows={3}
                    maxLength={400}
                    counter
                    placeholder="Ex.: Prazo de execução de 1 dia útil após a chegada das peças."
                    value={values.notes}
                    onChange={(event) => update({ notes: event.target.value })}
                  />
                </div>
              </Section>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="outline" size="lg" icon={SaveIcon} onClick={() => submit(false)} className="w-full sm:w-auto">
              {isEdit ? "Salvar Alterações" : "Salvar como Rascunho"}
            </Button>
            {canSend && (
              <Button type="submit" variant="success" size="lg" icon={MessageCircleIcon} className="w-full sm:w-auto">
                {isEdit && quote.status !== "rascunho" ? "Salvar e Reenviar" : "Salvar e Enviar por WhatsApp"}
              </Button>
            )}
          </ModalFooter>
        </form>
      </Modal>

      {adding === "servico" && (
        <AdicionarServicoModal
          showMechanic={false}
          existingPartCodes={values.parts.map((part) => part.code)}
          onClose={() => setAdding(null)}
          onAdd={(line, partLines) => update({ services: [...values.services, line], parts: mergeParts(values.parts, partLines) })}
        />
      )}
      {adding === "veiculo" && (
        <VehicleFormModal
          mode="create"
          vehicles={vehicles}
          clients={clients}
          createClient={createClient}
          onToast={onToast}
          onClose={() => setAdding(null)}
          onSubmit={(data, { draft }) => {
            const created = createVehicle(data);
            if (draft) {
              onToast("Rascunho do veículo salvo. Complete o cadastro para orçar.", "warning");
              return;
            }
            update({ vehicleId: created.id });
            onToast(`Veículo ${created.plate} cadastrado e selecionado.`);
          }}
        />
      )}
      {adding === "peca" && (
        <AdicionarPecaModal
          onClose={() => setAdding(null)}
          onAdd={(line) => update({ parts: mergeParts(values.parts, [line]) })}
        />
      )}
    </>
  );
}

export default QuoteFormModal;
