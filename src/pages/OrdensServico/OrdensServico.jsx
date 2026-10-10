import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRightIcon, DownloadIcon, PlusIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import { useClientes } from "../../hooks/useClientes";
import { useOrdens } from "../../hooks/useOrdens";
import { useToast } from "../../hooks/useToast";
import { useVeiculos } from "../../hooks/useVeiculos";
import { downloadCsv } from "../../utils/csv";
import KanbanBoard from "./components/KanbanBoard";
import NovaOrdemModal from "./components/NovaOrdemModal";
import OrdensStats from "./components/OrdensStats";
import OrdensTable from "./components/OrdensTable";
import OrdensToolbar from "./components/OrdensToolbar";
import PatioFooter from "./components/PatioFooter";
import { PAGE_SIZE } from "./constants";
import { useStatusFlow } from "./hooks/useStatusFlow";
import {
  CSV_HEADERS,
  boxUsage,
  computeOrderStats,
  filterOrders,
  formatOrderNumber,
  toCsvRows,
  withRelations,
} from "./ordemUtils";

/** O atalho não dispara enquanto o usuário digita ou com um pop-up aberto. */
function isTypingTarget(element) {
  return (
    element instanceof HTMLElement &&
    (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName))
  );
}

function OrdensServico() {
  const { orders, createOrder } = useOrdens();
  const { vehicles, createVehicle, updateMileage } = useVeiculos();
  const { clients, createClient } = useClientes();
  const { toast, showToast, dismissToast } = useToast();
  const { requestStatus, statusModals } = useStatusFlow(showToast);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef(null);

  // Visão (quadro/lista) fica na URL: ?visao=lista
  const view = searchParams.get("visao") === "lista" ? "lista" : "quadro";
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "ativas");
  const [mechanic, setMechanic] = useState("");
  const [priority, setPriority] = useState("");
  const [hideCanceled, setHideCanceled] = useState(true);
  const [page, setPage] = useState(1);

  // Pop-up "Nova OS": aberto pelo botão, pelo atalho N ou vindo de outra tela
  // (Dashboard e ficha do veículo enviam state.novaOs)
  const [newOrder, setNewOrder] = useState(() => {
    const request = location.state?.novaOs;
    if (!request) return null;
    return { vehicleId: typeof request === "object" ? request.vehicleId : undefined };
  });

  useEffect(() => {
    if (location.state?.novaOs) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  const vehiclesById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const enriched = useMemo(
    () => withRelations(orders, vehiclesById, clientsById),
    [orders, vehiclesById, clientsById],
  );

  const stats = useMemo(() => computeOrderStats(orders), [orders]);
  const busyBoxes = useMemo(() => boxUsage(orders), [orders]);

  const boardOrders = useMemo(
    () =>
      filterOrders(enriched, { search, mechanic, priority, hideCanceled, board: true }).sort(
        (a, b) => b.openedAt.localeCompare(a.openedAt),
      ),
    [enriched, search, mechanic, priority, hideCanceled],
  );
  const listOrders = useMemo(
    () =>
      filterOrders(enriched, { search, mechanic, priority, status }).sort((a, b) => b.number - a.number),
    [enriched, search, mechanic, priority, status],
  );

  const totalPages = Math.max(1, Math.ceil(listOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = listOrders.slice(firstIndex, firstIndex + PAGE_SIZE);

  // Atalhos: N = Nova OS · F = buscar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        setNewOrder({});
      } else if (key === "f") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const changeView = (next) => {
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params);
        if (next === "lista") updated.set("visao", "lista");
        else updated.delete("visao");
        return updated;
      },
      { replace: true },
    );
  };

  const handleExport = () => {
    const rows = view === "lista" ? listOrders : boardOrders;
    downloadCsv("ordens-de-servico.csv", CSV_HEADERS, toCsvRows(rows));
    showToast(`Relatório exportado: ${rows.length} OS.`);
  };

  const handleCreate = (data, { startInspection }) => {
    const created = createOrder(data);
    const vehicle = vehiclesById.get(data.vehicleId);
    if (vehicle && data.mileageIn > vehicle.mileage) updateMileage(vehicle.id, data.mileageIn);

    if (startInspection) {
      navigate(`/ordens-de-servico/${created.number}?aba=vistoria`, {
        state: { toast: `OS ${formatOrderNumber(created.number)} aberta. Faça a vistoria de entrada.` },
      });
    } else {
      showToast(`OS ${formatOrderNumber(created.number)} aberta para ${vehicle?.plate ?? "o veículo"}.`);
    }
  };

  const rangeStart = listOrders.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = firstIndex + visible.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <nav aria-label="Trilha" className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Operação <ChevronRightIcon className="size-3" /> <span className="text-blue-700">Oficina Matriz</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Ordens de Serviço</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
              <span className="size-1.5 rounded-full bg-blue-600" />
              {stats.active} OS ativas no pátio
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Controle de fluxo operacional da oficina • Monitoramento em tempo real de boxes e mecânicos
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="lg" icon={DownloadIcon} onClick={handleExport} className="w-full sm:w-auto">
            Exportar Relatório
          </Button>
          <Button
            size="lg"
            icon={PlusIcon}
            onClick={() => setNewOrder({})}
            aria-keyshortcuts="N"
            className="w-full sm:w-auto"
          >
            Nova OS
          </Button>
        </div>
      </div>

      <Card className="p-4!">
        <OrdensToolbar
          searchRef={searchRef}
          view={view}
          onViewChange={changeView}
          search={search}
          onSearchChange={withReset(setSearch)}
          mechanic={mechanic}
          onMechanicChange={withReset(setMechanic)}
          priority={priority}
          onPriorityChange={withReset(setPriority)}
          status={status}
          onStatusChange={withReset(setStatus)}
          hideCanceled={hideCanceled}
          onHideCanceledChange={setHideCanceled}
          canceledCount={stats.canceled}
        />
      </Card>

      <OrdensStats stats={stats} />

      {view === "quadro" ? (
        <>
          <KanbanBoard orders={boardOrders} hideCanceled={hideCanceled} onMove={requestStatus} />
          <PatioFooter stats={stats} />
        </>
      ) : (
        <Card className="overflow-hidden p-0!">
          <OrdensTable orders={visible} />
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600" aria-live="polite">
              {listOrders.length === 0 ? (
                "Nenhuma OS para exibir"
              ) : (
                <>
                  Mostrando <strong className="text-slate-900">{rangeStart}-{rangeEnd}</strong> de{" "}
                  <strong className="text-slate-900">{listOrders.length}</strong> ordens de serviço
                </>
              )}
            </p>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </Card>
      )}

      {newOrder && (
        <NovaOrdemModal
          orders={orders}
          vehicles={vehicles}
          clients={clients}
          busyBoxes={busyBoxes}
          initialVehicleId={newOrder.vehicleId}
          createVehicle={createVehicle}
          createClient={createClient}
          onSubmit={handleCreate}
          onClose={() => setNewOrder(null)}
          onToast={showToast}
        />
      )}

      {statusModals}
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default OrdensServico;
