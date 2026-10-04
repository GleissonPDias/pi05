import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import { useClientes } from "../../hooks/useClientes";
import { useToast } from "../../hooks/useToast";
import { useVeiculos } from "../../hooks/useVeiculos";
import { downloadCsv } from "../../utils/csv";
import VehicleDeleteModal from "./components/VehicleDeleteModal";
import VehicleDetailModal from "./components/VehicleDetailModal";
import VehicleFormModal from "./components/VehicleFormModal";
import VeiculosStats from "./components/VeiculosStats";
import VeiculosTable from "./components/VeiculosTable";
import VeiculosToolbar from "./components/VeiculosToolbar";
import { PAGE_SIZE } from "./constants";
import {
  CSV_HEADERS,
  computeStats,
  filterVehicles,
  listBrands,
  toCsvRows,
  vehicleName,
} from "./vehicleUtils";

function Veiculos() {
  const { vehicles, createVehicle, updateVehicle, updateMileage, deleteVehicle } =
    useVeiculos();
  const { clients, createClient } = useClientes();
  const { toast, showToast, dismissToast } = useToast();
  const [searchParams] = useSearchParams();

  // ?busca=texto abre a lista já filtrada (links vindos de Clientes)
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [filter, setFilter] = useState("all");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  // Pop-up aberto: null | { type: "create" } | { type: "edit" | "detail" | "delete", id }
  const [modal, setModal] = useState(null);

  const ownersById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const stats = useMemo(() => computeStats(vehicles), [vehicles]);
  const brands = useMemo(() => listBrands(vehicles), [vehicles]);
  const filtered = useMemo(
    () => filterVehicles(vehicles, ownersById, { search, filter, brand, sort }),
    [vehicles, ownersById, search, filter, brand, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const selected = modal?.id ? vehicles.find((vehicle) => vehicle.id === modal.id) : null;
  const closeModal = () => setModal(null);

  /** Troca um filtro e volta para a primeira página. */
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleExport = () => {
    downloadCsv("veiculos.csv", CSV_HEADERS, toCsvRows(filtered, ownersById));
    showToast(`Lista exportada: ${filtered.length} veículo(s).`);
  };

  const handleCreate = (data, { draft }) => {
    createVehicle(data);
    showToast(
      draft
        ? `Rascunho do veículo ${data.plate} salvo. Complete o cadastro quando quiser.`
        : `Veículo ${vehicleName(data)} (${data.plate}) cadastrado com sucesso!`,
      draft ? "warning" : "success",
    );
  };

  const handleUpdate = (data, { draft }) => {
    updateVehicle(selected.id, data);
    showToast(
      draft
        ? `Rascunho do veículo ${data.plate} atualizado.`
        : `Dados do veículo ${data.plate} atualizados.`,
    );
  };

  const handleDelete = () => {
    deleteVehicle(selected.id);
    showToast(`Veículo ${selected.plate} excluído da frota.`, "warning");
  };

  const rangeStart = filtered.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = firstIndex + visible.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Veículos</h1>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
              {stats.registered} ativos
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Frota cadastrada e histórico técnico de manutenção • Oficina Matriz
          </p>
        </div>
        <Button
          icon={PlusIcon}
          size="lg"
          onClick={() => setModal({ type: "create" })}
          className="w-full sm:w-auto"
        >
          Novo Veículo
        </Button>
      </div>

      <VeiculosStats stats={stats} />

      <Card className="overflow-hidden p-0!">
        <VeiculosToolbar
          search={search}
          onSearchChange={withReset(setSearch)}
          filter={filter}
          onFilterChange={withReset(setFilter)}
          brand={brand}
          brands={brands}
          onBrandChange={withReset(setBrand)}
          sort={sort}
          onSortChange={withReset(setSort)}
          counts={stats}
          onExport={handleExport}
          canExport={filtered.length > 0}
        />

        <VeiculosTable
          vehicles={visible}
          ownersById={ownersById}
          onView={(vehicle) => setModal({ type: "detail", id: vehicle.id })}
          onEdit={(vehicle) => setModal({ type: "edit", id: vehicle.id })}
          onDelete={(vehicle) => setModal({ type: "delete", id: vehicle.id })}
        />

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600" aria-live="polite">
            {filtered.length === 0 ? (
              "Nenhum veículo para exibir"
            ) : (
              <>
                Mostrando{" "}
                <strong className="text-slate-900">
                  {rangeStart}-{rangeEnd}
                </strong>{" "}
                de <strong className="text-slate-900">{filtered.length}</strong>{" "}
                veículos cadastrados
              </>
            )}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>

      {modal?.type === "create" && (
        <VehicleFormModal
          mode="create"
          vehicles={vehicles}
          clients={clients}
          createClient={createClient}
          onSubmit={handleCreate}
          onClose={closeModal}
          onToast={showToast}
        />
      )}
      {modal?.type === "edit" && selected && (
        <VehicleFormModal
          mode="edit"
          vehicle={selected}
          vehicles={vehicles}
          clients={clients}
          createClient={createClient}
          onSubmit={handleUpdate}
          onClose={closeModal}
          onToast={showToast}
        />
      )}
      {modal?.type === "detail" && selected && (
        <VehicleDetailModal
          vehicle={selected}
          owner={ownersById.get(selected.ownerId)}
          onUpdateMileage={updateMileage}
          onEdit={() => setModal({ type: "edit", id: selected.id })}
          onToast={showToast}
          onClose={closeModal}
        />
      )}
      {modal?.type === "delete" && selected && (
        <VehicleDeleteModal
          vehicle={selected}
          owner={ownersById.get(selected.ownerId)}
          onConfirm={handleDelete}
          onClose={closeModal}
        />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Veiculos;
