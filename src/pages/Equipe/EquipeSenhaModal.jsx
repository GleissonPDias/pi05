import { useId, useState } from "react";
import { CheckIcon, CopyIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";

/**
 * Exibe uma senha temporária uma única vez, após o cadastro ou a redefinição.
 */
function EquipeSenhaModal({ member, password, mode = "reset", onClose }) {
  const titleId = useId();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sem permissão de área de transferência: a senha continua visível.
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <ModalHeader
        icon={KeyRoundIcon}
        iconClassName="bg-amber-100 text-amber-700"
        className="border-amber-100 bg-amber-50"
        subtitleClassName="text-amber-800"
        titleId={titleId}
        title={mode === "created" ? "Funcionário cadastrado" : "Senha redefinida"}
        subtitle={`${member.name} • ${member.email}`}
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <p className="text-sm text-slate-600">
          {mode === "created"
            ? "A conta foi criada no Supabase Auth. Entregue a senha temporária abaixo ao funcionário."
            : "A senha anterior deixou de valer. Entregue a nova senha temporária abaixo."}
        </p>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-lg font-bold tracking-wider text-slate-900">
            {password}
          </code>
          <Button
            variant="outline"
            size="sm"
            icon={copied ? CheckIcon : CopyIcon}
            onClick={copy}
            className="shrink-0"
          >
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            Esta senha é exibida <strong>uma única vez</strong>. No próximo login o sistema solicita a
            troca por uma senha pessoal.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button size="lg" onClick={onClose} data-autofocus className="w-full sm:w-auto">
          Entendi
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default EquipeSenhaModal;
