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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const used = usageCount > 0;

  const run = async (action) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await action();
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível concluir a ação.");
    } finally {
      setPending(false);
    }
  };

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
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="soft" size="lg" onClick={onClose} disabled={pending} data-autofocus className="w-full sm:w-auto">
          Voltar
        </Button>
        {used ? (
          part.status === "ativo" && (
            <Button variant="danger" size="lg" icon={PowerOffIcon} disabled={pending} onClick={() => run(onDeactivate)} className="w-full sm:w-auto">
              {pending ? "Inativando..." : "Inativar Peça"}
            </Button>
          )
        ) : (
          <Button
            variant="danger"
            size="lg"
            icon={Trash2Icon}
            disabled={!confirmed || pending}
            onClick={() => run(onDelete)}
            className="w-full sm:w-auto"
          >
            {pending ? "Excluindo..." : "Excluir Definitivamente"}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default PartDeleteModal;
