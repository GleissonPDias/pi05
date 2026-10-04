import { SearchXIcon } from "lucide-react";
import { maskCpfCnpj } from "../../../utils/masks";
import ClienteActions from "./ClienteActions";
import {
  ClienteContact,
  ClienteIdentity,
  ClienteLastVisit,
  ClienteVehicles,
} from "./ClienteCells";

const columns = [
  { label: "Cliente / Titular", className: "w-[26%]" },
  { label: "Documento", className: "w-[13%]" },
  { label: "Contato direto", className: "w-[17%]" },
  { label: "Veículos vinculados", className: "w-[26%]" },
  { label: "Última visita", className: "w-[10%]" },
  { label: "Ações", className: "w-[8%]" },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
        <SearchXIcon className="size-6" />
      </span>
      <p className="text-sm font-bold text-slate-900">Nenhum cliente encontrado</p>
      <p className="max-w-xs text-xs text-slate-500">
        Revise o termo pesquisado ou troque o filtro selecionado.
      </p>
    </div>
  );
}

/**
 * Lista de clientes.
 * - lg+: tabela
 * - abaixo de lg: um card por cliente
 */
function ClientesTable({ clients, onEdit, onDelete }) {
  if (clients.length === 0) return <EmptyState />;

  return (
    <>
      {/* Tabela (desktop) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Lista de clientes cadastrados</caption>
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
            {clients.map((client) => (
              <tr key={client.id} className="transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-3.5 align-middle">
                  <ClienteIdentity client={client} />
                </td>
                <td className="px-4 py-3.5 align-middle text-xs font-bold text-slate-900">
                  <span className="whitespace-nowrap">
                    {maskCpfCnpj(client.document)}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <ClienteContact client={client} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <ClienteVehicles client={client} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <ClienteLastVisit client={client} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <ClienteActions
                    client={client}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (celular e tablet) */}
      <ul className="divide-y divide-slate-100 lg:hidden">
        {clients.map((client) => (
          <li key={client.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <ClienteIdentity client={client} />
              <ClienteActions client={client} onEdit={onEdit} onDelete={onDelete} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Documento
                </dt>
                <dd className="font-bold text-slate-900">
                  {maskCpfCnpj(client.document)}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Última visita
                </dt>
                <dd>
                  <ClienteLastVisit client={client} />
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Contato direto
                </dt>
                <dd>
                  <ClienteContact client={client} />
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Veículos vinculados
                </dt>
                <dd>
                  <ClienteVehicles client={client} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export default ClientesTable;
