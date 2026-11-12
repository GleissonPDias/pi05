import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { api } from "../../services/api";
import { downloadCsv } from "../../utils/csv";

const MODULOS = ["", "CLIENTES", "VEICULOS", "OS", "ORCAMENTOS", "ESTOQUE", "AGENDA", "FINANCEIRO"];

export default function EquipeAuditoria({ members }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [modulo, setModulo] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.auditoria.list({
        usuarioId: usuarioId || undefined,
        modulo: modulo || undefined,
        de: de || undefined,
        ate: ate || undefined,
        size: 200,
      });
      setItems(Array.isArray(response?.content) ? response.content : []);
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

  const exportar = () => {
    const headers = ["Data", "Usuário", "Ação", "Módulo", "Entidade", "ID", "Resumo"];
    const rows = items.map((item) => [
      item.criadoEm,
      item.usuarioNome,
      item.acao,
      item.modulo ?? "",
      item.entidade ?? "",
      item.entidadeId ?? "",
      item.resumo ?? "",
    ]);
    downloadCsv("auditoria.csv", headers, rows);
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600">Usuário</label>
          <select
            value={usuarioId}
            onChange={(event) => setUsuarioId(event.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {(members ?? []).map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600">Módulo</label>
          <select
            value={modulo}
            onChange={(event) => setModulo(event.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {MODULOS.map((value) => (
              <option key={value || "todos"} value={value}>
                {value || "Todos"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600">De</label>
          <input
            type="date"
            value={de}
            onChange={(event) => setDe(event.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600">Até</label>
          <input
            type="date"
            value={ate}
            onChange={(event) => setAte(event.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <Button size="sm" onClick={load} disabled={loading}>
          {loading ? "Carregando..." : "Filtrar"}
        </Button>
        <Button size="sm" variant="soft" onClick={exportar} disabled={items.length === 0}>
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando auditoria...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma ação registrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Data</th>
                <th className="px-2 py-2">Usuário</th>
                <th className="px-2 py-2">Ação</th>
                <th className="px-2 py-2">Módulo</th>
                <th className="px-2 py-2">Entidade</th>
                <th className="px-2 py-2">Resumo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {item.criadoEm ? new Date(item.criadoEm).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-2 py-2">{item.usuarioNome}</td>
                  <td className="px-2 py-2">{item.acao}</td>
                  <td className="px-2 py-2">{item.modulo ?? "—"}</td>
                  <td className="px-2 py-2">
                    {item.entidade ?? "—"}
                    {item.entidadeId ? ` #${item.entidadeId}` : ""}
                  </td>
                  <td className="px-2 py-2">{item.resumo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
