import { PlusIcon, Trash2Icon, UserCogIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import MoneyInput from "../../../components/ui/MoneyInput";
import { MECHANICS } from "../../../mocks/oficina";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { MechanicAvatar, ProgressBar } from "../components/OrdemBadges";
import { mechanicName, servicesProgress } from "../ordemUtils";
import SectionCard from "./SectionCard";

const smallField =
  "rounded-lg border border-transparent bg-blue-50 px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent";

/** Tabela de mão de obra / serviços (cards no celular). */
function ServicosTable({ services, readOnly, onChange, onAdd }) {
  const progress = servicesProgress({ services });
  const total = services.reduce((sum, line) => sum + Number(line.price || 0), 0);

  const updateLine = (id, patch) => onChange(services.map((line) => (line.id === id ? { ...line, ...patch } : line)));

  const doneToggle = (line) => (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
      <input
        type="checkbox"
        checked={line.done}
        disabled={readOnly}
        onChange={(event) => updateLine(line.id, { done: event.target.checked })}
        className="size-4 cursor-pointer accent-emerald-600"
      />
      <span className={line.done ? "text-emerald-700" : undefined}>{line.done ? "Concluído" : "Pendente"}</span>
    </label>
  );

  const mechanicField = (line) =>
    readOnly ? (
      <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
        <MechanicAvatar name={mechanicName(line.mechanicId) || "?"} />
        {mechanicName(line.mechanicId) || "A definir"}
      </span>
    ) : (
      <select
        value={line.mechanicId ?? ""}
        onChange={(event) => updateLine(line.id, { mechanicId: event.target.value || null })}
        aria-label={`Mecânico de ${line.description}`}
        className={cn(smallField, "w-full text-xs")}
      >
        <option value="">A definir</option>
        {MECHANICS.map((mechanic) => (
          <option key={mechanic.id} value={mechanic.id}>
            {mechanic.name}
          </option>
        ))}
      </select>
    );

  const hoursField = (line) => (
    <input
      type="number"
      min="0"
      step="0.1"
      value={line.hours}
      disabled={readOnly}
      onChange={(event) => updateLine(line.id, { hours: Math.max(0, Number(event.target.value)) })}
      aria-label={`Tempo estimado (horas) de ${line.description}`}
      className={cn(smallField, "w-16 text-center")}
    />
  );

  const removeButton = (line) =>
    !readOnly && (
      <button
        type="button"
        onClick={() => onChange(services.filter((item) => item.id !== line.id))}
        aria-label={`Remover ${line.description}`}
        className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Trash2Icon className="size-4" />
      </button>
    );

  return (
    <SectionCard
      icon={UserCogIcon}
      title="Mão de Obra e Serviços Mecânicos"
      badge={
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
          {services.length} {services.length === 1 ? "operação" : "operações"}
        </span>
      }
      actions={
        !readOnly && (
          <Button variant="soft" size="sm" icon={PlusIcon} onClick={onAdd}>
            Adicionar Serviço
          </Button>
        )
      }
      flush
    >
      {services.length > 0 && (
        <div className="-mt-1 mb-3 flex items-center gap-3 px-5">
          <ProgressBar value={progress.pct} tone="green" className="max-w-56 flex-1" label="Serviços concluídos" />
          <span className="text-xs font-semibold text-emerald-700">
            {progress.done}/{progress.total} concluídos
          </span>
        </div>
      )}

      {services.length === 0 ? (
        <p className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
          Nenhum serviço lançado. Use “Adicionar Serviço” para usar a tabela de mão de obra.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-5 py-2.5">Descrição do serviço</th>
                  <th scope="col" className="w-44 px-2 py-2.5">Mecânico</th>
                  <th scope="col" className="w-20 px-2 py-2.5 text-center">Tempo (h)</th>
                  <th scope="col" className="w-36 px-2 py-2.5 text-right">Mão de obra</th>
                  <th scope="col" className="w-28 px-2 py-2.5">Situação</th>
                  <th scope="col" className="w-12 px-3 py-2.5"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((line) => (
                  <tr key={line.id} className={line.done ? "bg-emerald-50/40" : undefined}>
                    <td className="px-5 py-3">
                      <p className={cn("text-sm font-bold text-slate-900", line.done && "text-slate-600")}>
                        {line.description}
                      </p>
                      {line.detail && <p className="text-[11px] italic text-slate-500">{line.detail}</p>}
                    </td>
                    <td className="px-2 py-3">{mechanicField(line)}</td>
                    <td className="px-2 py-3 text-center">{hoursField(line)}</td>
                    <td className="px-2 py-3">
                      <MoneyInput
                        value={line.price}
                        disabled={readOnly}
                        aria-label={`Valor da mão de obra de ${line.description}`}
                        onChange={(price) => updateLine(line.id, { price })}
                      />
                    </td>
                    <td className="px-2 py-3">{doneToggle(line)}</td>
                    <td className="px-3 py-3">{removeButton(line)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
            {services.map((line) => (
              <li key={line.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{line.description}</p>
                    {line.detail && <p className="text-[11px] italic text-slate-500">{line.detail}</p>}
                  </div>
                  {removeButton(line)}
                </div>
                {mechanicField(line)}
                <div className="flex flex-wrap items-center gap-3">
                  {hoursField(line)}
                  <MoneyInput
                    className="w-32"
                    value={line.price}
                    disabled={readOnly}
                    aria-label={`Valor da mão de obra de ${line.description}`}
                    onChange={(price) => updateLine(line.id, { price })}
                  />
                  <span className="ml-auto">{doneToggle(line)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm">
        <span className="text-slate-600">Total mão de obra</span>
        <strong className="text-slate-900">{formatBRL(total)}</strong>
      </div>
    </SectionCard>
  );
}

export default ServicosTable;
