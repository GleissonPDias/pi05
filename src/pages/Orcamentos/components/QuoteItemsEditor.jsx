import { PackagePlusIcon, Trash2Icon, WrenchIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import MoneyInput from "../../../components/ui/MoneyInput";
import QuantityStepper from "../../../components/ui/QuantityStepper";
import { formatBRL } from "../../../utils/format";

function RemoveButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remover ${label}`}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Trash2Icon className="size-4" />
    </button>
  );
}

/**
 * Itens da proposta: serviços (mão de obra) e peças, com valores editáveis.
 * - onAddService / onAddPart: abrem os pop-ups de catálogo
 */
function QuoteItemsEditor({ services, parts, onChange, onAddService, onAddPart, error }) {
  const updateService = (id, patch) => onChange({ services: services.map((line) => (line.id === id ? { ...line, ...patch } : line)) });
  const updatePart = (id, patch) => onChange({ parts: parts.map((line) => (line.id === id ? { ...line, ...patch } : line)) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={WrenchIcon} onClick={onAddService}>
          Adicionar Serviço
        </Button>
        <Button size="sm" variant="soft" icon={PackagePlusIcon} onClick={onAddPart}>
          Adicionar Peça
        </Button>
      </div>

      {services.length === 0 && parts.length === 0 && (
        <p
          className={
            error
              ? "rounded-lg border border-dashed border-red-400 bg-red-50 p-6 text-center text-sm text-red-700"
              : "rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500"
          }
          role={error ? "alert" : undefined}
        >
          {error || "Nenhum item ainda. Adicione serviços da tabela e as peças necessárias."}
        </p>
      )}

      {services.length > 0 && (
        <section aria-label="Serviços da proposta">
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Mão de obra</h4>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {services.map((line) => (
              <li key={line.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm font-semibold text-slate-900">{line.description}</p>
                  <p className="text-[11px] text-slate-500">{line.hours.toLocaleString("pt-BR")}h padrão{line.detail ? ` • ${line.detail}` : ""}</p>
                </div>
                <MoneyInput
                  className="w-32"
                  value={line.price}
                  aria-label={`Valor de ${line.description}`}
                  onChange={(price) => updateService(line.id, { price })}
                />
                <RemoveButton label={line.description} onClick={() => onChange({ services: services.filter((item) => item.id !== line.id) })} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {parts.length > 0 && (
        <section aria-label="Peças da proposta">
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Peças</h4>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {parts.map((line) => (
              <li key={line.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm font-semibold text-slate-900">{line.description}</p>
                  <p className="font-mono text-[11px] text-slate-500">{line.code || "AVULSA"}</p>
                </div>
                <QuantityStepper value={line.qty} onChange={(qty) => updatePart(line.id, { qty })} />
                <MoneyInput
                  className="w-28"
                  value={line.unitPrice}
                  aria-label={`Valor unitário de ${line.description}`}
                  onChange={(unitPrice) => updatePart(line.id, { unitPrice })}
                />
                <span className="w-24 text-right text-sm font-bold text-slate-900">{formatBRL(line.qty * line.unitPrice)}</span>
                <RemoveButton label={line.description} onClick={() => onChange({ parts: parts.filter((item) => item.id !== line.id) })} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default QuoteItemsEditor;
