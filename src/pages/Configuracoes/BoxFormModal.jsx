import { useId, useState } from "react";
import { SaveIcon, WarehouseIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import TextField from "../../components/ui/TextField";
import { BOX_TYPE_SUGGESTIONS } from "./configuracoesUtils";

/** Cadastro/edição de um box de atendimento. */
function BoxFormModal({ box, onSubmit, onClose }) {
  const titleId = useId();
  const isEdit = Boolean(box);
  const [values, setValues] = useState(() => ({
    nome: box?.nome ?? "",
    descricao: box?.descricao ?? "",
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const found = {};
    if (!values.nome.trim()) found.nome = "Informe o nome do box.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({ nome: values.nome.trim(), descricao: values.descricao.trim() });
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Não foi possível salvar o box.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={WarehouseIcon}
          titleId={titleId}
          title={isEdit ? `Editar ${box.nome}` : "Novo box de atendimento"}
          subtitle="O box aparece nas OS e na agenda."
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <TextField
            label="Nome do box"
            required
            data-autofocus
            maxLength={60}
            placeholder="Ex.: Box 07"
            value={values.nome}
            error={errors.nome}
            onChange={(event) => {
              setValues((current) => ({ ...current, nome: event.target.value }));
              setErrors({});
            }}
          />
          <div>
            <TextField
              label="Tipo / descrição"
              list="boxes-tipos"
              maxLength={200}
              placeholder="Ex.: Elevador Hidráulico"
              value={values.descricao}
              onChange={(event) => setValues((current) => ({ ...current, descricao: event.target.value }))}
            />
            <datalist id="boxes-tipos">
              {BOX_TYPE_SUGGESTIONS.map((tipo) => (
                <option key={tipo} value={tipo} />
              ))}
            </datalist>
          </div>
          {submitError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={SaveIcon} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Salvando..." : isEdit ? "Salvar" : "Criar box"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default BoxFormModal;
