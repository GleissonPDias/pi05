import { Link } from "react-router-dom";
import {
  ArrowRightCircleIcon,
  BellRingIcon,
  CircleCheckIcon,
  ClockIcon,
  CopyPlusIcon,
  EyeIcon,
  FilePenLineIcon,
  HourglassIcon,
  MessageCircleIcon,
  PencilIcon,
  SearchXIcon,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { maskPhone } from "../../../utils/masks";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import { displayStatus, isEditable, needsFollowUp, quoteTitle, quoteTotals, validityInfo } from "../quoteUtils";
import QuoteStatusBadge from "./QuoteStatusBadge";

const toneClass = { green: "text-emerald-700", amber: "text-amber-700", red: "text-red-700", slate: "text-slate-500" };
const toneIcon = { ok: CircleCheckIcon, soon: HourglassIcon, expired: ClockIcon, done: CircleCheckIcon, draft: FilePenLineIcon };

const actionButton =
  "grid size-8 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

function Validity({ quote }) {
  const info = validityInfo(quote);
  const Icon = toneIcon[info.icon];
  return (
    <div className="text-xs">
      <p className="text-slate-700">
        Emitido: <span className="font-semibold">{new Date(quote.issuedAt).toLocaleDateString("pt-BR")}</span>
      </p>
      <p className={cn("mt-0.5 flex items-start gap-1 font-semibold", toneClass[info.tone])}>
        <Icon className="mt-px size-3.5 shrink-0" />
        {info.text}
      </p>
    </div>
  );
}

function Client({ quote }) {
  const { client } = quote;
  if (!client) return <span className="text-xs text-slate-500">Cliente removido</span>;
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold leading-snug text-slate-900">{client.name}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
        <span className="whitespace-nowrap">{maskPhone(client.phone)}</span>
        {client.hasWhatsapp && <MessageCircleIcon className="size-3.5 shrink-0 text-emerald-600" aria-label="WhatsApp" />}
      </p>
    </div>
  );
}

function Vehicle({ quote }) {
  const { vehicle } = quote;
  if (!vehicle) return <span className="text-xs text-slate-500">—</span>;
  return (
    <div className="flex items-center gap-2.5">
      <MercosulPlate plate={vehicle.plate} size="xs" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{vehicle.brand} {vehicle.model}</p>
        <p className="truncate text-[11px] text-slate-500">{vehicle.yearModel} • {vehicle.engine || vehicle.fuel}</p>
      </div>
    </div>
  );
}

function Status({ quote }) {
  const status = displayStatus(quote);
  return (
    <div className="flex flex-col items-start gap-1">
      <QuoteStatusBadge quote={quote} />
      {status === "rejeitado" && <p className="text-[11px] text-red-700">Motivo: {quote.rejectReason}</p>}
      {status === "convertido" && (
        <Link to={`/ordens-de-servico/${quote.orderNumber}`} className="text-[11px] font-bold text-blue-700 hover:underline">
          Ver OS #{quote.orderNumber} →
        </Link>
      )}
      {needsFollowUp(quote) && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
          <BellRingIcon className="size-3" />
          Fazer follow-up
        </span>
      )}
    </div>
  );
}

/** Botões da linha: ver, editar, duplicar e a ação principal da situação. */
function Actions({ quote, onView, onEdit, onDuplicate, onConvert, onResend }) {
  const status = displayStatus(quote);
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={() => onView(quote)} aria-label={`Ver ${quote.id}`} title="Ver proposta" className={cn(actionButton, "text-slate-500 hover:bg-blue-50 hover:text-blue-700")}>
        <EyeIcon className="size-4" />
      </button>
      {isEditable(quote) && (
        <button type="button" onClick={() => onEdit(quote)} aria-label={`Editar ${quote.id}`} title="Editar" className={cn(actionButton, "text-slate-500 hover:bg-blue-50 hover:text-blue-700")}>
          <PencilIcon className="size-4" />
        </button>
      )}
      <button type="button" onClick={() => onDuplicate(quote)} aria-label={`Duplicar ${quote.id}`} title="Duplicar" className={cn(actionButton, "text-slate-500 hover:bg-blue-50 hover:text-blue-700")}>
        <CopyPlusIcon className="size-4" />
      </button>
      {status === "aprovado" && (
        <button type="button" onClick={() => onConvert(quote)} aria-label={`Converter ${quote.id} em OS`} title="Converter em OS" className={cn(actionButton, "text-emerald-600 hover:bg-emerald-50")}>
          <ArrowRightCircleIcon className="size-4" />
        </button>
      )}
      {["aguardando", "vencido", "rascunho"].includes(status) && quote.client?.phone && (
        <button
          type="button"
          onClick={() => onResend(quote)}
          aria-label={`${status === "rascunho" ? "Enviar" : "Reenviar"} ${quote.id} por WhatsApp`}
          title={status === "rascunho" ? "Enviar por WhatsApp" : "Reenviar por WhatsApp"}
          className={cn(actionButton, "text-emerald-600 hover:bg-emerald-50")}
        >
          <MessageCircleIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

const columns = [
  { label: "Nº orçamento", className: "w-[10%]" },
  { label: "Cliente / contato", className: "w-[15%]" },
  { label: "Veículo & placa", className: "w-[20%]" },
  { label: "Emissão & validade", className: "w-[16%]" },
  { label: "Valor total", className: "w-[12%]" },
  { label: "Status comercial", className: "w-[15%]" },
  { label: "Ações", className: "w-[12%]" },
];

/** Lista de orçamentos (tabela no desktop, cards no celular). */
function OrcamentosTable({ quotes, ...handlers }) {
  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
          <SearchXIcon className="size-6" />
        </span>
        <p className="text-sm font-bold text-slate-900">Nenhum orçamento encontrado</p>
        <p className="max-w-xs text-xs text-slate-500">Revise a busca, o período ou os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[64rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Lista de orçamentos</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-blue-50/60">
              {columns.map((column) => (
                <th key={column.label} scope="col" className={`${column.className} px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr key={quote.id} className="transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handlers.onView(quote)}
                    className="rounded-md bg-blue-100 px-2 py-1 font-mono text-xs font-extrabold text-blue-800 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    #{quote.id}
                  </button>
                </td>
                <td className="px-4 py-4"><Client quote={quote} /></td>
                <td className="px-4 py-4"><Vehicle quote={quote} /></td>
                <td className="px-4 py-4"><Validity quote={quote} /></td>
                <td className="px-4 py-4">
                  <p className="text-sm font-extrabold text-slate-900">{formatBRL(quoteTotals(quote).total)}</p>
                  <p className="line-clamp-2 text-[11px] text-slate-500">{quoteTitle(quote)}</p>
                </td>
                <td className="px-4 py-4"><Status quote={quote} /></td>
                <td className="px-4 py-4"><Actions quote={quote} {...handlers} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {quotes.map((quote) => (
          <li key={quote.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handlers.onView(quote)}
                className="rounded-md bg-blue-100 px-2 py-1 font-mono text-xs font-extrabold text-blue-800"
              >
                #{quote.id}
              </button>
              <p className="text-base font-extrabold text-slate-900">{formatBRL(quoteTotals(quote).total)}</p>
            </div>
            <Client quote={quote} />
            <Vehicle quote={quote} />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Validity quote={quote} />
              <Status quote={quote} />
            </div>
            <Actions quote={quote} {...handlers} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default OrcamentosTable;
