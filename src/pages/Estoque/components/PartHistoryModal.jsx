import { useId } from "react";
import { ArrowLeftRightIcon, HistoryIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import { formatBRL } from "../../../utils/format";
import { consumption, suppliersById } from "../estoqueUtils";
import MovementsTable from "./MovementsTable";

function Metric({ label, value, note }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

/** Histórico e giro de uma peça. */
function PartHistoryModal({ part, movements, partsByCode, reserved, onNewMovement, onClose }) {
  const titleId = useId();
  const list = movements.filter((movement) => movement.code === part.code).sort((a, b) => b.at.localeCompare(a.at));
  const usage = consumption(part, movements);
  const supplier = suppliersById.get(part.supplierId);

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg">
      <ModalHeader
        icon={HistoryIcon}
        titleId={titleId}
        title={<>Histórico — <span className="font-mono text-blue-700">{part.code}</span></>}
        subtitle={`${part.description} • ${part.brand} • Prat. ${part.location || "—"}`}
        onClose={onClose}
      />
      <ModalBody className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Em estoque" value={`${part.stock} ${part.unit}`} note={reserved ? `${reserved} reservado(s) em OS` : "Nenhuma reserva"} />
          <Metric label="Saídas (90 dias)" value={`${usage.exits} ${part.unit}`} note={`≈ ${usage.monthly.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por mês`} />
          <Metric label="Cobertura" value={usage.coverageDays === null ? "—" : `${usage.coverageDays} dias`} note="No ritmo atual de consumo" />
          <Metric label="Custo médio" value={formatBRL(part.cost)} note={supplier ? `Fornecedor: ${supplier.name}` : "Sem fornecedor"} />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <MovementsTable movements={list} partsByCode={partsByCode} compact />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="soft" onClick={onClose} className="w-full sm:w-auto">
          Fechar Janela
        </Button>
        <Button icon={ArrowLeftRightIcon} onClick={onNewMovement} className="w-full sm:w-auto">
          Nova Movimentação
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default PartHistoryModal;
