import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import { useClientes } from "../../hooks/useClientes";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { useOrdens } from "../../hooks/useOrdens";
import { useToast } from "../../hooks/useToast";
import { useVeiculos } from "../../hooks/useVeiculos";
import { downloadCsv } from "../../utils/csv";
import { printDocument } from "../../utils/print";
import { whatsappLink } from "../OrdensServico/ordemUtils";
import ConvertQuoteModal from "./components/ConvertQuoteModal";
import OrcamentosStats from "./components/OrcamentosStats";
import OrcamentosTable from "./components/OrcamentosTable";
import OrcamentosToolbar from "./components/OrcamentosToolbar";
import QuoteDeleteModal from "./components/QuoteDeleteModal";
import QuoteDetailModal from "./components/QuoteDetailModal";
import QuoteFormModal from "./components/QuoteFormModal";
import QuoteFunnel from "./components/QuoteFunnel";
import QuotePrint from "./components/QuotePrint";
import QuoteRejectModal from "./components/QuoteRejectModal";
import { PAGE_SIZE, PERIODS, RESPONSE_CHANNELS } from "./constants";
import {
  CSV_HEADERS,
  buildFollowUpMessage,
  buildProposalMessage,
  computeQuoteStats,
  countByStatus,
  filterQuotes,
  toCsvRows,
  withRelations,
} from "./quoteUtils";

function Orcamentos() {
  const {
    quotes,
    createQuote,
    updateQuote,
    sendQuote,
    approveQuote,
    rejectQuote,
    convertQuote,
    duplicateQuote,
    deleteQuote,
    addQuoteEvent,
  } = useOrcamentos();
  const { vehicles, createVehicle, updateMileage } = useVeiculos();
  const { clients, createClient } = useClientes();
  const { createOrder, addEvent } = useOrdens();
  const { toast, showToast, dismissToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?busca= vem da busca global, da OS (orçamento de origem) etc.
  const initialSearch = searchParams.get("busca") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState("todos");
  const [seller, setSeller] = useState("");
  const [period, setPeriod] = useState(initialSearch ? "todos" : "30d");
  const [followUp, setFollowUp] = useState(false);
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(null);
  // Pop-ups: { type: "create" | "edit" | "detail" | "reject" | "delete" | "convert", id?, vehicleId? }
  const [modal, setModal] = useState(() =>
    location.state?.novo ? { type: "create", vehicleId: location.state.novo.vehicleId } : null,
  );

  useEffect(() => {
    if (location.state?.novo) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  const vehiclesById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const enriched = useMemo(() => withRelations(quotes, vehiclesById, clientsById), [quotes, vehiclesById, clientsById]);

  const stats = useMemo(() => computeQuoteStats(enriched, { period, seller }), [enriched, period, seller]);
  const scope = useMemo(
    () => filterQuotes(enriched, { search, status: "todos", seller, period, followUp }),
    [enriched, search, seller, period, followUp],
  );
  const counts = useMemo(() => countByStatus(scope), [scope]);
  const filtered = useMemo(
    () => filterQuotes(enriched, { search, status, seller, period, followUp }).sort((a, b) => b.number - a.number),
    [enriched, search, status, seller, period, followUp],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);
  const selected = modal?.id ? enriched.find((quote) => quote.id === modal.id) : null;
  const periodLabel = PERIODS.find((item) => item.value === period).label;

  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const close = () => setModal(null);
  const open = (type, quote) => setModal({ type, id: quote.id });

  const openWhatsapp = (quote, text) => {
    if (quote.client?.phone) window.open(whatsappLink(quote.client.phone, text), "_blank", "noopener,noreferrer");
  };

  /** Envia (abre o WhatsApp) e registra o envio. */
  const send = (quote, channel = "whatsapp", { silent = false } = {}) => {
    sendQuote(quote.id, channel);
    // Rascunhos e propostas vencidas recebem nova validade a partir do envio
    const renew = quote.status === "rascunho" || new Date(quote.validUntil) < Date.now();
    const validUntil = renew ? new Date(Date.now() + (quote.validityDays ?? 7) * 86_400_000).toISOString() : quote.validUntil;
    if (channel === "whatsapp" && !silent) openWhatsapp(quote, buildProposalMessage({ ...quote, validUntil }));
    showToast(`Proposta ${quote.id} enviada via ${RESPONSE_CHANNELS[channel]}.`);
  };

  const handleSubmit = (data, { send: shouldSend }) => {
    const enrich = (quote) => ({ ...quote, vehicle: vehiclesById.get(quote.vehicleId), client: clientsById.get(quote.clientId) });
    if (modal.type === "edit") {
      updateQuote(selected.id, data, "Proposta editada");
      if (shouldSend) send(enrich({ ...selected, ...data }));
      else showToast(`Orçamento ${selected.id} atualizado.`);
      return;
    }
    const created = createQuote(data);
    if (shouldSend) send(enrich(created));
    else showToast(`Rascunho ${created.id} salvo.`);
  };

  const handleConvert = ({ mileageIn, expectedAt, priority, mechanicId }) => {
    const quote = selected;
    const copy = (lines) => lines.map((line) => ({ ...line, done: false, mechanicId: line.mechanicId ?? mechanicId }));
    const order = createOrder({
      vehicleId: quote.vehicleId,
      clientId: quote.clientId,
      type: quote.type,
      channel: "agendamento",
      priority,
      title: quote.title,
      complaint: `Serviços aprovados no orçamento ${quote.id}.${quote.notes ? ` ${quote.notes}` : ""}`,
      mileageIn,
      fuelLevel: null,
      mechanicId,
      boxId: null,
      expectedAt,
      parts: copy(quote.parts),
      services: copy(quote.services),
      discount: { ...quote.discount },
      quoteId: quote.id,
      approval: {
        status: "aprovado",
        channel: quote.decisionChannel,
        sentAt: quote.sentAt,
        decidedAt: quote.decidedAt,
        viewedAt: quote.viewedAt,
      },
    });
    addEvent(order.number, `Criada a partir do orçamento ${quote.id} (já aprovado pelo cliente)`, "indigo");
    convertQuote(quote.id, order.number);
    if (quote.vehicle && mileageIn > quote.vehicle.mileage) updateMileage(quote.vehicle.id, mileageIn);
    navigate(`/ordens-de-servico/${order.number}?aba=vistoria`, {
      state: { toast: `OS #${order.number} aberta a partir do ${quote.id}. Faça a vistoria de entrada.` },
    });
  };

  const print = (quote) => printDocument(setPrinting, quote);

  const copyMessage = async (quote) => {
    try {
      await navigator.clipboard.writeText(buildProposalMessage(quote));
      showToast("Mensagem da proposta copiada.");
    } catch {
      showToast("Não foi possível copiar neste navegador.", "warning");
    }
  };

  const duplicate = (quote) => {
    const copy = duplicateQuote(quote.id);
    setModal({ type: "edit", id: copy.id });
    showToast(`${copy.id} criado a partir do ${quote.id}. Revise e envie.`);
  };

  const detailActions = selected && {
    onEdit: () => open("edit", selected),
    onDuplicate: () => duplicate(selected),
    onDelete: () => open("delete", selected),
    onSend: (channel, options) => send(selected, channel, options),
    onApprove: (channel) => {
      approveQuote(selected.id, channel);
      showToast(`${selected.id} aprovado! Converta em OS quando o veículo chegar.`);
    },
    onReject: () => open("reject", selected),
    onConvert: () => open("convert", selected),
    onFollowUp: () => {
      openWhatsapp(selected, buildFollowUpMessage(selected));
      addQuoteEvent(selected.id, "Lembrete (follow-up) enviado pelo WhatsApp", "orange");
      showToast("Lembrete enviado ao cliente.");
    },
    onPrint: () => print(selected),
    onCopy: () => copyMessage(selected),
  };

  const rangeStart = filtered.length === 0 ? 0 : firstIndex + 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Orçamentos</h1>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
              {stats.pendingCount} aguardando resposta
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Controle de cotações, envio de propostas comerciais e conversão em Ordens de Serviço
          </p>
        </div>
        <Button icon={PlusIcon} size="lg" onClick={() => setModal({ type: "create" })} className="w-full sm:w-auto">
          Novo Orçamento
        </Button>
      </div>

      <OrcamentosStats stats={stats} periodLabel={periodLabel} />
      <QuoteFunnel
        stats={stats}
        followUpActive={followUp}
        onToggleFollowUp={() => {
          setFollowUp((value) => !value);
          setStatus("todos");
          setPage(1);
        }}
      />

      <Card className="overflow-hidden p-0!">
        <OrcamentosToolbar
          search={search}
          onSearchChange={withReset(setSearch)}
          seller={seller}
          onSellerChange={withReset(setSeller)}
          period={period}
          onPeriodChange={withReset(setPeriod)}
          status={status}
          onStatusChange={withReset(setStatus)}
          counts={counts}
          canExport={filtered.length > 0}
          onExport={() => {
            downloadCsv("orcamentos.csv", CSV_HEADERS, toCsvRows(filtered));
            showToast(`Lista exportada: ${filtered.length} orçamento(s).`);
          }}
        />
        {followUp && (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
            Mostrando só propostas enviadas há mais de 48h sem resposta.{" "}
            <button type="button" onClick={() => setFollowUp(false)} className="underline">
              Limpar filtro
            </button>
          </p>
        )}
        <OrcamentosTable
          quotes={visible}
          onView={(quote) => open("detail", quote)}
          onEdit={(quote) => open("edit", quote)}
          onDuplicate={duplicate}
          onConvert={(quote) => open(quote.vehicle?.openOrder ? "detail" : "convert", quote)}
          onResend={(quote) => send(quote)}
        />
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600" aria-live="polite">
            {filtered.length === 0 ? (
              "Nenhum orçamento para exibir"
            ) : (
              <>
                Mostrando <strong className="text-slate-900">{rangeStart}</strong> a{" "}
                <strong className="text-slate-900">{firstIndex + visible.length}</strong> de{" "}
                <strong className="text-slate-900">{filtered.length}</strong> orçamentos
              </>
            )}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>

      {modal?.type === "create" && (
        <QuoteFormModal
          initialVehicleId={modal.vehicleId}
          vehicles={vehicles}
          clients={clients}
          createVehicle={createVehicle}
          createClient={createClient}
          onSubmit={handleSubmit}
          onClose={close}
          onToast={showToast}
        />
      )}
      {modal?.type === "edit" && selected && (
        <QuoteFormModal
          quote={selected}
          vehicles={vehicles}
          clients={clients}
          createVehicle={createVehicle}
          createClient={createClient}
          onSubmit={handleSubmit}
          onClose={close}
          onToast={showToast}
        />
      )}
      {modal?.type === "detail" && selected && <QuoteDetailModal quote={selected} onClose={close} actions={detailActions} />}
      {modal?.type === "reject" && selected && (
        <QuoteRejectModal
          quote={selected}
          onClose={() => open("detail", selected)}
          onConfirm={({ reason, channel }) => {
            rejectQuote(selected.id, reason, channel);
            showToast(`Rejeição de ${selected.id} registrada.`, "warning");
          }}
        />
      )}
      {modal?.type === "delete" && selected && (
        <QuoteDeleteModal
          quote={selected}
          onClose={close}
          onConfirm={() => {
            deleteQuote(selected.id);
            showToast(`Orçamento ${selected.id} excluído.`, "warning");
          }}
        />
      )}
      {modal?.type === "convert" && selected && (
        <ConvertQuoteModal quote={selected} onClose={() => open("detail", selected)} onConfirm={handleConvert} />
      )}

      {printing && <QuotePrint quote={printing} />}
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Orcamentos;
