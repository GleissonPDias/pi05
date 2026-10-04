import { useId, useState } from "react";
import {
  CircleXIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UnlinkIcon,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../../../components/ui/Modal";
import SelectField from "../../../components/ui/SelectField";
import { maskCpfCnpj } from "../../../utils/masks";
import { DEACTIVATION_REASONS } from "../constants";

/** ["A", "B", "C"] -> "A, B e C" */
function joinNatural(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function ConsequenceItem({ icon: Icon, iconClassName, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-800">
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconClassName}`} />
      <p>{children}</p>
    </li>
  );
}

/**
 * Pop-up de confirmação para excluir (desativar) um cliente.
 * O cadastro não é apagado: fica inativo para preservar o histórico e os
 * registros fiscais.
 *
 * Props:
 * - client: cliente que será desativado
 * - onConfirm(reason): chamado ao confirmar, com o motivo escolhido
 * - onClose(): fecha o pop-up
 */
function ClienteDeleteModal({ client, onConfirm, onClose }) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const canConfirm = Boolean(reason) && confirmed;
  const documentLabel = client.document.length > 11 ? "CNPJ" : "CPF";
  const vehicles = client.vehicles.map((v) => `${v.model} placa ${v.plate}`);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canConfirm) return;
    onConfirm(reason);
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={TriangleAlertIcon}
          iconClassName="bg-red-600 text-white"
          className="border-red-100 bg-red-50"
          subtitleClassName="text-red-700"
          titleId={titleId}
          title="Excluir Cadastro de Cliente?"
          subtitle="Atenção: ação irreversível para novas operações e agendamentos."
          onClose={onClose}
        />

        <ModalBody className="space-y-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-slate-800">
              Você está prestes a desativar o cadastro de{" "}
              <strong className="text-red-700 underline">{client.name}</strong> (
              {documentLabel}: {maskCpfCnpj(client.document)}).
            </p>

            <ul className="mt-3 space-y-2.5">
              <ConsequenceItem icon={CircleXIcon} iconClassName="text-red-600">
                <strong>Sem novas OS:</strong> o cliente não poderá mais ter novos
                orçamentos ou ordens de serviço abertas no sistema.
              </ConsequenceItem>
              <ConsequenceItem
                icon={ShieldCheckIcon}
                iconClassName="text-emerald-700"
              >
                <strong>Preservação legal:</strong> o histórico técnico de
                manutenções e os registros fiscais/NFS-e serão preservados por
                exigências regulatórias.
              </ConsequenceItem>
              {vehicles.length > 0 && (
                <ConsequenceItem icon={UnlinkIcon} iconClassName="text-red-600">
                  <strong>Desassociação de frotas:</strong>{" "}
                  {vehicles.length === 1
                    ? `1 veículo vinculado (${vehicles[0]}) será desassociado`
                    : `${vehicles.length} veículos vinculados (${joinNatural(vehicles)}) serão desassociados`}{" "}
                  do proprietário.
                </ConsequenceItem>
              )}
            </ul>
          </div>

          <SelectField
            label="Motivo da desativação (obrigatório para auditoria)"
            required
            placeholder="Selecione o motivo..."
            options={DEACTIVATION_REASONS}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />

          <div className="rounded-lg bg-blue-50 p-3">
            <Checkbox
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="text-sm"
            >
              Estou ciente e confirmo a desativação deste cadastro de cliente.
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
            Cancelar / Manter Cliente
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="lg"
            icon={Trash2Icon}
            disabled={!canConfirm}
            className="w-full sm:w-auto"
          >
            Sim, Confirmar Exclusão
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default ClienteDeleteModal;
