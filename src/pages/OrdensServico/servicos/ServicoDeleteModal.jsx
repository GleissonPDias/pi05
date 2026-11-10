import { useId, useState } from "react";
import { PowerIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import { formatBRL } from "../../../utils/format";

/**
 * Exclusão de serviço. Se o serviço já foi usado em OS ou orçamentos, ele não
 * pode ser apagado (o histórico depende dele): a opção vira "Desativar".
 */
function ServicoDeleteModal({ service, usedCount, onDelete, onDeactivate, onClose }) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const used = usedCount > 0;

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
        title="Excluir Serviço do Catálogo?"
        subtitle={used ? "Este serviço tem histórico e não pode ser apagado." : "Esta ação não pode ser desfeita."}
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-mono text-xs font-bold text-slate-500">{service.code} • {service.category}</p>
          <p className="text-sm font-bold text-slate-900">{service.description}</p>
          <p className="text-xs text-slate-600">
            {formatBRL(service.price)} • {service.hours.toLocaleString("pt-BR")}h
          </p>
        </div>

        {used ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Ele aparece em <strong>{usedCount}</strong> {usedCount === 1 ? "lançamento" : "lançamentos"} de OS e
            orçamentos. Para preservar o histórico, <strong>desative</strong> o serviço: ele some das novas OS, mas
            continua nos registros antigos.
          </div>
        ) : (
          <div className="rounded-lg bg-red-50 p-3">
            <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="text-sm">
              Confirmo a exclusão definitiva deste serviço.
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
          service.status === "ativo" && (
            <Button
              variant="danger"
              size="lg"
              icon={PowerIcon}
              disabled={pending}
              onClick={() => run(onDeactivate)}
              className="w-full sm:w-auto"
            >
              {pending ? "Desativando..." : "Desativar Serviço"}
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

export default ServicoDeleteModal;
