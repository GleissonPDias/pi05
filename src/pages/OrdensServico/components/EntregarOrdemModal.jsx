import { useId, useState } from "react";
import { CarFrontIcon, HandCoinsIcon, KeyRoundIcon, StarIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { cn } from "../../../utils/cn";
import { formatBRL, formatKm } from "../../../utils/format";
import { maskKm, onlyDigits, parseKm } from "../../../utils/masks";
import { PAYMENT_METHODS, toOptions } from "../constants";
import { formatOrderNumber, orderTotals, warrantyLabel } from "../ordemUtils";
import OrdemSummary from "./OrdemSummary";

const DELIVERY_CHECKS = [
  { key: "services", label: "Cliente conferiu os serviços executados" },
  { key: "parts", label: "Peças substituídas apresentadas/entregues ao cliente" },
  { key: "clean", label: "Veículo limpo, sem ferramentas e com os pertences do cliente" },
];

const installmentOptions = Array.from({ length: 10 }, (_, index) => ({
  value: String(index + 1),
  label: index === 0 ? "À vista" : `${index + 1}x sem juros`,
}));

/**
 * Pop-up de entrega: pagamento, km de saída, conferência e avaliação.
 * - order: OS com `vehicle` e `client`
 * - onConfirm({ payment, mileageOut, rating })
 */
function EntregarOrdemModal({ order, onConfirm, onClose }) {
  const titleId = useId();
  const totals = orderTotals(order);
  const [method, setMethod] = useState(order.payment.method);
  const [installments, setInstallments] = useState(String(order.payment.installments || 1));
  const [km, setKm] = useState(maskKm(String(order.mileageIn ?? "")));
  const [checks, setChecks] = useState({});
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState({});

  const allChecked = DELIVERY_CHECKS.every((item) => checks[item.key]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = {};
    if (!method) found.method = "Selecione a forma de pagamento.";
    if (!onlyDigits(km)) found.km = "Informe a quilometragem de saída.";
    else if (parseKm(km) < (order.mileageIn ?? 0)) {
      found.km = `Não pode ser menor que a de entrada (${formatKm(order.mileageIn)}).`;
    }
    setErrors(found);
    if (Object.keys(found).length) return;

    onConfirm({
      payment: { method, installments: method === "credito" ? Number(installments) : 1 },
      mileageOut: parseKm(km),
      rating: rating || null,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={KeyRoundIcon}
          iconClassName="bg-emerald-100 text-emerald-700"
          titleId={titleId}
          title={`Registrar Entrega — OS ${formatOrderNumber(order.number)}`}
          subtitle="Confirme o pagamento e a conferência antes de devolver as chaves."
          onClose={onClose}
        />

        <ModalBody className="space-y-6">
          <OrdemSummary order={order} />

          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                <HandCoinsIcon className="size-4" />
                1. Pagamento
              </h3>
              <dl className="space-y-1.5 rounded-lg bg-blue-50 p-3 text-sm">
                <div className="flex justify-between"><dt>Peças</dt><dd>{formatBRL(totals.parts)}</dd></div>
                <div className="flex justify-between"><dt>Mão de obra</dt><dd>{formatBRL(totals.labor)}</dd></div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-700"><dt>Desconto</dt><dd>-{formatBRL(totals.discount)}</dd></div>
                )}
                <div className="flex justify-between border-t border-blue-200 pt-1.5 text-base font-extrabold">
                  <dt>Total</dt><dd>{formatBRL(totals.total)}</dd>
                </div>
              </dl>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Forma de pagamento"
                  required
                  data-autofocus
                  placeholder="Selecione..."
                  options={toOptions(PAYMENT_METHODS)}
                  value={method}
                  error={errors.method}
                  onChange={(event) => {
                    setMethod(event.target.value);
                    setErrors((current) => ({ ...current, method: undefined }));
                  }}
                />
                {method === "credito" && (
                  <SelectField
                    label="Parcelas"
                    options={installmentOptions}
                    value={installments}
                    onChange={(event) => setInstallments(event.target.value)}
                  />
                )}
              </div>
              <p className="text-xs text-slate-600">
                Garantia: <strong>{warrantyLabel(order.warranty)}</strong> a partir da entrega.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                <CarFrontIcon className="size-4" />
                2. Conferência de saída
              </h3>
              <TextField
                label="Quilometragem de saída (km)"
                required
                inputMode="numeric"
                autoComplete="off"
                inputClassName="font-mono"
                hint={`Entrada: ${formatKm(order.mileageIn ?? 0)}`}
                value={km}
                error={errors.km}
                onChange={(event) => {
                  setKm(maskKm(event.target.value));
                  setErrors((current) => ({ ...current, km: undefined }));
                }}
              />
              <fieldset className="space-y-2.5 rounded-lg bg-blue-50 p-3">
                <legend className="sr-only">Conferência com o cliente</legend>
                {DELIVERY_CHECKS.map((item) => (
                  <Checkbox
                    key={item.key}
                    checked={Boolean(checks[item.key])}
                    onChange={(event) => setChecks((current) => ({ ...current, [item.key]: event.target.checked }))}
                    className="text-sm"
                  >
                    {item.label}
                  </Checkbox>
                ))}
              </fieldset>
              <div>
                <p id={`${titleId}-rating`} className="mb-1.5 text-xs font-semibold text-slate-700">
                  Avaliação do atendimento (opcional)
                </p>
                <div role="radiogroup" aria-labelledby={`${titleId}-rating`} className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} estrela(s)`}
                      onClick={() => setRating(rating === value ? 0 : value)}
                      className="rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <StarIcon
                        className={cn("size-6", value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            Voltar
          </Button>
          <Button
            type="submit"
            variant="success"
            size="lg"
            icon={KeyRoundIcon}
            disabled={!allChecked}
            title={allChecked ? undefined : "Marque os itens da conferência"}
            className="w-full disabled:opacity-50 sm:w-auto"
          >
            Confirmar Entrega
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default EntregarOrdemModal;
