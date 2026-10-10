import { useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LockIcon, SearchXIcon } from "lucide-react";
import { buttonClassName } from "../../components/ui/buttonStyles";
import Toast from "../../components/ui/Toast";
import { useClientes } from "../../hooks/useClientes";
import { useEstoque } from "../../hooks/useEstoque";
import { useOrdens } from "../../hooks/useOrdens";
import { useToast } from "../../hooks/useToast";
import { useVeiculos } from "../../hooks/useVeiculos";
import { printDocument } from "../../utils/print";
import { APPROVAL_CHANNELS, STATUS, TABS } from "./constants";
import DadosIniciaisTab from "./detalhe/DadosIniciaisTab";
import DiagnosticoTab from "./detalhe/DiagnosticoTab";
import FechamentoTab from "./detalhe/FechamentoTab";
import FichaRapidaVeiculo from "./detalhe/FichaRapidaVeiculo";
import OrdemHeader from "./detalhe/OrdemHeader";
import OrdemPrint from "./detalhe/OrdemPrint";
import OrdemTabs from "./detalhe/OrdemTabs";
import OrdemTimeline from "./detalhe/OrdemTimeline";
import ResumoFinanceiro from "./detalhe/ResumoFinanceiro";
import VistoriaTab from "./detalhe/VistoriaTab";
import { useStatusFlow } from "./hooks/useStatusFlow";
import {
  boxUsage,
  buildQuoteMessage,
  buildReadyMessage,
  canMoveTo,
  formatDateTimeShort,
  formatOrderNumber,
  isClosed,
  missingParts,
  whatsappLink,
} from "./ordemUtils";

/** Aba aberta por padrão, conforme a etapa da OS. */
function defaultTab(order) {
  switch (order.status) {
    case "aberta":
      return order.inspection.done ? "dados" : "vistoria";
    case "orcamento":
    case "execucao":
    case "aguardando_pecas":
      return "diagnostico";
    default:
      return "fechamento";
  }
}

function NotFound({ number }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-blue-100 text-blue-600">
        <SearchXIcon className="size-7" />
      </span>
      <h1 className="text-xl font-bold text-slate-900">OS #{number} não encontrada</h1>
      <p className="text-sm text-slate-600">Confira o número ou volte para o quadro de ordens de serviço.</p>
      <Link to="/ordens-de-servico" className={buttonClassName({ className: "mt-2" })}>
        Voltar para o quadro
      </Link>
    </div>
  );
}

/**
 * Página de detalhes da OS (rota /ordens-de-servico/:numero).
 *
 * As edições dos campos ficam em rascunho (drafts) até clicar em "Salvar".
 * Mudanças de etapa, aprovação e entrega são gravadas na hora (e salvam o
 * rascunho antes, para a OS não ficar inconsistente).
 */
function OrdemDetalhe() {
  const { numero } = useParams();
  const number = Number(numero);
  const idPrefix = useId();
  const { orders, drafts, setDraft, discardDraft, saveDraft, updateOrder, changeStatus, addEvent } = useOrdens();
  const { vehicles } = useVeiculos();
  const { clients } = useClientes();
  const { partsByCode } = useEstoque();
  const { toast, showToast, dismissToast } = useToast();
  const { requestStatus, statusModals } = useStatusFlow(showToast);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [printVariant, setPrintVariant] = useState(null);

  const busyBoxes = useMemo(() => boxUsage(orders), [orders]);
  const stored = orders.find((order) => order.number === number);
  const draft = drafts[number];

  // Aviso vindo de outra tela (ex.: "OS aberta. Faça a vistoria.")
  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate, showToast]);

  if (!stored) return <NotFound number={numero} />;

  const order = {
    ...stored,
    ...draft,
    vehicle: vehicles.find((vehicle) => vehicle.id === stored.vehicleId) ?? null,
    client: clients.find((client) => client.id === stored.clientId) ?? null,
  };
  const dirty = Boolean(draft);
  const readOnly = isClosed(stored);
  const requestedTab = searchParams.get("aba");
  const tab = TABS.some((item) => item.key === requestedTab) ? requestedTab : defaultTab(stored);
  const label = formatOrderNumber(number);

  const edit = (patch) => setDraft(number, patch);

  const save = () => {
    saveDraft(number);
    showToast(`OS ${label} salva.`);
  };

  const discard = () => {
    discardDraft(number);
    showToast("Alterações descartadas.", "warning");
  };

  const changeTab = (key) =>
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.set("aba", key);
        return next;
      },
      { replace: true },
    );

  /** Muda a etapa (salvando o rascunho antes, se a mudança for permitida). */
  const move = (status) => {
    if (dirty && canMoveTo(order, status).ok) saveDraft(number);
    requestStatus(order, status);
  };

  const handleNextStep = (step) => (step.tab ? changeTab(step.tab) : move(step.status));

  const print = (variant) => printDocument(setPrintVariant, variant);

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      showToast("Não foi possível copiar neste navegador.", "warning");
    }
  };

  const openWhatsapp = (text) => {
    if (!order.client?.phone) return;
    window.open(whatsappLink(order.client.phone, text), "_blank", "noopener,noreferrer");
  };

  /** Aprovação do orçamento e avisos ao cliente (gravados na hora). */
  const handleApprovalAction = (action, channel) => {
    if (dirty) saveDraft(number);
    const now = new Date().toISOString();

    if (action === "send") {
      openWhatsapp(buildQuoteMessage(order, order.vehicle, order.client));
      updateOrder(
        number,
        { approval: { ...order.approval, status: "enviado", channel: "whatsapp", sentAt: now } },
        "Orçamento enviado ao cliente via WhatsApp",
      );
      if (["aberta", "orcamento"].includes(order.status)) changeStatus(number, "aprovacao");
      showToast("Orçamento enviado. A OS está aguardando a aprovação do cliente.");
      return;
    }

    if (action === "approve") {
      updateOrder(
        number,
        { approval: { ...order.approval, status: "aprovado", channel, decidedAt: now } },
        `Orçamento aprovado pelo cliente via ${APPROVAL_CHANNELS[channel]}`,
      );
      if (["aberta", "orcamento", "aprovacao"].includes(order.status) && order.services.length) {
        const next = missingParts(order, partsByCode).length ? "aguardando_pecas" : "execucao";
        changeStatus(number, next);
        showToast(`Orçamento aprovado! OS movida para "${STATUS[next].label}".`);
      } else {
        showToast("Orçamento aprovado!");
      }
      return;
    }

    if (action === "reject") {
      updateOrder(
        number,
        { approval: { ...order.approval, status: "recusado", channel, decidedAt: now } },
        `Orçamento recusado pelo cliente via ${APPROVAL_CHANNELS[channel]}`,
      );
      showToast("Recusa registrada. Revise o orçamento ou cancele a OS.", "warning");
      return;
    }

    if (action === "notifyReady") {
      openWhatsapp(buildReadyMessage(order, order.vehicle, order.client));
      addEvent(number, "Cliente avisado pelo WhatsApp: veículo pronto para retirada", "green");
      showToast("Aviso de veículo pronto enviado.");
    }
  };

  const tabProps = { order, onChange: edit, readOnly, onToast: showToast };

  return (
    <div className="flex flex-col gap-6">
      <OrdemHeader
        order={order}
        dirty={dirty}
        readOnly={readOnly}
        onPrint={() => print("os")}
        onCancel={() => move("cancelada")}
        onSave={save}
        onDiscard={discard}
        onStatusChange={move}
      />

      {readOnly && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
          <LockIcon className="size-4 shrink-0" />
          <p>
            {stored.status === "entregue"
              ? `OS entregue em ${formatDateTimeShort(stored.deliveredAt)}.`
              : `OS cancelada em ${formatDateTimeShort(stored.canceledAt)} — ${stored.cancelReason}.`}{" "}
            Os dados ficam disponíveis apenas para consulta e impressão.
          </p>
        </div>
      )}

      <OrdemTabs active={tab} onChange={changeTab} order={order} idPrefix={idPrefix} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${tab}`} className="min-w-0">
          <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">{TABS.find((item) => item.key === tab).label}</legend>
            {tab === "dados" && <DadosIniciaisTab {...tabProps} busyBoxes={busyBoxes} />}
            {tab === "vistoria" && <VistoriaTab {...tabProps} />}
            {tab === "diagnostico" && <DiagnosticoTab {...tabProps} />}
            {tab === "fechamento" && (
              <FechamentoTab
                {...tabProps}
                onApprovalAction={handleApprovalAction}
                onDeliver={() => move("entregue")}
                onCopy={() =>
                  copyText(buildQuoteMessage(order, order.vehicle, order.client), "Mensagem do orçamento copiada.")
                }
              />
            )}
          </fieldset>
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label="Resumo da OS">
          <ResumoFinanceiro
            order={order}
            dirty={dirty}
            readOnly={readOnly}
            onSave={save}
            onPrintReceipt={() => print("entrada")}
            onNextStep={handleNextStep}
          />
          <FichaRapidaVeiculo vehicle={order.vehicle} order={order} />
          <OrdemTimeline events={order.timeline} />
        </aside>
      </div>

      {printVariant && <OrdemPrint order={order} variant={printVariant} />}
      {statusModals}
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default OrdemDetalhe;
