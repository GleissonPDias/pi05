import { Link } from "react-router-dom";
import Badge from "../../../components/ui/Badge";
import { cn } from "../../../utils/cn";
import { formatDate, formatRelativeDays } from "../../../utils/dates";
import { maskPhone } from "../../../utils/masks";
import { getInitials, vehiclesLabel, vehiclesList } from "../clienteFilters";

const avatarTones = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-slate-200 text-slate-700",
];

/** Avatar com iniciais. A cor é fixa para cada cliente (derivada do código). */
export function ClienteAvatar({ client }) {
  const tone = avatarTones[Number(client.id.replace(/\D/g, "")) % avatarTones.length];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold",
        tone,
      )}
    >
      {getInitials(client.name)}
    </span>
  );
}

/** Nome + e-mail (e selo "Inativo" quando for o caso). */
export function ClienteIdentity({ client }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ClienteAvatar client={client} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold text-slate-900">
          <span className="truncate">{client.name}</span>
          {client.status === "inativo" && <Badge variant="slate">Inativo</Badge>}
        </p>
        <p className="truncate text-xs text-slate-500">{client.email}</p>
      </div>
    </div>
  );
}

/** Telefone + selo de WhatsApp / Telefone fixo / Celular. */
export function ClienteContact({ client }) {
  const isLandline = client.phone.length === 10;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="whitespace-nowrap text-xs font-medium text-slate-800">
        {maskPhone(client.phone)}
      </span>
      {client.hasWhatsapp ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          WhatsApp
        </span>
      ) : (
        <Badge variant="slate" className="font-semibold">
          {isLandline ? "Telefone Fixo" : "Celular"}
        </Badge>
      )}
    </div>
  );
}

/** "2 veículos cadastrados" (link) + lista de modelos e placas. */
export function ClienteVehicles({ client }) {
  const { vehicles } = client;

  if (vehicles.length === 0) {
    return <span className="text-xs text-slate-500">{vehiclesLabel(0)}</span>;
  }

  return (
    <div className="min-w-0">
      <Link
        to={`/veiculos?busca=${encodeURIComponent(client.name)}`}
        className="text-xs font-bold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {vehiclesLabel(vehicles.length)}
      </Link>
      <p className="line-clamp-2 text-xs text-slate-600" title={vehiclesList(vehicles)}>
        {vehiclesList(vehicles)}
      </p>
    </div>
  );
}

/** Data da última visita + "Há 2 dias". */
export function ClienteLastVisit({ client }) {
  return (
    <div className="whitespace-nowrap">
      <p className="text-xs font-bold text-slate-900">
        {formatDate(client.lastVisit)}
      </p>
      <p className="text-[11px] text-slate-500">
        {formatRelativeDays(client.lastVisit)}
      </p>
    </div>
  );
}
