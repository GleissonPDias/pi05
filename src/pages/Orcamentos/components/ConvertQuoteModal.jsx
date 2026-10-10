import { useId, useState } from "react";
import { ArrowRightCircleIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { MECHANICS } from "../../../mocks/oficina";
import { formatBRL, formatKm } from "../../../utils/format";
import { maskKm, onlyDigits, parseKm } from "../../../utils/masks";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import { PRIORITIES } from "../../OrdensServico/constants";
import { defaultForecast } from "../../OrdensServico/ordemForm";
import { fromDateTimeLocal } from "../../OrdensServico/ordemUtils";
import { quoteTitle, quoteTotals } from "../quoteUtils";

const priorityOptions = Object.entries(PRIORITIES).map(([value, item]) => ({ value, label: item.label }));
const mechanicOptions = MECHANICS.map((m) => ({ value: m.id, label: `${m.name} — ${m.specialty}` }));

/**
 * Converte o orçamento aprovado em OS (já com os itens e a aprovação).
 * - onConfirm({ mileageIn, expectedAt, priority, mechanicId })
 */
function ConvertQuoteModal({ quote, onConfirm, onClose }) {
  const titleId = useId();
  const { vehicle } = quote;
  const [km, setKm] = useState(maskKm(String(vehicle?.mileage ?? "")));
  const [expectedAt, setExpectedAt] = useState(defaultForecast());
  const [priority, setPriority] = useState("normal");
  const [mechanicId, setMechanicId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!onlyDigits(km)) return setError("Informe a quilometragem de entrada.");
    if (parseKm(km) < vehicle.mileage) return setError(`Menor que o último registro (${formatKm(vehicle.mileage)}).`);
    onConfirm({ mileageIn: parseKm(km), expectedAt: fromDateTimeLocal(expectedAt), priority, mechanicId: mechanicId || null });
    onClose();
    return undefined;
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={ArrowRightCircleIcon}
          iconClassName="bg-emerald-100 text-emerald-700"
          titleId={titleId}
          title={`Converter ${quote.id} em OS`}
          subtitle="A OS é aberta com os itens e a aprovação do cliente já registrados."
          onClose={onClose}
        />
        <ModalBody className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <MercosulPlate plate={vehicle.plate} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{vehicle.brand} {vehicle.model}</p>
              <p className="truncate text-xs text-slate-600">{quoteTitle(quote)} • {quote.client?.name}</p>
              <p className="text-xs text-slate-600">
                {quote.services.length} serviço(s) e {quote.parts.length} peça(s)
              </p>
            </div>
            <p className="shrink-0 text-lg font-extrabold">{formatBRL(quoteTotals(quote).total)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Km de entrada"
              required
              data-autofocus
              inputMode="numeric"
              inputClassName="font-mono"
              value={km}
              error={error}
              onChange={(event) => {
                setKm(maskKm(event.target.value));
                setError("");
              }}
            />
            <TextField label="Previsão de entrega" type="datetime-local" value={expectedAt} onChange={(event) => setExpectedAt(event.target.value)} />
            <SelectField label="Prioridade" options={priorityOptions} value={priority} onChange={(event) => setPriority(event.target.value)} />
            <SelectField label="Mecânico responsável" placeholder="Definir depois" options={mechanicOptions} value={mechanicId} onChange={(event) => setMechanicId(event.target.value)} />
          </div>
          <p className="rounded-lg bg-blue-50 p-3 text-xs text-slate-700">
            Depois de abrir, faça a <strong>vistoria de entrada</strong> com o cliente (nível de combustível, avarias e
            pertences) na própria OS.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            Voltar
          </Button>
          <Button type="submit" variant="success" size="lg" icon={ArrowRightCircleIcon} className="w-full sm:w-auto">
            Abrir OS e Iniciar Vistoria
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default ConvertQuoteModal;
