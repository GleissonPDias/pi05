import { useState } from "react";
import { CameraIcon, CheckCheckIcon, CircleCheckBigIcon, ClipboardCheckIcon, ScanSearchIcon, Trash2Icon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import TextAreaField from "../../../components/ui/TextAreaField";
import { cn } from "../../../utils/cn";
import { CHECKLIST_ITEMS, CHECKLIST_STATES, DAMAGE_AREAS, DAMAGE_TYPES } from "../constants";
import { createId } from "../ordemUtils";
import CarDamageMap from "./CarDamageMap";
import InspectionPhotos from "./InspectionPhotos";
import SectionCard from "./SectionCard";

/** Linha do checklist: item + OK / Atenção / Avaria. */
function ChecklistRow({ item, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span className={cn("size-2 rounded-full", value ? CHECKLIST_STATES[value].dot : "bg-slate-300")} />
        {item.label}
      </span>
      <div role="radiogroup" aria-label={item.label} className="inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5">
        {Object.entries(CHECKLIST_STATES).map(([key, state]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            disabled={disabled}
            onClick={() => onChange(key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-default",
              value === key ? state.active : "text-slate-600 hover:bg-white",
            )}
          >
            {state.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Aba 2: checklist de entrada, mapa de avarias, pertences e fotos. */
function VistoriaTab({ order, onChange, readOnly, onToast }) {
  const inspection = order.inspection;
  const [area, setArea] = useState(null);

  const update = (patch) => onChange({ inspection: { ...inspection, ...patch } });
  const checklist = inspection.checklist ?? {};
  const checked = CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;

  const markPendingOk = () =>
    update({
      checklist: Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.key, checklist[item.key] ?? "ok"])),
    });

  const addDamage = (type) => {
    update({ damages: [...inspection.damages, { id: createId("D"), area, type }] });
    setArea(null);
  };

  const finish = () => {
    if (checked < CHECKLIST_ITEMS.length) {
      onToast(`Confira todos os itens do checklist (${checked}/${CHECKLIST_ITEMS.length}).`, "warning");
      return;
    }
    if (!inspection.customerAgreed) {
      onToast("Marque a ciência do cliente para concluir a vistoria.", "warning");
      return;
    }
    update({ done: true });
    onToast("Vistoria concluída. Lembre-se de salvar a OS.");
  };

  return (
    <div className="space-y-6">
      {inspection.done ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CircleCheckBigIcon className="size-5 shrink-0" />
          <p className="flex-1">
            <strong>Vistoria de entrada concluída</strong> e confirmada pelo cliente.
          </p>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => update({ done: false })}>
              Reabrir vistoria
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Check-in pendente:</strong> registre o estado do veículo na frente do cliente antes de iniciar
          qualquer serviço. Isso protege a oficina em caso de reclamação.
        </div>
      )}

      <SectionCard
        icon={ClipboardCheckIcon}
        title="Checklist de entrada"
        badge={
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
            {checked}/{CHECKLIST_ITEMS.length} verificados
          </span>
        }
        actions={
          !readOnly &&
          checked < CHECKLIST_ITEMS.length && (
            <Button variant="soft" size="sm" icon={CheckCheckIcon} onClick={markPendingOk}>
              Marcar pendentes como OK
            </Button>
          )
        }
      >
        <div className="grid gap-2 xl:grid-cols-2">
          {CHECKLIST_ITEMS.map((item) => (
            <ChecklistRow
              key={item.key}
              item={item}
              value={checklist[item.key]}
              disabled={readOnly}
              onChange={(value) => update({ checklist: { ...checklist, [item.key]: value } })}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={ScanSearchIcon}
        title="Mapa de avarias"
        badge={
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              inspection.damages.length ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800",
            )}
          >
            {inspection.damages.length ? `${inspection.damages.length} registrada(s)` : "Sem avarias"}
          </span>
        }
      >
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <CarDamageMap damages={inspection.damages} selected={area} onSelect={setArea} disabled={readOnly} />

          <div className="min-w-0 space-y-4">
            {!readOnly &&
              (area ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-bold text-slate-900">{DAMAGE_AREAS[area]}</p>
                  <p className="mb-2 text-xs text-slate-600">Qual é o tipo da avaria?</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(DAMAGE_TYPES).map(([key, label]) => (
                      <Button key={key} variant="outline" size="sm" onClick={() => addDamage(key)}>
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  Toque na área do carro para registrar riscos, amassados ou peças quebradas.
                </p>
              ))}

            <ul className="space-y-2" aria-label="Avarias registradas">
              {inspection.damages.map((damage) => (
                <li
                  key={damage.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm"
                >
                  <span>
                    <strong className="text-slate-900">{DAMAGE_AREAS[damage.area]}</strong>{" "}
                    <span className="text-red-700">— {DAMAGE_TYPES[damage.type]}</span>
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => update({ damages: inspection.damages.filter((item) => item.id !== damage.id) })}
                      aria-label={`Remover avaria: ${DAMAGE_AREAS[damage.area]}`}
                      className="rounded p-1 text-slate-500 hover:bg-white hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="grid gap-4 lg:grid-cols-2">
              <TextAreaField
                label="Pertences deixados no veículo"
                rows={3}
                maxLength={300}
                placeholder="Ex.: óculos no porta-luvas, cadeirinha no banco traseiro."
                value={inspection.belongings}
                onChange={(event) => update({ belongings: event.target.value })}
              />
              <TextAreaField
                label="Observações da vistoria"
                rows={3}
                maxLength={300}
                placeholder="Ex.: pneus dianteiros com 40% de vida útil."
                value={inspection.notes}
                onChange={(event) => update({ notes: event.target.value })}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={CameraIcon}
        title="Fotos da vistoria"
        badge={<span className="text-xs text-slate-500">{inspection.photos.length}/8</span>}
      >
        <InspectionPhotos
          photos={inspection.photos}
          disabled={readOnly}
          onError={(message) => onToast(message, "warning")}
          onChange={(photos) => update({ photos })}
        />
      </SectionCard>

      {!readOnly && !inspection.done && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Checkbox
            checked={inspection.customerAgreed}
            onChange={(event) => update({ customerAgreed: event.target.checked })}
            className="text-sm"
          >
            O cliente acompanhou a vistoria e está de acordo com o estado registrado.
          </Checkbox>
          <Button icon={CircleCheckBigIcon} onClick={finish} className="shrink-0">
            Concluir Vistoria
          </Button>
        </div>
      )}
    </div>
  );
}

export default VistoriaTab;
