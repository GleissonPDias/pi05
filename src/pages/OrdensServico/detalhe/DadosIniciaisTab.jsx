import { Link } from "react-router-dom";
import { CarFrontIcon, ClipboardListIcon, MailIcon, MessageCircleIcon, PhoneIcon, UserIcon } from "lucide-react";
import { buttonClassName } from "../../../components/ui/buttonStyles";
import SelectField from "../../../components/ui/SelectField";
import TextAreaField from "../../../components/ui/TextAreaField";
import TextField from "../../../components/ui/TextField";
import { BOXES, MECHANICS } from "../../../mocks/oficina";
import { formatKm } from "../../../utils/format";
import { maskCpfCnpj, maskKm, maskPhone, parseKm } from "../../../utils/masks";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import FuelLevelPicker from "../components/FuelLevelPicker";
import { CHANNELS, PRIORITIES, SERVICE_TYPES, toOptions } from "../constants";
import { fromDateTimeLocal, toDateTimeLocal } from "../ordemUtils";
import SectionCard from "./SectionCard";

const priorityOptions = Object.entries(PRIORITIES).map(([value, item]) => ({ value, label: item.label }));
const mechanicOptions = MECHANICS.map((m) => ({ value: m.id, label: `${m.name} — ${m.role}` }));

/** Aba 1: cliente, veículo e dados da entrada. */
function DadosIniciaisTab({ order, onChange, busyBoxes }) {
  const { client, vehicle } = order;

  const boxOptions = BOXES.filter((box) => {
    const busy = busyBoxes.get(box.id);
    return !busy || busy.number === order.number;
  }).map((box) => ({ value: box.id, label: `${box.name} — ${box.type}` }));

  const bind = (name) => ({
    name,
    value: order[name] ?? "",
    onChange: (event) => onChange({ [name]: event.target.value }),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard icon={UserIcon} title="Cliente">
          {client ? (
            <div className="space-y-3">
              <div>
                <Link
                  to={`/clientes?busca=${encodeURIComponent(client.name)}`}
                  className="text-base font-bold text-blue-700 hover:underline"
                >
                  {client.name}
                </Link>
                <p className="text-xs text-slate-600">
                  {client.document.length > 11 ? "CNPJ" : "CPF"} {maskCpfCnpj(client.document)}
                </p>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <MailIcon className="size-4 text-slate-400" /> {client.email}
              </p>
              <div className="flex flex-wrap gap-2">
                {client.hasWhatsapp && (
                  <a
                    href={`https://wa.me/55${client.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClassName({ variant: "success", size: "sm" })}
                  >
                    <MessageCircleIcon className="size-3.5" /> WhatsApp
                  </a>
                )}
                <a href={`tel:+55${client.phone}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
                  <PhoneIcon className="size-3.5" /> {maskPhone(client.phone)}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Cliente não encontrado.</p>
          )}
        </SectionCard>

        <SectionCard icon={CarFrontIcon} title="Veículo">
          {vehicle ? (
            <div className="flex items-center gap-4">
              <MercosulPlate plate={vehicle.plate} size="md" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  {vehicle.brand} {vehicle.model}
                </p>
                <p className="text-xs text-slate-600">
                  {vehicle.yearManufacture}/{vehicle.yearModel} • {vehicle.color} • {vehicle.fuel}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Último km registrado: <strong className="font-mono">{formatKm(vehicle.mileage)}</strong>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Veículo não encontrado.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard icon={ClipboardListIcon} title="Entrada do veículo">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField label="Tipo de atendimento" required options={toOptions(SERVICE_TYPES)} {...bind("type")} />
          <SelectField label="Canal de entrada" options={toOptions(CHANNELS)} {...bind("channel")} />
          <SelectField label="Prioridade" options={priorityOptions} {...bind("priority")} />
          <TextField label="Resumo (aparece no quadro)" maxLength={40} autoComplete="off" {...bind("title")} />
          <TextField
            label="Km de entrada"
            required
            inputMode="numeric"
            autoComplete="off"
            inputClassName="font-mono"
            value={maskKm(String(order.mileageIn ?? ""))}
            onChange={(event) => onChange({ mileageIn: parseKm(event.target.value) })}
          />
          <TextField
            label="Previsão de entrega"
            type="datetime-local"
            value={toDateTimeLocal(order.expectedAt)}
            onChange={(event) => onChange({ expectedAt: fromDateTimeLocal(event.target.value) })}
          />
          <SelectField
            label="Mecânico responsável"
            placeholder="A definir"
            options={mechanicOptions}
            {...bind("mechanicId")}
            onChange={(event) => onChange({ mechanicId: event.target.value || null })}
          />
          <SelectField
            label="Box"
            placeholder="Sem box (pátio)"
            options={boxOptions}
            {...bind("boxId")}
            onChange={(event) => onChange({ boxId: event.target.value || null })}
          />
          <FuelLevelPicker
            required
            value={order.fuelLevel}
            onChange={(level) => onChange({ fuelLevel: level })}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TextAreaField
            label="Relato do cliente (sintomas e pedidos)"
            required
            rows={4}
            maxLength={600}
            counter
            {...bind("complaint")}
          />
          <TextAreaField
            label="Observações internas (não aparecem para o cliente)"
            rows={4}
            maxLength={300}
            counter
            {...bind("internalNotes")}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export default DadosIniciaisTab;
