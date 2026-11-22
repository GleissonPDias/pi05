import { useId, useState } from "react";
import { SaveIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import MoneyInput from "../../components/ui/MoneyInput";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
import {
  CATEGORIAS_DESPESA,
  FORMAS_PAGAMENTO,
  KIND,
  KIND_CONFIG,
  emptyLancamento,
  lancamentoPayload,
  validateLancamento,
} from "./financeiroUtils";

const statusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" },
];

/** Cadastro de um recebimento (conta a receber) ou despesa (conta a pagar). */
function FinanceiroFormModal({ kind, onSubmit, onClose }) {
  const titleId = useId();
  const config = KIND_CONFIG[kind];
  const isReceber = kind === KIND.RECEBER;
  const [values, setValues] = useState(() => emptyLancamento(kind));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const found = validateLancamento(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit(lancamentoPayload(kind, values));
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Não foi possível salvar o lançamento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={isReceber ? TrendingUpIcon : TrendingDownIcon}
          iconClassName={isReceber ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}
          titleId={titleId}
          title={config.newLabel}
          subtitle={isReceber ? "Valor que a oficina tem a receber de um cliente." : "Valor que a oficina tem a pagar."}
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <TextField
            label="Descrição"
            required
            data-autofocus
            maxLength={120}
            placeholder={isReceber ? "Ex.: OS #1042 — revisão completa" : "Ex.: Compra de pastilhas de freio"}
            value={values.descricao}
            error={errors.descricao}
            onChange={(event) => set({ descricao: event.target.value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 flex min-h-5 items-center text-xs font-semibold text-slate-700">
                Valor <span aria-hidden="true" className="ml-1 text-red-600">*</span>
              </span>
              <MoneyInput
                name="valor"
                aria-label="Valor"
                value={values.valor}
                onChange={(value) => set({ valor: value })}
                className="[&_input]:py-2.5"
              />
              {errors.valor && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.valor}</p>}
            </div>
            <TextField
              label="Vencimento"
              type="date"
              required
              value={values.vencimento}
              error={errors.vencimento}
              onChange={(event) => set({ vencimento: event.target.value })}
            />
          </div>

          {isReceber ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Forma de pagamento"
                options={FORMAS_PAGAMENTO}
                value={values.formaPagamento}
                onChange={(event) => set({ formaPagamento: event.target.value })}
              />
              <TextField
                label="Parcelas"
                type="number"
                min="1"
                max="36"
                inputMode="numeric"
                value={values.parcelas}
                onChange={(event) => set({ parcelas: event.target.value })}
              />
            </div>
          ) : (
            <TextField
              label="Categoria"
              list="financeiro-categorias"
              maxLength={60}
              value={values.categoria}
              onChange={(event) => set({ categoria: event.target.value })}
            />
          )}
          {!isReceber && (
            <datalist id="financeiro-categorias">
              {CATEGORIAS_DESPESA.map((categoria) => (
                <option key={categoria} value={categoria} />
              ))}
            </datalist>
          )}

          <SelectField
            label="Situação"
            options={statusOptions}
            value={values.status}
            onChange={(event) => set({ status: event.target.value })}
          />

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
            {submitting ? "Salvando..." : "Salvar lançamento"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default FinanceiroFormModal;
