import { useMemo, useState } from "react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Pagination from "../../../components/ui/Pagination";
import Toast from "../../../components/ui/Toast";
import { useOrcamentos } from "../../../hooks/useOrcamentos";
import { useOrdens } from "../../../hooks/useOrdens";
import { useServicos } from "../../../hooks/useServicos";
import { useToast } from "../../../hooks/useToast";
import { downloadCsv } from "../../../utils/csv";
import ServicoDeleteModal from "./ServicoDeleteModal";
import ServicoFormModal from "./ServicoFormModal";
import ServicosCatalogTable from "./ServicosCatalogTable";
import ServicosStats from "./ServicosStats";
import ServicosToolbar from "./ServicosToolbar";
import {
  CSV_HEADERS,
  PAGE_SIZE,
  computeServiceStats,
  filterServices,
  serviceUsage,
  toCsvRows,
} from "./servicoUtils";

/**
 * Catálogo de serviços da oficina (rota /ordens-de-servico/servicos).
 * É a tabela de mão de obra usada nas OS e nos orçamentos.
 */
function ServicosCatalogo() {
  const { services, createService, updateService, setServiceStatus, deleteService } = useServicos();
  const { orders } = useOrdens();
  const { quotes } = useOrcamentos();
  const { toast, showToast, dismissToast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: "create" | "edit" | "delete", code }

  const usage = useMemo(() => serviceUsage(orders, quotes), [orders, quotes]);
  const stats = useMemo(() => computeServiceStats(services, orders, usage), [services, orders, usage]);
  const filtered = useMemo(
    () =>
      filterServices(services, { search, category, status }).sort(
        (a, b) => (a.status === b.status ? a.code.localeCompare(b.code) : a.status === "ativo" ? -1 : 1),
      ),
    [services, search, category, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);
  const selected = modal?.code ? services.find((service) => service.code === modal.code) : null;

  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const toggle = (service) => {
    const next = service.status === "ativo" ? "inativo" : "ativo";
    setServiceStatus(service.code, next);
    showToast(
      next === "ativo" ? `"${service.description}" reativado.` : `"${service.description}" desativado para novas OS.`,
      next === "ativo" ? "success" : "warning",
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav aria-label="Trilha" className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Ordens de Serviço <ChevronRightIcon className="size-3" /> <span className="text-blue-700">Serviços</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Catálogo de Serviços</h1>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">{stats.active} ativos</span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Tabela de mão de obra e tempos padrão usada nas OS e nos orçamentos
          </p>
        </div>
        <Button icon={PlusIcon} size="lg" onClick={() => setModal({ type: "create" })} className="w-full sm:w-auto">
          Novo Serviço
        </Button>
      </div>

      <ServicosStats stats={stats} />

      <Card className="overflow-hidden p-0!">
        <ServicosToolbar
          search={search}
          onSearchChange={withReset(setSearch)}
          category={category}
          onCategoryChange={withReset(setCategory)}
          status={status}
          onStatusChange={withReset(setStatus)}
          counts={{ all: services.length, active: stats.active, inactive: stats.inactive }}
          canExport={filtered.length > 0}
          onExport={() => {
            downloadCsv("servicos.csv", CSV_HEADERS, toCsvRows(filtered, usage));
            showToast(`Catálogo exportado: ${filtered.length} serviço(s).`);
          }}
        />
        <ServicosCatalogTable
          services={visible}
          usage={usage}
          onEdit={(service) => setModal({ type: "edit", code: service.code })}
          onToggle={toggle}
          onDelete={(service) => setModal({ type: "delete", code: service.code })}
        />
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600" aria-live="polite">
            {filtered.length === 0 ? (
              "Nenhum serviço para exibir"
            ) : (
              <>
                Mostrando <strong className="text-slate-900">{firstIndex + 1}-{firstIndex + visible.length}</strong> de{" "}
                <strong className="text-slate-900">{filtered.length}</strong> serviços
              </>
            )}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>

      {modal?.type === "create" && (
        <ServicoFormModal
          services={services}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            const created = createService(data);
            showToast(`Serviço ${created.code} cadastrado.`);
          }}
        />
      )}
      {modal?.type === "edit" && selected && (
        <ServicoFormModal
          service={selected}
          services={services}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            updateService(selected.code, data);
            showToast(`Serviço ${selected.code} atualizado.`);
          }}
        />
      )}
      {modal?.type === "delete" && selected && (
        <ServicoDeleteModal
          service={selected}
          usedCount={usage.get(selected.code)?.total ?? 0}
          onClose={() => setModal(null)}
          onDelete={() => {
            deleteService(selected.code);
            showToast(`Serviço ${selected.code} excluído.`, "warning");
          }}
          onDeactivate={() => {
            setServiceStatus(selected.code, "inativo");
            showToast(`"${selected.description}" desativado.`, "warning");
          }}
        />
      )}
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default ServicosCatalogo;
