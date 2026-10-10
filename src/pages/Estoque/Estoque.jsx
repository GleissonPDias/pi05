import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftRightIcon, PlusIcon, SearchIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import { useEstoque } from "../../hooks/useEstoque";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { useOrdens } from "../../hooks/useOrdens";
import { useToast } from "../../hooks/useToast";
import { cn } from "../../utils/cn";
import { downloadCsv } from "../../utils/csv";
import { printDocument } from "../../utils/print";
import { whatsappLink } from "../OrdensServico/ordemUtils";
import EstoqueStats from "./components/EstoqueStats";
import EstoqueTable from "./components/EstoqueTable";
import EstoqueToolbar from "./components/EstoqueToolbar";
import MovementModal from "./components/MovementModal";
import MovementsTable from "./components/MovementsTable";
import PartDeleteModal from "./components/PartDeleteModal";
import PartFormModal from "./components/PartFormModal";
import PartHistoryModal from "./components/PartHistoryModal";
import PurchaseOrderModal from "./components/PurchaseOrderModal";
import PurchaseOrderPrint from "./components/PurchaseOrderPrint";
import { MOVEMENT_TYPES, MOVEMENTS_PAGE_SIZE, PAGE_SIZE } from "./constants";
import {
  CSV_HEADERS,
  buildPurchaseMessage,
  computeStockStats,
  countParts,
  filterParts,
  reservedByCode,
  toCsvRows,
} from "./estoqueUtils";

const movementFilters = [{ key: "todos", label: "Todas" }, ...Object.entries(MOVEMENT_TYPES).map(([key, item]) => ({ key, label: item.label }))];

function Estoque() {
  const { parts, partsByCode, movements, createPart, updatePart, deletePart, registerMovement, placeOrder } = useEstoque();
  const { orders } = useOrdens();
  const { quotes } = useOrcamentos();
  const { toast, showToast, dismissToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get("visao") === "movimentacoes" ? "movimentacoes" : "inventario";
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [status, setStatus] = useState("todos");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [page, setPage] = useState(1);
  const [movementType, setMovementType] = useState("todos");
  const [movementSearch, setMovementSearch] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [printing, setPrinting] = useState(null);
  // Pop-ups: { type: "create" | "edit" | "delete" | "movement" | "history" | "purchase", code?, movementType? }
  const [modal, setModal] = useState(() => (location.state?.cotacao ? { type: "purchase" } : null));

  useEffect(() => {
    if (location.state?.cotacao) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  const reserved = useMemo(() => reservedByCode(orders), [orders]);
  const stats = useMemo(() => computeStockStats(parts, reserved), [parts, reserved]);
  const scope = useMemo(
    () => filterParts(parts, reserved, { search, status: "todos", category, supplier }),
    [parts, reserved, search, category, supplier],
  );
  const counts = useMemo(() => countParts(scope, reserved), [scope, reserved]);
  const filtered = useMemo(
    () => filterParts(parts, reserved, { search, status, category, supplier }).sort((a, b) => a.code.localeCompare(b.code)),
    [parts, reserved, search, status, category, supplier],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const movementList = useMemo(() => {
    const text = movementSearch.trim().toLowerCase();
    return movements
      .filter((movement) => movementType === "todos" || movement.type === movementType)
      .filter((movement) => {
        if (!text) return true;
        const part = partsByCode.get(movement.code);
        return `${movement.code} ${part?.description ?? ""} ${movement.document}`.toLowerCase().includes(text);
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [movements, movementType, movementSearch, partsByCode]);
  const movementPages = Math.max(1, Math.ceil(movementList.length / MOVEMENTS_PAGE_SIZE));
  const currentMovementPage = Math.min(movementPage, movementPages);
  const visibleMovements = movementList.slice((currentMovementPage - 1) * MOVEMENTS_PAGE_SIZE, currentMovementPage * MOVEMENTS_PAGE_SIZE);

  const selected = modal?.code ? partsByCode.get(modal.code) : null;
  const close = () => setModal(null);
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const changeView = (next) =>
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params);
        if (next === "movimentacoes") updated.set("visao", "movimentacoes");
        else updated.delete("visao");
        return updated;
      },
      { replace: true },
    );

  const usageCount = (code) =>
    movements.filter((movement) => movement.code === code && movement.document !== "Saldo inicial").length +
    orders.reduce((sum, order) => sum + order.parts.filter((line) => line.code === code).length, 0) +
    quotes.reduce((sum, quote) => sum + quote.parts.filter((line) => line.code === code).length, 0);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Código ${code} copiado.`);
    } catch {
      showToast("Não foi possível copiar neste navegador.", "warning");
    }
  };

  const handlePurchase = (supplierData, items, { channel }) => {
    if (channel === "print") {
      printDocument(setPrinting, { supplier: supplierData, items });
      return;
    }
    if (channel === "whatsapp") {
      window.open(whatsappLink(supplierData.phone, buildPurchaseMessage(supplierData, items)), "_blank", "noopener,noreferrer");
    }
    placeOrder(items.map(({ part, qty }) => ({ code: part.code, qty })), supplierData.id);
    showToast(`Pedido de ${items.length} item(ns) registrado para ${supplierData.name}.`);
  };

  const handleMovement = (data) => {
    const movement = registerMovement(data);
    if (!movement) return;
    const part = partsByCode.get(data.code);
    showToast(`${MOVEMENT_TYPES[data.type].label} de ${part.code} registrada. Saldo: ${movement.balance} ${part.unit}.`);
  };

  const tabs = [
    { key: "inventario", label: "Inventário" },
    { key: "movimentacoes", label: `Movimentações (${movements.length})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Controle de Estoque</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              {stats.total} itens cadastrados • Inventário ativo
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Gestão de almoxarifado, reposição de peças, precificação e controle de giro da oficina
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="lg" icon={ArrowLeftRightIcon} onClick={() => setModal({ type: "movement" })} className="w-full whitespace-nowrap sm:w-auto">
            Movimentação Manual
          </Button>
          <Button size="lg" icon={PlusIcon} onClick={() => setModal({ type: "create" })} className="w-full whitespace-nowrap sm:w-auto">
            Nova Peça / Produto
          </Button>
        </div>
      </div>

      <EstoqueStats
        stats={stats}
        onShowLow={() => {
          changeView("inventario");
          withReset(setStatus)("baixo");
        }}
        onShowCritical={() => {
          changeView("inventario");
          withReset(setStatus)("critico");
        }}
        onQuickQuote={() => setModal({ type: "purchase" })}
      />

      <div role="tablist" aria-label="Visualização do estoque" className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={view === tab.key}
            onClick={() => changeView(tab.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              view === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:text-slate-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "inventario" ? (
        <Card className="overflow-hidden p-0!">
          <EstoqueToolbar
            search={search}
            onSearchChange={withReset(setSearch)}
            status={status}
            onStatusChange={withReset(setStatus)}
            category={category}
            onCategoryChange={withReset(setCategory)}
            supplier={supplier}
            onSupplierChange={withReset(setSupplier)}
            counts={counts}
            canExport={filtered.length > 0}
            onExport={() => {
              downloadCsv("inventario.csv", CSV_HEADERS, toCsvRows(filtered, reserved));
              showToast(`Inventário exportado: ${filtered.length} item(ns).`);
            }}
          />
          <EstoqueTable
            parts={visible}
            reserved={reserved}
            onCopy={copyCode}
            onEntry={(part) => setModal({ type: "movement", code: part.code, movementType: "entrada" })}
            onEdit={(part) => setModal({ type: "edit", code: part.code })}
            onHistory={(part) => setModal({ type: "history", code: part.code })}
            onBuy={(part) => setModal({ type: "purchase", code: part.code })}
          />
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600" aria-live="polite">
              {filtered.length === 0 ? (
                "Nenhuma peça para exibir"
              ) : (
                <>
                  Mostrando <strong className="text-slate-900">{firstIndex + 1}-{firstIndex + visible.length}</strong> de{" "}
                  <strong className="text-slate-900">{filtered.length}</strong> itens •{" "}
                  <span className="text-indigo-700">reservado em OS: {stats.reservedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </>
              )}
            </p>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0!">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={movementSearch}
                onChange={(event) => {
                  setMovementSearch(event.target.value);
                  setMovementPage(1);
                }}
                placeholder="Buscar por peça, código, NF ou OS..."
                aria-label="Buscar movimentações"
                className="w-full rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div role="group" aria-label="Tipo de movimentação" className="flex flex-wrap gap-2">
              {movementFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  aria-pressed={movementType === filter.key}
                  onClick={() => {
                    setMovementType(filter.key);
                    setMovementPage(1);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    movementType === filter.key ? "bg-blue-600 font-bold text-white" : "bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <MovementsTable movements={visibleMovements} partsByCode={partsByCode} />
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">{movementList.length} movimentação(ões)</p>
            <Pagination page={currentMovementPage} totalPages={movementPages} onChange={setMovementPage} />
          </div>
        </Card>
      )}

      {modal?.type === "create" && (
        <PartFormModal
          parts={parts}
          onClose={close}
          onSubmit={(data) => {
            const created = createPart(data);
            showToast(`Peça ${created.code} cadastrada.`);
          }}
        />
      )}
      {modal?.type === "edit" && selected && (
        <PartFormModal
          part={selected}
          parts={parts}
          onClose={close}
          onDelete={() => setModal({ type: "delete", code: selected.code })}
          onSubmit={(data) => {
            updatePart(selected.code, data);
            showToast(`Peça ${selected.code} atualizada.`);
          }}
        />
      )}
      {modal?.type === "delete" && selected && (
        <PartDeleteModal
          part={selected}
          usageCount={usageCount(selected.code)}
          onClose={close}
          onDelete={() => {
            deletePart(selected.code);
            showToast(`Peça ${selected.code} excluída.`, "warning");
          }}
          onDeactivate={() => {
            updatePart(selected.code, { status: "inativo" });
            showToast(`Peça ${selected.code} inativada.`, "warning");
          }}
        />
      )}
      {modal?.type === "movement" && (
        <MovementModal
          part={selected}
          initialType={modal.movementType}
          parts={parts.filter((part) => part.status === "ativo")}
          reserved={reserved}
          onClose={close}
          onConfirm={handleMovement}
        />
      )}
      {modal?.type === "history" && selected && (
        <PartHistoryModal
          part={selected}
          movements={movements}
          partsByCode={partsByCode}
          reserved={reserved.get(selected.code) ?? 0}
          onClose={close}
          onNewMovement={() => setModal({ type: "movement", code: selected.code })}
        />
      )}
      {modal?.type === "purchase" && (
        <PurchaseOrderModal parts={parts} reserved={reserved} preselected={modal.code} onClose={close} onSend={handlePurchase} />
      )}

      {printing && <PurchaseOrderPrint supplier={printing.supplier} items={printing.items} />}
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Estoque;
