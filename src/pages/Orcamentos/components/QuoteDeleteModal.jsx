import { useId, useState } from "react";
import { Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import { formatBRL } from "../../../utils/format";
import { quoteTitle, quoteTotals } from "../quoteUtils";
import QuoteStatusBadge from "./QuoteStatusBadge";

/** Confirmação de exclusão de orçamento (não vale para os convertidos em OS). */
function QuoteDeleteModal({ quote, onConfirm, onClose }) {
  const titleId = useId();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <ModalHeader
        icon={TriangleAlertIcon}
        iconClassName="bg-red-600 text-white"
        className="border-red-100 bg-red-50"
        subtitleClassName="text-red-700"
        titleId={titleId}
        title={`Excluir Orçamento #${quote.id}?`}
        subtitle="Esta ação não pode ser desfeita."
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{quote.client?.name}</p>
            <p className="truncate text-xs text-slate-600">{quoteTitle(quote)}</p>
            <QuoteStatusBadge quote={quote} className="mt-2" />
          </div>
          <p className="shrink-0 text-lg font-extrabold">{formatBRL(quoteTotals(quote).total)}</p>
        </div>
        <p className="text-sm text-slate-700">
          Se a ideia é apenas encerrar a negociação, prefira <strong>registrar a rejeição</strong>: assim o motivo entra
          nos indicadores comerciais.
        </p>
        <div className="rounded-lg bg-red-50 p-3">
          <Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="text-sm">
            Confirmo a exclusão definitiva deste orçamento.
          </Checkbox>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="soft" size="lg" onClick={onClose} data-autofocus className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button
          variant="danger"
          size="lg"
          icon={Trash2Icon}
          disabled={!confirmed}
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="w-full sm:w-auto"
        >
          Excluir Orçamento
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default QuoteDeleteModal;
