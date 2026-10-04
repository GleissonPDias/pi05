import { useId, useState } from "react";
import {
  FileTextIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../../../components/ui/Modal";
import { formatKm } from "../../../utils/format";
import { vehicleName, vehicleYears } from "../vehicleUtils";
import MercosulPlate from "./MercosulPlate";

/**
 * Pop-up de confirmação para excluir um veículo da frota.
 *
 * Props:
 * - vehicle: veículo que será excluído
 * - owner: proprietário (ou undefined)
 * - onConfirm(): chamado ao confirmar
 * - onClose(): fecha o pop-up
 */
function VehicleDeleteModal({ vehicle, owner, onConfirm, onClose }) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!confirmed) return;
    onConfirm();
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={TriangleAlertIcon}
          iconClassName="bg-red-600 text-white"
          className="border-red-100 bg-red-50"
          subtitleClassName="font-bold uppercase tracking-wide text-red-700 text-xs"
          titleId={titleId}
          title="Excluir Veículo da Frota?"
          subtitle="Ação crítica e irreversível"
          onClose={onClose}
        />

        <ModalBody className="space-y-5">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            <MercosulPlate plate={vehicle.plate} size="lg" />
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-sm font-bold text-slate-900">{vehicleName(vehicle)}</p>
              <p className="text-xs text-slate-600">
                {vehicleYears(vehicle)} • {vehicle.color || "Cor não informada"} •{" "}
                {formatKm(vehicle.mileage)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Proprietário: <strong>{owner?.name ?? "sem vínculo"}</strong>
              </p>
            </div>
          </div>

          {vehicle.openOrder && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <WrenchIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong>Veículo em atendimento:</strong> há uma OS em andamento (#
                {vehicle.openOrder}). Conclua ou cancele a ordem antes de excluir.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
              <ShieldCheckIcon className="size-4" />
              Conformidade contábil e garantias
            </p>
            <ul className="space-y-2 text-sm text-slate-800">
              <li className="flex items-start gap-2.5">
                <FileTextIcon className="mt-0.5 size-4 shrink-0 text-blue-600" />
                <p>
                  As ordens de serviço, notas fiscais e termos de garantia já emitidos
                  continuam arquivados para consulta e auditoria fiscal.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <Trash2Icon className="mt-0.5 size-4 shrink-0 text-red-600" />
                <p>
                  O veículo sai da frota ativa e não poderá receber novos orçamentos
                  ou ordens de serviço, a menos que seja cadastrado novamente.
                </p>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <Checkbox
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="text-sm"
            >
              Estou ciente das consequências e confirmo a exclusão definitiva deste
              veículo.
            </Checkbox>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="soft"
            size="lg"
            onClick={onClose}
            data-autofocus
            className="w-full sm:w-auto"
          >
            Cancelar / Voltar
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="lg"
            icon={Trash2Icon}
            disabled={!confirmed || Boolean(vehicle.openOrder)}
            className="w-full sm:w-auto"
          >
            Excluir Definitivamente
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default VehicleDeleteModal;
