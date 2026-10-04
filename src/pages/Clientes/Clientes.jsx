import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import { useClientes } from "../../hooks/useClientes";
import { useToast } from "../../hooks/useToast";
import { useVeiculos } from "../../hooks/useVeiculos";
import { downloadCsv } from "../../utils/csv";
import {
  CSV_HEADERS,
  countClients,
  filterClients,
  toCsvRows,
} from "./clienteFilters";
import ClienteDeleteModal from "./components/ClienteDeleteModal";
import ClienteFormModal from "./components/ClienteFormModal";
import ClientesTable from "./components/ClientesTable";
import ClientesToolbar from "./components/ClientesToolbar";
import { PAGE_SIZE } from "./constants";

function Clientes() {
  const { clients: storedClients, createClient, updateClient, deactivateClient } =
    useClientes();
  const { vehicles, unlinkOwner } = useVeiculos();
  const { toast, showToast, dismissToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Os veículos vinculados e as OS em aberto vêm da tela de Veículos
  const clients = useMemo(
    () =>
      storedClients.map((client) => {
        const owned = vehicles.filter(
          (vehicle) => vehicle.ownerId === client.id && !vehicle.draft,
        );
        return {
          ...client,
          vehicles: owned.map((vehicle) => ({
            model: `${vehicle.brand} ${vehicle.model}`,
            plate: vehicle.plate,
          })),
          openOrders: owned.filter((vehicle) => vehicle.openOrder).length,
        };
      }),
    [storedClients, vehicles],
  );

  // ?busca=nome abre a lista já filtrada (usado pelos links vindos de Veículos)
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  // Pop-up aberto: null | { type: "create" } | { type: "edit" | "delete", clientId }
  // (o atalho "Novo Cliente" do Dashboard chega com state.novo = true)
  const [modal, setModal] = useState(location.state?.novo ? { type: "create" } : null);

  // Limpa o state da navegação para o pop-up não reabrir ao recarregar a página
  useEffect(() => {
    if (location.state?.novo) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  const counts = useMemo(() => countClients(clients), [clients]);
  const filtered = useMemo(
    () => filterClients(clients, { search, filter }),
    [clients, search, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const selectedClient = modal?.clientId
    ? clients.find((client) => client.id === modal.clientId)
    : null;

  const closeModal = () => setModal(null);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handleExport = () => {
    downloadCsv("clientes.csv", CSV_HEADERS, toCsvRows(filtered));
    showToast(`Lista exportada: ${filtered.length} cliente(s).`);
  };

  const handleCreate = (data) => {
    createClient(data);
    showToast(`Cliente "${data.name}" cadastrado com sucesso!`);
  };

  const handleUpdate = (data) => {
    // Reativar um cadastro remove o motivo de desativação anterior
    updateClient(
      selectedClient.id,
      data.status === "ativo" ? { ...data, inactiveReason: undefined } : data,
    );
    showToast(`Dados de "${data.name}" atualizados.`);
  };

  const handleDeactivate = (reason) => {
    deactivateClient(selectedClient.id, reason);
    unlinkOwner(selectedClient.id); // os veículos ficam sem proprietário
    showToast(`Cadastro de "${selectedClient.name}" desativado.`, "warning");
  };

  const rangeStart = filtered.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = firstIndex + visible.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Clientes</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Base de proprietários cadastrados e histórico veicular •{" "}
            {counts.active} clientes ativos
          </p>
        </div>
        <Button
          icon={PlusIcon}
          size="lg"
          onClick={() => setModal({ type: "create" })}
          className="w-full sm:w-auto"
        >
          Novo Cliente
        </Button>
      </div>

      <Card className="overflow-hidden p-0!">
        <ClientesToolbar
          search={search}
          onSearchChange={handleSearchChange}
          filter={filter}
          onFilterChange={handleFilterChange}
          counts={counts}
          onExport={handleExport}
          canExport={filtered.length > 0}
        />

        <ClientesTable
          clients={visible}
          onEdit={(client) => setModal({ type: "edit", clientId: client.id })}
          onDelete={(client) => setModal({ type: "delete", clientId: client.id })}
        />

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600" aria-live="polite">
            {filtered.length === 0 ? (
              "Nenhum cliente para exibir"
            ) : (
              <>
                Mostrando{" "}
                <strong className="text-slate-900">
                  {rangeStart}-{rangeEnd}
                </strong>{" "}
                de <strong className="text-slate-900">{filtered.length}</strong>{" "}
                clientes cadastrados
              </>
            )}
          </p>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      </Card>

      {modal?.type === "create" && (
        <ClienteFormModal
          mode="create"
          clients={clients}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      )}
      {modal?.type === "edit" && selectedClient && (
        <ClienteFormModal
          mode="edit"
          client={selectedClient}
          clients={clients}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      )}
      {modal?.type === "delete" && selectedClient && (
        <ClienteDeleteModal
          client={selectedClient}
          onConfirm={handleDeactivate}
          onClose={closeModal}
        />
      )}

      <Toast toast={toast} onClose={dismissToast} />
    </div>
  );
}

export default Clientes;
