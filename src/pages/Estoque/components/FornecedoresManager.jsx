import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import TextField from "../../../components/ui/TextField";
import { api, isDemo } from "../../../services/api";
import { SUPPLIERS } from "../../../mocks/catalogo";

function emptyForm() {
  return { nome: "", contato: "", telefone: "", email: "", leadTimeDias: 1, endereco: "", observacoes: "" };
}

export default function FornecedoresManager() {
  const demo = isDemo();
  const [items, setItems] = useState(demo ? SUPPLIERS.map((s) => ({ ...s })) : []);
  const [loading, setLoading] = useState(!demo);
  const [form, setForm] = useState(null); // null | { mode: "create"|"edit", data }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (demo) return;
    setLoading(true);
    try {
      const lista = await api.fornecedores.list();
      setItems(Array.isArray(lista) ? lista : lista?.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setForm({ mode: "create", data: emptyForm() });
    setError("");
  };

  const startEdit = (item) => {
    setForm({
      mode: "edit",
      data: {
        id: item.id,
        nome: item.name ?? item.nome ?? "",
        contato: item.contact ?? item.contato ?? "",
        telefone: item.phone ?? item.telefone ?? "",
        email: item.email ?? "",
        leadTimeDias: item.leadTimeDays ?? item.leadTimeDias ?? 1,
        endereco: item.address ?? item.endereco ?? "",
        observacoes: item.notes ?? item.observacoes ?? "",
      },
    });
    setError("");
  };

  const save = async () => {
    if (!form.data.nome.trim()) {
      setError("Informe o nome do fornecedor.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        nome: form.data.nome.trim(),
        contato: form.data.contato.trim() || null,
        telefone: form.data.telefone.trim() || null,
        email: form.data.email.trim() || null,
        leadTimeDias: Number(form.data.leadTimeDias || 0),
        endereco: form.data.endereco.trim() || null,
        observacoes: form.data.observacoes.trim() || null,
      };
      if (demo) {
        if (form.mode === "create") {
          setItems((current) => [{ id: `FOR-${Date.now()}`, name: payload.nome, ...payload }, ...current]);
        } else {
          setItems((current) => current.map((item) => (String(item.id) === String(form.data.id) ? { ...item, ...payload, name: payload.nome } : item)));
        }
      } else if (form.mode === "create") {
        await api.fornecedores.create(payload);
        await load();
      } else {
        await api.fornecedores.update(form.data.id, payload);
        await load();
      }
      setForm(null);
    } catch (err) {
      setError(err?.message || "Não foi possível salvar o fornecedor.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Excluir ${item.name ?? item.nome}?`)) return;
    if (demo) {
      setItems((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      return;
    }
    try {
      await api.fornecedores.remove(item.id);
      await load();
    } catch {
      // banner global
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Fornecedores</h2>
        <Button size="sm" onClick={startCreate}>Novo fornecedor</Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando fornecedores...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum fornecedor cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Nome</th>
                <th className="px-2 py-2">Contato</th>
                <th className="px-2 py-2">Telefone</th>
                <th className="px-2 py-2">Prazo (dias)</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{item.name ?? item.nome}</td>
                  <td className="px-2 py-2">{item.contact ?? item.contato ?? "—"}</td>
                  <td className="px-2 py-2">{item.phone ?? item.telefone ?? "—"}</td>
                  <td className="px-2 py-2">{item.leadTimeDays ?? item.leadTimeDias ?? "—"}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="soft" onClick={() => startEdit(item)}>Editar</Button>
                      <Button size="sm" variant="soft" onClick={() => remove(item)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">{form.mode === "create" ? "Novo fornecedor" : "Editar fornecedor"}</h3>
            <div className="mt-4 grid gap-3">
              <TextField label="Nome" value={form.data.nome} onChange={(e) => setForm({ ...form, data: { ...form.data, nome: e.target.value } })} />
              <TextField label="Contato" value={form.data.contato} onChange={(e) => setForm({ ...form, data: { ...form.data, contato: e.target.value } })} />
              <TextField label="Telefone" value={form.data.telefone} onChange={(e) => setForm({ ...form, data: { ...form.data, telefone: e.target.value } })} />
              <TextField label="E-mail" value={form.data.email} onChange={(e) => setForm({ ...form, data: { ...form.data, email: e.target.value } })} />
              <TextField label="Prazo de entrega (dias)" type="number" value={form.data.leadTimeDias} onChange={(e) => setForm({ ...form, data: { ...form.data, leadTimeDias: e.target.value } })} />
              <TextField label="Endereço" value={form.data.endereco} onChange={(e) => setForm({ ...form, data: { ...form.data, endereco: e.target.value } })} />
              <TextField label="Observações" value={form.data.observacoes} onChange={(e) => setForm({ ...form, data: { ...form.data, observacoes: e.target.value } })} />
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="soft" onClick={() => setForm(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
