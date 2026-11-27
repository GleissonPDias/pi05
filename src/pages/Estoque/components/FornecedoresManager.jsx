import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { BanIcon, PencilIcon, PlusIcon, SaveIcon, SearchIcon, SearchXIcon, TruckIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import TextAreaField from "../../../components/ui/TextAreaField";
import TextField from "../../../components/ui/TextField";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { SUPPLIERS } from "../../../mocks/catalogo";
import { api, isDemo } from "../../../services/api";
import { cn } from "../../../utils/cn";
import { maskPhone } from "../../../utils/masks";

const actionButton =
  "grid size-8 place-items-center rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

const columns = [
  { label: "Fornecedor", className: "w-[30%]" },
  { label: "Contato", className: "w-[16%]" },
  { label: "Telefone", className: "w-[16%]" },
  { label: "E-mail", className: "w-[22%]" },
  { label: "Prazo", className: "w-[8%]" },
  { label: "Ações", className: "w-[8%]" },
];

/** Formato único (API usa nome/contato..., o exemplo usa name/contact...). */
function normalize(item) {
  return {
    id: item.id,
    nome: item.nome ?? item.name ?? "",
    contato: item.contato ?? item.contact ?? "",
    telefone: item.telefone ?? item.phone ?? "",
    email: item.email ?? "",
    leadTimeDias: item.leadTimeDias ?? item.leadTimeDays ?? "",
    endereco: item.endereco ?? item.address ?? "",
    observacoes: item.observacoes ?? item.notes ?? "",
  };
}

const emptyForm = () => ({ nome: "", contato: "", telefone: "", email: "", leadTimeDias: "1", endereco: "", observacoes: "" });

function validate(values) {
  const errors = {};
  if (!values.nome.trim()) errors.nome = "Informe o nome do fornecedor.";
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Informe um e-mail válido.";
  const prazo = Number(values.leadTimeDias);
  if (values.leadTimeDias !== "" && (!Number.isInteger(prazo) || prazo < 0 || prazo > 90)) {
    errors.leadTimeDias = "Use um prazo entre 0 e 90 dias.";
  }
  return errors;
}

/** Cadastro e edição de fornecedor (pop-up padrão). */
function FornecedorFormModal({ supplier, onSubmit, onClose }) {
  const titleId = useId();
  const isEdit = Boolean(supplier);
  const [values, setValues] = useState(() =>
    supplier ? { ...supplier, telefone: maskPhone(supplier.telefone), leadTimeDias: String(supplier.leadTimeDias ?? "") } : emptyForm(),
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const field = (key) => ({
    value: values[key],
    error: errors[key],
    onChange: (event) => {
      const value = key === "telefone" ? maskPhone(event.target.value) : event.target.value;
      setValues((current) => ({ ...current, [key]: value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSubmitError("");
    try {
      await onSubmit({
        nome: values.nome.trim().toUpperCase(),
        contato: values.contato.trim() || null,
        telefone: values.telefone.replace(/\D/g, "") || null,
        email: values.email.trim().toLowerCase() || null,
        leadTimeDias: values.leadTimeDias === "" ? null : Number(values.leadTimeDias),
        endereco: values.endereco.trim() || null,
        observacoes: values.observacoes.trim() || null,
      });
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Não foi possível salvar o fornecedor.");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md" closeOnOverlay={false}>
      <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={TruckIcon}
          titleId={titleId}
          title={isEdit ? "Editar fornecedor" : "Novo fornecedor"}
          subtitle="Contato usado nos pedidos de compra e nas cotações de peças."
          onClose={onClose}
        />
        <ModalBody className="space-y-4">
          <TextField label="Nome / razão social" required data-autofocus maxLength={120} {...field("nome")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Pessoa de contato" maxLength={80} {...field("contato")} />
            <TextField label="Telefone / WhatsApp" inputMode="tel" placeholder="(11) 90000-0000" {...field("telefone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <TextField label="E-mail" type="email" placeholder="pedidos@fornecedor.com.br" {...field("email")} />
            <TextField label="Prazo de entrega (dias)" type="number" min="0" max="90" inputMode="numeric" {...field("leadTimeDias")} />
          </div>
          <TextField label="Endereço" maxLength={160} {...field("endereco")} />
          <TextAreaField label="Observações" rows={2} maxLength={300} counter {...field("observacoes")} />
          {submitError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {submitError}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={SaveIcon} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar fornecedor"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/** Confirmação para inativar um fornecedor. */
function FornecedorInativarModal({ supplier, onConfirm, onClose }) {
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setPending(true);
    setError("");
    try {
      await onConfirm(supplier);
      onClose();
    } catch (actionError) {
      setError(actionError?.message || "Não foi possível inativar o fornecedor.");
      setPending(false);
    }
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="md">
      <ModalHeader
        icon={BanIcon}
        iconClassName="bg-amber-100 text-amber-700"
        titleId={titleId}
        title="Inativar fornecedor?"
        subtitle="Ele deixa de aparecer nas novas compras. Pedidos e peças já vinculados continuam com os dados."
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{supplier.nome}</p>
          <p className="text-xs text-slate-600">{[supplier.contato, maskPhone(supplier.telefone)].filter(Boolean).join(" • ") || "Sem contato"}</p>
        </div>
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
        <Button variant="danger" size="lg" icon={BanIcon} disabled={pending} onClick={run} className="w-full sm:w-auto">
          {pending ? "Inativando..." : "Inativar fornecedor"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function Actions({ supplier, onEdit, onRemove }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(supplier)}
        aria-label={`Editar ${supplier.nome}`}
        title="Editar fornecedor"
        className={cn(actionButton, "hover:bg-blue-50 hover:text-blue-700")}
      >
        <PencilIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(supplier)}
        aria-label={`Inativar ${supplier.nome}`}
        title="Inativar fornecedor"
        className={cn(actionButton, "hover:bg-red-50 hover:text-red-600")}
      >
        <BanIcon className="size-4" />
      </button>
    </div>
  );
}

/** Aba "Fornecedores" do Estoque: lista, busca, cadastro, edição e inativação. */
export default function FornecedoresManager() {
  const demo = isDemo();
  const { toast, showToast, dismissToast } = useToast();
  const [items, setItems] = useState(() => (demo ? SUPPLIERS.map(normalize) : []));
  const [loading, setLoading] = useState(!demo);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    if (demo) return;
    setLoading(true);
    try {
      const lista = await api.fornecedores.list();
      setItems((Array.isArray(lista) ? lista : lista?.content ?? []).map(normalize));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [demo]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.nome, item.contato, item.email, item.telefone].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [items, search]);

  const save = async (payload) => {
    const editing = modal?.supplier;
    if (demo) {
      setItems((current) =>
        editing
          ? current.map((item) => (item.id === editing.id ? { ...item, ...payload } : item))
          : [{ ...payload, id: `FOR-${current.length + 100}` }, ...current],
      );
    } else if (editing) {
      await api.fornecedores.update(editing.id, payload);
      await load();
    } else {
      await api.fornecedores.create(payload);
      await load();
    }
    showToast(editing ? "Fornecedor atualizado." : "Fornecedor cadastrado.");
  };

  const remove = async (supplier) => {
    if (demo) setItems((current) => current.filter((item) => item.id !== supplier.id));
    else {
      await api.fornecedores.remove(supplier.id);
      await load();
    }
    showToast("Fornecedor inativado.", "warning");
  };

  return (
    <Card className="overflow-hidden p-0!">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
        <div className="min-w-0 md:mr-auto">
          <h2 className="text-base font-bold text-slate-900">Fornecedores</h2>
          <p className="text-xs text-slate-600">{items.length} cadastrados para compras e cotações</p>
        </div>
        <div className="relative min-w-0 md:w-80">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar fornecedor, contato ou e-mail..."
            aria-label="Pesquisar fornecedores"
            className="w-full truncate rounded-lg bg-blue-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button icon={PlusIcon} onClick={() => setModal({ type: "form", supplier: null })} className="shrink-0">
          Novo fornecedor
        </Button>
      </div>

      {loading ? (
        <p className="px-4 py-14 text-center text-sm text-slate-500">Carregando fornecedores...</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-600">
            <SearchXIcon className="size-6" />
          </span>
          <p className="text-sm font-bold text-slate-900">Nenhum fornecedor encontrado</p>
          <p className="max-w-xs text-xs text-slate-500">Revise a busca ou cadastre um novo fornecedor.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[52rem] table-fixed border-collapse text-left text-sm">
              <caption className="sr-only">Fornecedores cadastrados</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-blue-50/60">
                  {columns.map((column) => (
                    <th
                      key={column.label}
                      scope="col"
                      className={`${column.className} px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-blue-50/40">
                    <td className="truncate px-4 py-3.5 font-bold text-slate-900" title={item.nome}>
                      {item.nome}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{item.contato || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{item.telefone ? maskPhone(item.telefone) : "—"}</td>
                    <td className="truncate px-4 py-3.5 text-slate-700" title={item.email}>
                      {item.email || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{item.leadTimeDias !== "" && item.leadTimeDias !== null ? `${item.leadTimeDias} d` : "—"}</td>
                    <td className="px-4 py-3.5">
                      <Actions
                        supplier={item}
                        onEdit={(supplier) => setModal({ type: "form", supplier })}
                        onRemove={(supplier) => setModal({ type: "remove", supplier })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 lg:hidden">
            {visible.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 text-xs text-slate-600">
                  <p className="text-sm font-bold text-slate-900">{item.nome}</p>
                  <p>{[item.contato, item.telefone && maskPhone(item.telefone)].filter(Boolean).join(" • ") || "Sem contato"}</p>
                  {item.email && <p className="truncate">{item.email}</p>}
                  {item.leadTimeDias !== "" && item.leadTimeDias !== null && <p>Entrega em {item.leadTimeDias} dia(s)</p>}
                </div>
                <Actions
                  supplier={item}
                  onEdit={(supplier) => setModal({ type: "form", supplier })}
                  onRemove={(supplier) => setModal({ type: "remove", supplier })}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="border-t border-slate-200 bg-blue-50/60 px-4 py-3">
        <p className="text-xs text-slate-600" aria-live="polite">
          Mostrando <strong className="text-slate-900">{visible.length}</strong> de{" "}
          <strong className="text-slate-900">{items.length}</strong> fornecedores
        </p>
      </div>

      {modal?.type === "form" && <FornecedorFormModal supplier={modal.supplier} onSubmit={save} onClose={() => setModal(null)} />}
      {modal?.type === "remove" && (
        <FornecedorInativarModal supplier={modal.supplier} onConfirm={remove} onClose={() => setModal(null)} />
      )}
      <Toast toast={toast} onClose={dismissToast} />
    </Card>
  );
}
