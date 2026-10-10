import { useMemo, useState } from "react";
import { CarFrontIcon, MessageCircleIcon, PlusIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatKm } from "../../../utils/format";
import { maskPhone } from "../../../utils/masks";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import { normalize } from "../ordemUtils";

const MAX_RESULTS = 6;

/**
 * Busca e escolha do veículo da OS (por placa, modelo ou cliente).
 * - vehicles: veículos (já com `openOrder`) · clientsById: Map de clientes
 * - value: id escolhido · onChange(id) · onCreateVehicle(): abre o cadastro rápido
 */
function VehiclePicker({ vehicles, clientsById, value, onChange, onCreateVehicle, error }) {
  const [query, setQuery] = useState("");
  const selected = vehicles.find((vehicle) => vehicle.id === value);

  const results = useMemo(() => {
    const text = normalize(query.trim());
    const compact = text.replace(/[^a-z0-9]/g, "");
    return vehicles
      .filter((vehicle) => !vehicle.draft)
      .filter((vehicle) => {
        if (!text) return true;
        const owner = clientsById.get(vehicle.ownerId);
        const haystack = normalize(`${vehicle.brand} ${vehicle.model} ${owner?.name ?? ""}`);
        return (
          haystack.includes(text) ||
          (compact.length >= 2 && normalize(vehicle.plate).replace(/[^a-z0-9]/g, "").includes(compact))
        );
      })
      .slice(0, MAX_RESULTS);
  }, [vehicles, clientsById, query]);

  if (selected) {
    const owner = clientsById.get(selected.ownerId);
    return (
      <div>
        <div className={cn("rounded-xl border p-4", error ? "border-red-400 bg-red-50" : "border-blue-200 bg-blue-50")}>
          <div className="flex items-start gap-3">
            <MercosulPlate plate={selected.plate} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">
                {selected.brand} {selected.model}
              </p>
              <p className="text-xs text-slate-600">
                {selected.yearManufacture}/{selected.yearModel} • {selected.color} • {formatKm(selected.mileage)}
              </p>
            </div>
            <button
              type="button"
              name="vehicleId"
              onClick={() => onChange("")}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-blue-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RefreshCwIcon className="size-3.5" />
              Trocar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-200 pt-3 text-xs">
            <span className="text-slate-700">
              Proprietário: <strong>{owner?.name ?? "não vinculado"}</strong>
            </span>
            {owner && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                {owner.hasWhatsapp && <MessageCircleIcon className="size-3.5 text-emerald-600" aria-label="WhatsApp" />}
                {maskPhone(owner.phone)}
              </span>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor="busca-veiculo" className="text-xs font-semibold text-slate-700">
          Veículo <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <button
          type="button"
          onClick={onCreateVehicle}
          className="inline-flex items-center gap-1 rounded text-xs font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <PlusIcon className="size-3.5" />
          Novo Veículo
        </button>
      </div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          id="busca-veiculo"
          name="vehicleId"
          type="search"
          data-autofocus
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Placa, modelo ou nome do cliente..."
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2",
            error ? "border-red-500 bg-red-50 focus:ring-red-500" : "border-transparent bg-blue-50 focus:ring-blue-500",
          )}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <ul className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1" aria-label="Veículos encontrados">
        {results.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Nenhum veículo encontrado. Use “Novo Veículo” para cadastrar.
          </li>
        )}
        {results.map((vehicle) => {
          const owner = clientsById.get(vehicle.ownerId);
          return (
            <li key={vehicle.id}>
              <button
                type="button"
                onClick={() => onChange(vehicle.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <MercosulPlate plate={vehicle.plate} size="xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {vehicle.brand} {vehicle.model}
                  </span>
                  <span className="block truncate text-xs text-slate-600">
                    {owner?.name ?? "Sem proprietário"}
                  </span>
                </span>
                {vehicle.openOrder ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    OS #{vehicle.openOrder}
                  </span>
                ) : (
                  <CarFrontIcon className="size-4 shrink-0 text-slate-400" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default VehiclePicker;
