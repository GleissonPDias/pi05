import { SearchXIcon } from "lucide-react";
import VehicleActions from "./VehicleActions";
import {
  MaintenanceBadge,
  VehicleInfo,
  VehicleOwner,
  VehiclePlate,
  VehicleSpecs,
} from "./VehicleCells";

const columns = [
  { label: "Placa Mercosul", className: "w-[15%]" },
  { label: "Veículo & Detalhes", className: "w-[23%]" },
  { label: "Proprietário", className: "w-[17%]" },
  { label: "Especificações & Km", className: "w-[17%]" },
  { label: "Status Manutenção", className: "w-[16%]" },
  { label: "Ações", className: "w-[12%]" },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
        <SearchXIcon className="size-6" />
      </span>
      <p className="text-sm font-bold text-slate-900">Nenhum veículo encontrado</p>
      <p className="max-w-xs text-xs text-slate-500">
        Revise o termo pesquisado ou limpe os filtros selecionados.
      </p>
    </div>
  );
}

const mobileLabel =
  "mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500";

/**
 * Lista de veículos.
 * - lg+: tabela
 * - abaixo de lg: um card por veículo
 */
function VeiculosTable({ vehicles, ownersById, onView, onEdit, onDelete }) {
  if (vehicles.length === 0) return <EmptyState />;

  const actions = (vehicle) => (
    <VehicleActions vehicle={vehicle} onView={onView} onEdit={onEdit} onDelete={onDelete} />
  );

  return (
    <>
      {/* Tabela (desktop) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[60rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Lista de veículos cadastrados</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60">
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={`${column.className} px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-4 align-middle">
                  <VehiclePlate vehicle={vehicle} />
                </td>
                <td className="px-4 py-4 align-middle">
                  <VehicleInfo vehicle={vehicle} />
                </td>
                <td className="px-4 py-4 align-middle">
                  <VehicleOwner owner={ownersById.get(vehicle.ownerId)} />
                </td>
                <td className="px-4 py-4 align-middle">
                  <VehicleSpecs vehicle={vehicle} />
                </td>
                <td className="px-4 py-4 align-middle">
                  <MaintenanceBadge vehicle={vehicle} />
                </td>
                <td className="px-4 py-4 align-middle">{actions(vehicle)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (celular e tablet) */}
      <ul className="divide-y divide-slate-100 lg:hidden">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <VehiclePlate vehicle={vehicle} />
              {actions(vehicle)}
            </div>

            <VehicleInfo vehicle={vehicle} />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="min-w-0">
                <dt className={mobileLabel}>Proprietário</dt>
                <dd>
                  <VehicleOwner owner={ownersById.get(vehicle.ownerId)} />
                </dd>
              </div>
              <div>
                <dt className={mobileLabel}>Especificações & Km</dt>
                <dd>
                  <VehicleSpecs vehicle={vehicle} />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className={mobileLabel}>Status manutenção</dt>
                <dd>
                  <MaintenanceBadge vehicle={vehicle} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export default VeiculosTable;
