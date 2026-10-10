import { useId, useState } from "react";
import { PowerOffIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";

/**
 * Exclusão de peça. Peça com histórico (movimentações, OS ou orçamentos) não
 * pode ser apagada: a alternativa é inativar.
 */
function PartDeleteModal({ part, usageCount, onDelete, onDeactivate, onClose }) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const used = usageCount > 0;

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <ModalHeader
        icon={TriangleAlertIcon}
        iconClassName="bg-red-600 text-white"
        className="border-red-100 bg-red-50"
        subtitleClassName="text-red-700"
        titleId={titleId}
        title={`Excluir ${part.code}?`}
        subtitle={used ? "A peça tem histórico e não pode ser apagada." : "Esta ação não pode ser desfeita."}
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{part.description}</p>
          <p className="text-xs text-slate-600">{part.brand} • {part.stock} {part.unit} em estoque</p>
        </div>
        {used ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Ela aparece em <strong>{usageCount}</strong> registro(s) de movimentação, OS ou orçamento. Para preservar o
            histórico fiscal, <strong>inative</strong> a peça: ela some das buscas, mas continua nos registros.
          </p>
        ) : (
          <div className="rounded-lg bg-red-50 p-3">
            <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="text-sm">
              Confirmo a exclusão definitiva desta peça.
            </Checkbox>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="soft" size="lg" onClick={onClose} data-autofocus className="w-full sm:w-auto">
          Voltar
        </Button>
        {used ? (
          part.status === "ativo" && (
            <Button variant="danger" size="lg" icon={PowerOffIcon} onClick={() => { onDeactivate(); onClose(); }} className="w-full sm:w-auto">
              Inativar Peça
            </Button>
          )
        ) : (
          <Button variant="danger" size="lg" icon={Trash2Icon} disabled={!confirmed} onClick={() => { onDelete(); onClose(); }} className="w-full sm:w-auto">
            Excluir Definitivamente
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default PartDeleteModal;
