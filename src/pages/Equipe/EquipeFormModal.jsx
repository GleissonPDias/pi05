import { useId, useRef, useState } from "react";
import {
  BadgeCheckIcon,
  KeyRoundIcon,
  SaveIcon,
  UserCogIcon,
  UserPlusIcon,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import TextField from "../../components/ui/TextField";
import { maskPhone } from "../../utils/masks";
import {
  CARGO_SUGGESTIONS,
  memberToValues,
  validateMember,
} from "./equipeUtils";

function Section({ icon: Icon, title, aside, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          <Icon className="size-4" />
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * Cadastro/edição de um integrante da equipe.
 * O e-mail é a identidade no Supabase Auth e só pode ser definido na criação.
 */
function EquipeFormModal({ member, isDemo, onSubmit, onClose }) {
  const isEdit = Boolean(member);
  const titleId = useId();
  const formRef = useRef(null);
  const [values, setValues] = useState(() => memberToValues(member));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const bind = (name) => ({
    name,
    value: values[name],
    onChange: (event) => setField(name, event.target.value),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const found = validateMember(values, { isEdit });
    setErrors(found);
    const [first] = Object.keys(found);
    if (first) {
      formRef.current?.elements.namedItem(first)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Não foi possível salvar o funcionário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={isEdit ? UserCogIcon : UserPlusIcon}
          titleId={titleId}
          title={isEdit ? `Editar ${member.name}` : "Cadastrar Funcionário"}
          subtitle={
            isEdit
              ? "Atualize os dados operacionais. E-mail e perfil de acesso não mudam por aqui."
              : "O funcionário nasce com acesso operacional, sem Financeiro, Equipe ou Configurações."
          }
          badge={
            isEdit && member.profile === "ADMIN" ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                Administrador
              </span>
            ) : null
          }
          onClose={onClose}
        />

        <ModalBody>
          {isDemo && (
            <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
              Modo demonstração: as alterações ficam apenas nesta sessão do navegador.
            </p>
          )}

          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
            <Section
              icon={BadgeCheckIcon}
              title="1. Dados do funcionário"
              aside={<span className="text-xs text-slate-500">* Campos obrigatórios</span>}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  className="sm:col-span-2"
                  label="Nome completo"
                  required
                  data-autofocus
                  autoComplete="off"
                  maxLength={90}
                  placeholder="Ex.: João da Silva"
                  error={errors.name}
                  {...bind("name")}
                />
                <TextField
                  className="sm:col-span-2"
                  label="E-mail de acesso"
                  required={!isEdit}
                  type="email"
                  autoComplete="off"
                  placeholder="joao@oficina.com"
                  disabled={isEdit}
                  hint={isEdit ? "O e-mail é a identidade no Supabase Auth e não pode ser alterado." : undefined}
                  error={errors.email}
                  {...bind("email")}
                />
                <TextField
                  label="Telefone / WhatsApp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="(11) 98888-7777"
                  error={errors.phone}
                  name="phone"
                  value={maskPhone(values.phone)}
                  onChange={(event) => setField("phone", event.target.value)}
                />
                <div>
                  <TextField
                    label="Cargo"
                    required
                    autoComplete="off"
                    list="equipe-cargos"
                    maxLength={40}
                    placeholder="Ex.: Mecânico"
                    error={errors.role}
                    {...bind("role")}
                  />
                  <datalist id="equipe-cargos">
                    {CARGO_SUGGESTIONS.map((cargo) => (
                      <option key={cargo} value={cargo} />
                    ))}
                  </datalist>
                </div>
                <TextField
                  className="sm:col-span-2"
                  label="Especialidades"
                  autoComplete="off"
                  maxLength={120}
                  placeholder="Ex.: Motor, freios e suspensão"
                  hint="Aparece no cartão do mecânico e no seletor da OS."
                  {...bind("specialties")}
                />
              </div>
            </Section>

            <div className="space-y-8">
              <Section icon={UserCogIcon} title="2. Acesso e atuação">
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Checkbox
                    checked={values.executesOrders}
                    onChange={(event) => setField("executesOrders", event.target.checked)}
                    className="text-sm"
                  >
                    <strong className="text-slate-900">Executa ordens de serviço</strong>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      Aparece como “Mecânico responsável” na criação e edição de OS.
                    </span>
                  </Checkbox>
                  <Checkbox
                    checked={values.lead}
                    onChange={(event) => setField("lead", event.target.checked)}
                    className="text-sm"
                  >
                    <strong className="text-slate-900">Líder técnico</strong>
                    <span className="mt-0.5 block text-xs text-slate-600">
                      Fica no topo da lista e pode validar diagnósticos.
                    </span>
                  </Checkbox>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Comissão (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    inputMode="decimal"
                    error={errors.commission}
                    {...bind("commission")}
                  />
                  <TextField
                    label="Cor na agenda"
                    maxLength={7}
                    placeholder="#2563eb"
                    hint="Formato #RRGGBB."
                    error={errors.color}
                    {...bind("color")}
                  />
                </div>
              </Section>

              {!isEdit && (
                <Section
                  icon={KeyRoundIcon}
                  title="3. Primeiro acesso"
                  aside={<span className="text-xs text-slate-500">Opcional</span>}
                >
                  <TextField
                    label="Senha inicial"
                    type="password"
                    autoComplete="new-password"
                    maxLength={72}
                    placeholder="Deixe em branco para gerar automaticamente"
                    hint="Com senha em branco, o sistema gera uma senha temporária e a exibe uma única vez."
                    error={errors.password}
                    {...bind("password")}
                  />
                </Section>
              )}
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} disabled={submitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={SaveIcon} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar Funcionário"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default EquipeFormModal;
