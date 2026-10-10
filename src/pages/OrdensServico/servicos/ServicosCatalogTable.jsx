import { PencilIcon, PowerIcon, SearchXIcon, Trash2Icon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { warrantyLabel } from "../ordemUtils";
import { hourlyRate } from "./servicoUtils";

const actionButton =
  "grid size-8 place-items-center rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

function StatusPill({ status }) {
  const active = status === "ativo";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function Actions({ service, onEdit, onToggle, onDelete }) {
  const active = service.status === "ativo";
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onEdit(service)} aria-label={`Editar ${service.description}`} title="Editar" className={cn(actionButton, "hover:bg-blue-50 hover:text-blue-700")}>
        <PencilIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onToggle(service)}
        aria-label={`${active ? "Desativar" : "Ativar"} ${service.description}`}
        title={active ? "Desativar" : "Ativar"}
        className={cn(actionButton, active ? "hover:bg-amber-50 hover:text-amber-700" : "hover:bg-emerald-50 hover:text-emerald-700")}
      >
        <PowerIcon className="size-4" />
      </button>
      <button type="button" onClick={() => onDelete(service)} aria-label={`Excluir ${service.description}`} title="Excluir" className={cn(actionButton, "hover:bg-red-50 hover:text-red-600")}>
        <Trash2Icon className="size-4" />
      </button>
    </div>
  );
}

function Usage({ usage }) {
  if (!usage?.count90) return <span className="text-xs text-slate-500">Sem uso recente</span>;
  return (
    <div>
      <p className="text-xs font-bold text-slate-900">{usage.count90} OS</p>
      <p className="text-[11px] text-slate-500">{formatBRL(usage.revenue90, 0)} em 90 dias</p>
    </div>
  );
}

/** Lista do catálogo (tabela no desktop, cards no celular). */
function ServicosCatalogTable({ services, usage, onEdit, onToggle, onDelete }) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
          <SearchXIcon className="size-6" />
        </span>
        <p className="text-sm font-bold text-slate-900">Nenhum serviço encontrado</p>
        <p className="max-w-xs text-xs text-slate-500">Revise a busca ou cadastre um novo serviço.</p>
      </div>
    );
  }

  const actions = (service) => <Actions service={service} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />;

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[60rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Catálogo de serviços da oficina</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              <th scope="col" className="w-[9%] px-4 py-3">Código</th>
              <th scope="col" className="w-[31%] px-4 py-3">Serviço</th>
              <th scope="col" className="w-[14%] px-4 py-3">Categoria</th>
              <th scope="col" className="w-[9%] px-4 py-3 text-center">Tempo</th>
              <th scope="col" className="w-[12%] px-4 py-3 text-right">Mão de obra</th>
              <th scope="col" className="w-[11%] px-4 py-3">Uso (90 dias)</th>
              <th scope="col" className="w-[8%] px-4 py-3">Situação</th>
              <th scope="col" className="w-[10%] px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => {
              const rate = hourlyRate(service);
              return (
                <tr key={service.code} className={cn("transition-colors hover:bg-blue-50/40", service.status !== "ativo" && "bg-slate-50/70")}>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">{service.code}</td>
                  <td className="px-4 py-3.5">
                    <p className={cn("text-sm font-bold", service.status === "ativo" ? "text-slate-900" : "text-slate-500")}>{service.description}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {service.detail || "—"} • Garantia {warrantyLabel(service.warranty)}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold leading-snug text-slate-700">{service.category}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-semibold text-slate-800">{service.hours.toLocaleString("pt-BR")}h</td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="text-sm font-bold text-slate-900">{formatBRL(service.price)}</p>
                    <p className="text-[11px] text-slate-500">{rate ? `${formatBRL(rate, 0)}/h` : "—"}</p>
                  </td>
                  <td className="px-4 py-3.5"><Usage usage={usage.get(service.code)} /></td>
                  <td className="px-4 py-3.5"><StatusPill status={service.status} /></td>
                  <td className="px-4 py-3.5">{actions(service)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {services.map((service) => (
          <li key={service.code} className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold text-slate-500">{service.code} • {service.category}</p>
                <p className="text-sm font-bold text-slate-900">{service.description}</p>
                {service.detail && <p className="text-xs text-slate-500">{service.detail}</p>}
              </div>
              <StatusPill status={service.status} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                <strong className="text-slate-900">{formatBRL(service.price)}</strong>{" "}
                <span className="text-xs text-slate-500">• {service.hours.toLocaleString("pt-BR")}h</span>
              </p>
              <Usage usage={usage.get(service.code)} />
              {actions(service)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ServicosCatalogTable;
