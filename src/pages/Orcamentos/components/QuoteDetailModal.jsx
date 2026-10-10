import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightCircleIcon,
  BellRingIcon,
  CopyIcon,
  CopyPlusIcon,
  FileTextIcon,
  MessageCircleIcon,
  PencilIcon,
  PrinterIcon,
  SendIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { buttonClassName } from "../../../components/ui/buttonStyles";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import { CONSULTANTS } from "../../../mocks/oficina";
import { formatBRL } from "../../../utils/format";
import { maskPhone } from "../../../utils/masks";
import MercosulPlate from "../../Veiculos/components/MercosulPlate";
import OrdemTimeline from "../../OrdensServico/detalhe/OrdemTimeline";
import { SERVICE_TYPES, toOptions } from "../../OrdensServico/constants";
import { formatDateTimeShort, timeShort } from "../../OrdensServico/ordemUtils";
import { RESPONSE_CHANNELS } from "../constants";
import { displayStatus, isEditable, needsFollowUp, quoteTitle, quoteTotals, validityInfo } from "../quoteUtils";
import QuoteStatusBadge from "./QuoteStatusBadge";

const headerAction =
  "rounded-lg p-1.5 text-slate-500 hover:bg-slate-900/5 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
const sellers = new Map(CONSULTANTS.map((c) => [c.id, c]));

function ResponseControls({ channel, onChannelChange, onApprove, onReject }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <SelectField label="Resposta recebida por" options={toOptions(RESPONSE_CHANNELS)} value={channel} onChange={(event) => onChannelChange(event.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" icon={ThumbsUpIcon} onClick={onApprove}>
          Cliente aprovou
        </Button>
        <Button size="sm" variant="outline" icon={ThumbsDownIcon} onClick={onReject} className="border-red-200 text-red-700 hover:bg-red-50">
          Rejeitou
        </Button>
      </div>
    </div>
  );
}

/** Painel lateral com a situação comercial e as ações possíveis. */
function CommercialPanel({ quote, actions }) {
  const [channel, setChannel] = useState(quote.sentChannel ?? "whatsapp");
  const status = displayStatus(quote);
  const response = (
    <ResponseControls
      channel={channel}
      onChannelChange={setChannel}
      onApprove={() => actions.onApprove(channel)}
      onReject={actions.onReject}
    />
  );

  return (
    <section aria-label="Situação comercial" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Situação comercial</h3>
      <QuoteStatusBadge quote={quote} />

      {status === "rascunho" && (
        <>
          <p className="text-sm text-slate-600">Proposta ainda não enviada ao cliente.</p>
          <Button variant="success" fullWidth icon={MessageCircleIcon} onClick={() => actions.onSend("whatsapp")} disabled={!quote.client?.phone}>
            Enviar por WhatsApp
          </Button>
          <div className="flex gap-2">
            <SelectField className="flex-1" label="Ou registre o envio por" options={toOptions(RESPONSE_CHANNELS)} value={channel} onChange={(event) => setChannel(event.target.value)} />
            <Button variant="outline" size="md" icon={SendIcon} onClick={() => actions.onSend(channel, { silent: true })} className="self-end">
              Enviado
            </Button>
          </div>
        </>
      )}

      {(status === "aguardando" || status === "vencido") && (
        <>
          <ul className="space-y-0.5 text-xs text-slate-600">
            <li>Enviado {timeShort(quote.sentAt).toLowerCase()} via {RESPONSE_CHANNELS[quote.sentChannel] ?? "—"}</li>
            <li>{quote.viewedAt ? `Visualizado em ${formatDateTimeShort(quote.viewedAt)}` : "Ainda não visualizado"}</li>
          </ul>
          {status === "vencido" ? (
            <Button variant="success" fullWidth icon={MessageCircleIcon} onClick={() => actions.onSend("whatsapp")} disabled={!quote.client?.phone}>
              Reenviar com nova validade
            </Button>
          ) : needsFollowUp(quote) ? (
            <Button fullWidth icon={BellRingIcon} onClick={actions.onFollowUp} className="bg-amber-500 hover:bg-amber-600">
              Enviar lembrete (follow-up)
            </Button>
          ) : (
            <Button variant="outline" fullWidth icon={MessageCircleIcon} onClick={() => actions.onSend("whatsapp")} disabled={!quote.client?.phone}>
              Reenviar por WhatsApp
            </Button>
          )}
          {response}
        </>
      )}

      {status === "aprovado" && (
        <>
          <p className="text-sm text-slate-700">
            Aprovado via {RESPONSE_CHANNELS[quote.decisionChannel] ?? "—"} em {formatDateTimeShort(quote.decidedAt)}.
          </p>
          {quote.vehicle?.openOrder ? (
            <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <span>
                O veículo já está com a{" "}
                <Link to={`/ordens-de-servico/${quote.vehicle.openOrder}`} className="font-bold underline">
                  OS #{quote.vehicle.openOrder}
                </Link>{" "}
                em andamento. Conclua-a antes de converter.
              </span>
            </p>
          ) : (
            <Button variant="success" fullWidth icon={ArrowRightCircleIcon} onClick={actions.onConvert}>
              Converter em OS
            </Button>
          )}
        </>
      )}

      {status === "convertido" && (
        <>
          <p className="text-sm text-slate-700">
            Convertido na OS #{quote.orderNumber} em {formatDateTimeShort(quote.convertedAt)}.
          </p>
          <Link to={`/ordens-de-servico/${quote.orderNumber}`} className={buttonClassName({ fullWidth: true })}>
            <ArrowRightCircleIcon className="size-4" />
            Abrir OS #{quote.orderNumber}
          </Link>
        </>
      )}

      {status === "rejeitado" && (
        <>
          <p className="text-sm text-red-700">
            Rejeitado em {formatDateTimeShort(quote.decidedAt)} — <strong>{quote.rejectReason}</strong>
          </p>
          <Button variant="outline" fullWidth icon={CopyPlusIcon} onClick={actions.onDuplicate}>
            Duplicar e revisar proposta
          </Button>
        </>
      )}
    </section>
  );
}

/**
 * Pop-up da proposta: itens, valores, situação comercial e linha do tempo.
 * `actions`: onEdit, onDuplicate, onDelete, onSend(channel, { silent }), onApprove(channel),
 * onReject, onConvert, onFollowUp, onPrint, onCopy
 */
function QuoteDetailModal({ quote, onClose, actions }) {
  const titleId = useId();
  const totals = quoteTotals(quote);
  const status = displayStatus(quote);
  const seller = sellers.get(quote.sellerId);
  const validity = validityInfo(quote);
  const { client, vehicle } = quote;

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg">
      <ModalHeader
        icon={FileTextIcon}
        titleId={titleId}
        title={<>Orçamento <span className="font-mono text-blue-700">#{quote.id}</span></>}
        badge={<QuoteStatusBadge quote={quote} />}
        subtitle={`Emitido em ${formatDateTimeShort(quote.issuedAt)} por ${seller?.name ?? "—"} • ${validity.text}`}
        actions={
          <>
            <button type="button" onClick={actions.onPrint} aria-label="Imprimir proposta" title="Imprimir proposta" className={headerAction}>
              <PrinterIcon className="size-5" />
            </button>
            <button type="button" onClick={actions.onCopy} aria-label="Copiar mensagem da proposta" title="Copiar mensagem" className={headerAction}>
              <CopyIcon className="size-5" />
            </button>
          </>
        }
        onClose={onClose}
      />

      <ModalBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="min-w-0 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Cliente</p>
                <Link to={`/clientes?busca=${encodeURIComponent(client?.name ?? "")}`} className="mt-1 block text-sm font-bold text-blue-700 hover:underline">
                  {client?.name ?? "—"}
                </Link>
                <p className="text-xs text-slate-600">{client ? maskPhone(client.phone) : ""}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                {vehicle && <MercosulPlate plate={vehicle.plate} size="sm" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "—"}</p>
                  <p className="text-xs text-slate-600">{SERVICE_TYPES[quote.type]}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-900">{quoteTitle(quote)}</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      <th scope="col" className="px-4 py-2">Item</th>
                      <th scope="col" className="w-16 px-2 py-2 text-center">Qtd</th>
                      <th scope="col" className="w-28 px-4 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.services.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-slate-900">{line.description}</p>
                          <p className="text-[11px] text-slate-500">Mão de obra • {line.hours.toLocaleString("pt-BR")}h</p>
                        </td>
                        <td className="px-2 py-2.5 text-center">—</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{formatBRL(line.price)}</td>
                      </tr>
                    ))}
                    {quote.parts.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-slate-900">{line.description}</p>
                          <p className="font-mono text-[11px] text-slate-500">{line.code || "AVULSA"} • {formatBRL(line.unitPrice)}/{line.unit}</p>
                        </td>
                        <td className="px-2 py-2.5 text-center">{line.qty}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{formatBRL(line.qty * line.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <dl className="space-y-1 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-600">Mão de obra</dt><dd>{formatBRL(totals.labor)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-600">Peças</dt><dd>{formatBRL(totals.parts)}</dd></div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-700"><dt>Desconto</dt><dd>-{formatBRL(totals.discount)}</dd></div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-lg font-extrabold text-blue-800">
                    <dt>Total</dt><dd>{formatBRL(totals.total)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {quote.notes && (
              <p className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
                <strong className="text-slate-900">Observações: </strong>
                {quote.notes}
              </p>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <CommercialPanel quote={quote} actions={actions} />
            <OrdemTimeline events={quote.timeline} />
          </aside>
        </div>
      </ModalBody>

      <ModalFooter className="sm:justify-between">
        <div>
          {status !== "convertido" && (
            <Button variant="outline" icon={Trash2Icon} onClick={actions.onDelete} className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto">
              Excluir
            </Button>
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="soft" onClick={onClose} className="w-full sm:w-auto">
            Fechar Janela
          </Button>
          <Button variant="outline" icon={CopyPlusIcon} onClick={actions.onDuplicate} className="w-full sm:w-auto">
            Duplicar
          </Button>
          {isEditable(quote) && (
            <Button icon={PencilIcon} onClick={actions.onEdit} className="w-full sm:w-auto">
              Editar Proposta
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}

export default QuoteDetailModal;
