import { Link } from "react-router-dom";
import { CarFrontIcon } from "lucide-react";
import { formatKm } from "../../../utils/format";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-sm font-bold text-slate-900">{value || "—"}</p>
    </div>
  );
}

/** Ficha rápida do veículo da OS. */
function FichaRapidaVeiculo({ vehicle, order }) {
  if (!vehicle) return null;
  return (
    <section aria-label="Ficha rápida do veículo" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ficha rápida do veículo</h2>
        <Link
          to={`/veiculos?busca=${encodeURIComponent(vehicle.plate)}`}
          className="text-xs font-bold text-blue-700 hover:underline"
        >
          Ver ficha completa
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <CarFrontIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="truncate text-xs text-slate-600">
            {[vehicle.engine, vehicle.transmission].filter(Boolean).join(" • ") || vehicle.fuel}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <MercosulPlate plate={vehicle.plate} size="md" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Info label="Chassi final" value={vehicle.chassis ? `...${vehicle.chassis.slice(-6)}` : ""} />
        <Info label="Cor" value={vehicle.color} />
        <Info label="Ano" value={`${vehicle.yearManufacture}/${vehicle.yearModel}`} />
        <Info label="Km na entrada" value={formatKm(order.mileageIn ?? 0)} />
      </div>
    </section>
  );
}

export default FichaRapidaVeiculo;
