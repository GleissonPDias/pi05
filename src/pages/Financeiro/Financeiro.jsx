import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon, ChevronRightIcon, PlusIcon, Trash2Icon, WalletIcon, XIcon } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SelectField from "../../components/ui/SelectField";
import StatCard from "../../components/ui/StatCard";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { formatBRL } from "../../utils/format";
import { formatDate } from "../../utils/dates";
import { cn } from "../../utils/cn";
import FinanceiroDeleteModal from "./FinanceiroDeleteModal";
import FinanceiroFormModal from "./FinanceiroFormModal";
import {
  KIND,
  KIND_CONFIG,
  STATUS_FILTERS,
  STATUS_LABEL,
  STATUS_VARIANT,
  isOverdue,
  totalsByStatus,
} from "./financeiroUtils";

const TABS = [KIND.RECEBER, KIND.PAGAR];

/** Lista com o cadastro de um recebimento ou despesa. */
function LancamentosTable({ items, kind, onPaid, onCancel, onDelete, busyId }) {
  const config = KIND_CONFIG[kind];

  if (items.length === 0) {
    return <p className="px-4 py-12 text-center text-sm text-slate-500">{config.emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-bold">Descrição</th>
            <th className="px-4 py-3 font-bold">{kind === KIND.PAGAR ? "Categoria" : "Forma"}</th>
            <th className="px-4 py-3 font-bold">Vencimento</th>
            <th className="px-4 py-3 text-right font-bold">Valor</th>
            <th className="px-4 py-3 font-bold">Situação</th>
            <th className="px-4 py-3 text-right font-bold">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const overdue = isOverdue(item);
            const busy = busyId === item.id;
            return (
              <tr key={item.id} className="align-middle">
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{item.descricao}</p>
                  {item.observacoes && <p className="max-w-80 truncate text-xs text-slate-500">{item.observacoes}</p>}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {kind === KIND.PAGAR ? item.categoria || "—" : formatForma(item.formaPagamento)}
                </td>
                <td className={cn("px-4 py-3", overdue ? "font-bold text-red-600" : "text-slate-700")}>
                  {formatDate(item.vencimento)}
                  {overdue && <span className="ml-2 text-[11px] uppercase">Vencido</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">{formatBRL(item.valor)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[item.status] ?? "slate"}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    {item.status === "PENDENTE" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onPaid(item)}
                          aria-label={`${config.paidAction}: ${item.descricao}`}
                          title={config.paidAction}
                          className="grid size-9 place-items-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
                        >
                          <CheckIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onCancel(item)}
                          aria-label={`Cancelar: ${item.descricao}`}
                          title="Cancelar lançamento"
                          className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(item)}
                      aria-label={`Excluir: ${item.descricao}`}
                      title="Excluir"
                      className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatForma(value) {
  const labels = {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    CARTAO_DEBITO: "Cartão de débito",
    CARTAO_CREDITO: "Cartão de crédito",
    BOLETO: "Boleto",
    TRANSFERENCIA: "Transferência",
  };
  return labels[value] ?? value ?? "—";
}

/**
 * Financeiro da oficina (rota /financeiro, somente ADMIN).
 * Contas a receber (`/pagamentos`) e a pagar (`/despesas`) via API.
 */
function Financeiro() {
  const { isDemo } = useAuth();
  const { toast, showToast, dismissToast } = useToast();

  const [tab, setTab] = useState(KIND.RECEBER);
  const [status, setStatus] = useState("todos");
  const [data, setData] = useState({ [KIND.RECEBER]: [], [KIND.PAGAR]: [] });
  const [loading, setLoading] = useState(() => !isDemo);
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [receber, pagar] = await Promise.all([api.pagamentos.list(), api.despesas.list()]);
      setData({
        [KIND.RECEBER]: Array.isArray(receber) ? receber : [],
        [KIND.PAGAR]: Array.isArray(pagar) ? pagar : [],
      });
    } catch {
      // O banner global já mostra o erro da API.
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const items = data[tab];
  const visible = useMemo(
    () =>
      items
        .filter((item) => status === "todos" || item.status === status)
        .sort((a, b) => String(a.vencimento ?? "").localeCompare(String(b.vencimento ?? ""))),
    [items, status],
  );

  const totals = useMemo(
    () => ({ [KIND.RECEBER]: totalsByStatus(data[KIND.RECEBER]), [KIND.PAGAR]: totalsByStatus(data[KIND.PAGAR]) }),
    [data],
  );
  const overdueCount = items.filter(isOverdue).length;

  const apiFor = (kind) => (kind === KIND.RECEBER ? api.pagamentos : api.despesas);

  const changeStatus = async (item, nextStatus, message) => {
    setBusyId(item.id);
    try {
      await apiFor(tab).changeStatus(item.id, nextStatus);
      showToast(message, nextStatus === "PAGO" ? "success" : "warning");
      await load();
    } catch {
      // Erro exibido pelo banner global da API.
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await apiFor(tab).remove(item.id);
      showToast("Lançamento excluído.", "warning");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const createLancamento = async (payload) => {
    await apiFor(tab).create(payload);
    showToast(`${KIND_CONFIG[tab].singular} registrado.`);
    await load();
  };

  const config = KIND_CONFIG[tab];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav
            aria-label="Trilha"
            className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Administração <ChevronRightIcon className="size-3" />{" "}
            <span className="text-blue-700">Financeiro</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
            {isDemo && <Badge variant="slate">Demonstração</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Contas a receber e a pagar da oficina. Visível somente para o administrador.
          </p>
        </div>
        {!isDemo && (
          <Button icon={PlusIcon} size="lg" onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
            Novo {config.singular.toLowerCase()}
          </Button>
        )}
      </div>

      {isDemo && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            O financeiro depende da API. No modo demonstração nenhum lançamento é exibido ou gravado; entre com uma conta
            real para usar esta tela.
          </p>
        </Card>
      )}

      {!isDemo && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={WalletIcon}
              iconClassName="bg-emerald-100 text-emerald-700"
              label="A receber"
              value={formatBRL(totals[KIND.RECEBER].pending, 0)}
              note={`${formatBRL(totals[KIND.RECEBER].paid, 0)} já recebido`}
            />
            <StatCard
              icon={WalletIcon}
              iconClassName="bg-red-100 text-red-600"
              label="A pagar"
              value={formatBRL(totals[KIND.PAGAR].pending, 0)}
              note={`${formatBRL(totals[KIND.PAGAR].paid, 0)} já pago`}
            />
            <StatCard
              icon={WalletIcon}
              iconClassName="bg-blue-100 text-blue-600"
              label="Lançamentos"
              value={data[KIND.RECEBER].length + data[KIND.PAGAR].length}
              note="recebimentos e despesas"
            />
            <StatCard
              icon={WalletIcon}
              iconClassName="bg-amber-100 text-amber-700"
              label="Vencidos"
              value={overdueCount}
              note={tab === KIND.RECEBER ? "recebimentos em atraso" : "despesas em atraso"}
            />
          </div>

          <Card className="overflow-hidden p-0!">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-blue-50/60 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div role="tablist" aria-label="Tipo de lançamento" className="flex rounded-xl bg-white p-1 shadow-sm">
                {TABS.map((key) => (
                  <button
                    key={key}
                    role="tab"
                    type="button"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      tab === key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {KIND_CONFIG[key].label}
                  </button>
                ))}
              </div>
              <div className="w-full sm:w-56">
                <SelectField label="Situação" options={STATUS_FILTERS} value={status} onChange={(event) => setStatus(event.target.value)} />
              </div>
            </div>

            {loading && items.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-500">Carregando lançamentos...</p>
            ) : (
              <LancamentosTable
                items={visible}
                kind={tab}
                busyId={busyId}
                onPaid={(item) => changeStatus(item, "PAGO", `${KIND_CONFIG[tab].paidLabel} registrado.`)}
                onCancel={(item) => changeStatus(item, "CANCELADO", "Lançamento cancelado.")}
                onDelete={setDeleteTarget}
              />
            )}

            <div className="border-t border-slate-200 bg-blue-50/60 px-4 py-3">
              <p className="text-xs text-slate-600" aria-live="polite">
                Mostrando <strong className="text-slate-900">{visible.length}</strong> de{" "}
                <strong className="text-slate-900">{items.length}</strong> lançamento(s).
              </p>
            </div>
          </Card>
        </>
      )}

      {modalOpen && (
        <FinanceiroFormModal kind={tab} onClose={() => setModalOpen(false)} onSubmit={createLancamento} />
      )}

      {deleteTarget && (
        <FinanceiroDeleteModal
          item={deleteTarget}
          kind={tab}
          onClose={() => setDeleteTarget(null)}
          onConfirm={remove}
        />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Financeiro;
