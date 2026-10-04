import { Link } from "react-router-dom";
import { MessageCircleIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatKm } from "../../../utils/format";
import { maskPhone } from "../../../utils/masks";
import {
  MAINTENANCE,
  colorToHex,
  engineName,
  engineTone,
  getMaintenanceStatus,
  vehicleName,
  vehicleYears,
} from "../vehicleUtils";
import MercosulPlate from "./MercosulPlate";

/** Placa + categoria do veículo logo abaixo. */
export function VehiclePlate({ vehicle }) {
  return (
    <div className="flex w-28 flex-col items-center gap-1">
      <MercosulPlate plate={vehicle.plate} size="md" />
      <span className="text-center text-[11px] text-slate-600">{vehicle.category}</span>
    </div>
  );
}

/** Marca e modelo, círculo da cor e selo do motor. */
export function VehicleInfo({ vehicle }) {
  const engine = engineName(vehicle);

  return (
    <div className="min-w-0">
      <p className="text-sm font-bold leading-snug text-slate-900">
        {vehicleName(vehicle)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
        {vehicle.color && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full ring-1 ring-slate-300"
              style={{ backgroundColor: colorToHex(vehicle.color) }}
            />
            {vehicle.color}
          </span>
        )}
        {engine && (
          <span
            className={cn(
              "font-semibold",
              engineTone(vehicle) === "green" ? "text-emerald-700" : "text-blue-700",
            )}
          >
            {engine}
          </span>
        )}
      </div>
    </div>
  );
}

/** Nome (link para o cliente) e telefone do proprietário. */
export function VehicleOwner({ owner }) {
  if (!owner) {
    return <span className="text-xs text-slate-500">Sem proprietário vinculado</span>;
  }

  return (
    <div className="min-w-0">
      <Link
        to={`/clientes?busca=${encodeURIComponent(owner.name)}`}
        className="text-sm font-bold leading-snug text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {owner.name}
      </Link>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
        {owner.hasWhatsapp && (
          <MessageCircleIcon
            className="size-3.5 shrink-0 text-emerald-600"
            aria-label="Possui WhatsApp"
          />
        )}
        <span className="whitespace-nowrap">{maskPhone(owner.phone)}</span>
      </p>
    </div>
  );
}

/** Ano fabricação/modelo, combustível e quilometragem. */
export function VehicleSpecs({ vehicle }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-900">{vehicleYears(vehicle)}</p>
      <p className="text-xs text-slate-600">{vehicle.fuel}</p>
      <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800">
        {formatKm(vehicle.mileage)}
      </p>
    </div>
  );
}

const badgeTones = {
  amber: { box: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  red: { box: "bg-red-100 text-red-800", dot: "bg-red-500" },
  green: { box: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500" },
  slate: { box: "bg-slate-200 text-slate-700", dot: "bg-slate-500" },
};

/** Pílula com a situação de manutenção ("Em Manutenção (OS #1042)"...). */
export function MaintenanceBadge({ vehicle, className }) {
  const status = getMaintenanceStatus(vehicle);
  const { label, tone } = MAINTENANCE[status];
  const style = badgeTones[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-left text-[11px] font-bold leading-tight",
        style.box,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      <span>
        {label}
        {status === "maintenance" && (
          <>
            <br />
            <span className="font-semibold">(OS #{vehicle.openOrder})</span>
          </>
        )}
      </span>
    </span>
  );
}
