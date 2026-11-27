import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusIcon, ScaleIcon, TrendingDownIcon, TrendingUpIcon, TriangleAlertIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import StatCard from "../../components/ui/StatCard";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { api } from "../../services/api";
import { demoApi } from "../../services/demoStore";
import { downloadCsv } from "../../utils/csv";
import { formatBRL } from "../../utils/format";
import { cn } from "../../utils/cn";
import FinanceiroDeleteModal from "./FinanceiroDeleteModal";
import FinanceiroFormModal from "./FinanceiroFormModal";
import FinanceiroStatusModal from "./FinanceiroStatusModal";
import FinanceiroTable from "./FinanceiroTable";
import FinanceiroToolbar from "./FinanceiroToolbar";
import {
  CSV_HEADERS,
  KIND,
  KIND_CONFIG,
  PAGE_SIZE,
  countByStatus,
  filterLancamentos,
  sortLancamentos,
  toCsvRows,
  totalsByStatus,
} from "./financeiroUtils";

const asList = (data) => (Array.isArray(data) ? data : data?.content ?? []);

/**
 * Financeiro da oficina (rota /financeiro, permissão FINANCEIRO).
 * Contas a receber (`/pagamentos`) e a pagar (`/despesas`).
 * No modo demonstração usa dados de exemplo em memória (services/demoStore).
 */
function Financeiro() {
  const { isDemo } = useAuth();
  const { toast, showToast, dismissToast } = useToast();
  const source = isDemo ? demoApi : api;
  const clientFor = useCallback((kind) => (kind === KIND.RECEBER ? source.pagamentos : source.despesas), [source]);

  const [kind, setKind] = useState(KIND.RECEBER);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ [KIND.RECEBER]: [], [KIND.PAGAR]: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [receber, pagar] = await Promise.all([
        clientFor(KIND.RECEBER).list({ size: 200 }),
        clientFor(KIND.PAGAR).list({ size: 200 }),
      ]);
      setData({ [KIND.RECEBER]: asList(receber), [KIND.PAGAR]: asList(pagar) });
      setLoadError(false);
    } catch {
      // O aviso global mostra o detalhe do erro; aqui só marcamos a falha.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [clientFor]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const items = data[kind];
  const scope = useMemo(() => filterLancamentos(items, { search, period }), [items, search, period]);
  const counts = useMemo(() => countByStatus(scope), [scope]);
  const filtered = useMemo(() => sortLancamentos(filterLancamentos(scope, { status })), [scope, status]);

  const totals = useMemo(
    () => ({ [KIND.RECEBER]: totalsByStatus(data[KIND.RECEBER]), [KIND.PAGAR]: totalsByStatus(data[KIND.PAGAR]) }),
    [data],
  );
  const balance = totals[KIND.RECEBER].pending - totals[KIND.PAGAR].pending;
  const overdueCount = totals[KIND.RECEBER].overdueCount + totals[KIND.PAGAR].overdueCount;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const changeKind = (next) => {
    setKind(next);
    setStatus("todos");
    setPage(1);
  };

  const confirmStatus = async (item, nextStatus) => {
    setBusyId(item.id);
    try {
      await clientFor(kind).changeStatus(item.id, nextStatus);
      showToast(
        nextStatus === "PAGO" ? `${KIND_CONFIG[kind].paidLabel}: ${item.descricao}.` : "Lançamento cancelado.",
        nextStatus === "PAGO" ? "success" : "warning",
      );
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await clientFor(kind).remove(item.id);
      showToast("Lançamento excluído.", "warning");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const create = async (targetKind, payload) => {
    await clientFor(targetKind).create(payload);
    showToast(`${KIND_CONFIG[targetKind].singular} registrado.`);
    setKind(targetKind);
    setStatus("todos");
    setPage(1);
    await load();
  };

  const exportList = () => {
    downloadCsv(`financeiro-${kind === KIND.RECEBER ? "a-receber" : "a-pagar"}.csv`, CSV_HEADERS, toCsvRows(kind, filtered));
    showToast(`Lista exportada: ${filtered.length} lançamento(s).`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
            {overdueCount > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                {overdueCount} {overdueCount === 1 ? "lançamento vencido" : "lançamentos vencidos"}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Contas a receber dos clientes e contas a pagar da oficina, com vencimentos e baixas
          </p>
        </div>
        <Button icon={PlusIcon} size="lg" onClick={() => setModal({ type: "create" })} className="w-full sm:w-auto">
          Novo Lançamento
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUpIcon}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="A receber"
          value={formatBRL(totals[KIND.RECEBER].pending, 0)}
          note={`${formatBRL(totals[KIND.RECEBER].paid, 0)} já recebido`}
        />
        <StatCard
          icon={TrendingDownIcon}
          iconClassName="bg-red-100 text-red-600"
          label="A pagar"
          value={formatBRL(totals[KIND.PAGAR].pending, 0)}
          note={`${formatBRL(totals[KIND.PAGAR].paid, 0)} já pago`}
        />
        <StatCard
          icon={ScaleIcon}
          iconClassName="bg-blue-100 text-blue-600"
          label="Saldo previsto"
          value={<span className={cn(balance < 0 && "text-red-600")}>{formatBRL(balance, 0)}</span>}
          note="a receber menos a pagar (pendentes)"
        />
        <StatCard
          icon={TriangleAlertIcon}
          iconClassName={overdueCount ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}
          label="Vencidos"
          value={overdueCount}
          note={
            overdueCount
              ? `${formatBRL(totals[KIND.RECEBER].overdue, 0)} a receber · ${formatBRL(totals[KIND.PAGAR].overdue, 0)} a pagar`
              : "nenhuma conta em atraso"
          }
        />
      </div>

      <Card className="overflow-hidden p-0!">
        <FinanceiroToolbar
          kind={kind}
          onKindChange={changeKind}
          kindCounts={{ [KIND.RECEBER]: data[KIND.RECEBER].length, [KIND.PAGAR]: data[KIND.PAGAR].length }}
          search={search}
          onSearchChange={withReset(setSearch)}
          period={period}
          onPeriodChange={withReset(setPeriod)}
          status={status}
          onStatusChange={withReset(setStatus)}
          counts={counts}
          onExport={exportList}
          canExport={filtered.length > 0}
        />

        <div id="financeiro-lista" role="tabpanel" aria-labelledby={`financeiro-tab-${kind}`} aria-busy={loading}>
          {loading && items.length === 0 ? (
            <p className="px-4 py-14 text-center text-sm text-slate-500">Carregando lançamentos...</p>
          ) : loadError && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
              <p className="text-sm font-bold text-slate-900">Não foi possível carregar os lançamentos</p>
              <Button variant="outline" onClick={load}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <FinanceiroTable
              items={visible}
              kind={kind}
              busyId={busyId}
              onPaid={(item) => setModal({ type: "status", item, action: "PAGO" })}
              onCancel={(item) => setModal({ type: "status", item, action: "CANCELADO" })}
              onDelete={(item) => setModal({ type: "delete", item })}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600" aria-live="polite">
            {filtered.length === 0 ? (
              "Nenhum lançamento para exibir"
            ) : (
              <>
                Mostrando <strong className="text-slate-900">{firstIndex + 1}</strong> a{" "}
                <strong className="text-slate-900">{firstIndex + visible.length}</strong> de{" "}
                <strong className="text-slate-900">{filtered.length}</strong> lançamentos
              </>
            )}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>

      {modal?.type === "create" && (
        <FinanceiroFormModal initialKind={kind} onClose={() => setModal(null)} onSubmit={create} />
      )}
      {modal?.type === "status" && (
        <FinanceiroStatusModal
          item={modal.item}
          kind={kind}
          action={modal.action}
          onClose={() => setModal(null)}
          onConfirm={confirmStatus}
        />
      )}
      {modal?.type === "delete" && (
        <FinanceiroDeleteModal item={modal.item} kind={kind} onClose={() => setModal(null)} onConfirm={remove} />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Financeiro;
