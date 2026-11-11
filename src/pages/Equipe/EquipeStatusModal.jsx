import { useId, useState } from "react";
import { PowerIcon, UserCheckIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";

/**
 * Ativação/desativação de funcionário.
 * Desativar bloqueia o acesso mas preserva todo o histórico.
 */
function EquipeStatusModal({ member, isSelf, onConfirm, onClose }) {
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const nextActive = !member.active;
  const blocked = !nextActive && isSelf;

  const run = async () => {
    if (pending || blocked) return;
    setPending(true);
    setError("");
    try {
      await onConfirm(nextActive);
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível alterar a situação.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <ModalHeader
        icon={nextActive ? UserCheckIcon : PowerIcon}
        iconClassName={nextActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}
        className={nextActive ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}
        subtitleClassName={nextActive ? "text-emerald-800" : "text-red-700"}
        titleId={titleId}
        title={nextActive ? "Reativar funcionário?" : "Desativar funcionário?"}
        subtitle={nextActive ? "O acesso será liberado novamente." : "O acesso será bloqueado imediatamente."}
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{member.name}</p>
          <p className="text-xs text-slate-600">{member.email}</p>
          <p className="mt-1 text-xs text-slate-600">{member.role}</p>
        </div>

        {nextActive ? (
          <p className="text-sm text-slate-600">
            O funcionário volta a acessar o sistema com o perfil de funcionário e, se marcado como
            executor, volta a aparecer no seletor de mecânicos da OS.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            O histórico de OS, orçamentos e movimentações continua intacto. O acesso à API e o login
            no Supabase são bloqueados.
          </p>
        )}

        {blocked && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Você não pode desativar o seu próprio usuário.
          </p>
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
        <Button
          variant={nextActive ? "success" : "danger"}
          size="lg"
          icon={nextActive ? UserCheckIcon : PowerIcon}
          disabled={pending || blocked}
          onClick={run}
          className="w-full sm:w-auto"
        >
          {pending ? "Aplicando..." : nextActive ? "Reativar" : "Desativar"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default EquipeStatusModal;
