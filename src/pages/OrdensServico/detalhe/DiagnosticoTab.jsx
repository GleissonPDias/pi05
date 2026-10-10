import { useState } from "react";
import { BadgeCheckIcon, StethoscopeIcon } from "lucide-react";
import Checkbox from "../../../components/ui/Checkbox";
import TextAreaField from "../../../components/ui/TextAreaField";
import { MECHANICS } from "../../../mocks/oficina";
import { mergeParts } from "../ordemUtils";
import AdicionarPecaModal from "./AdicionarPecaModal";
import AdicionarServicoModal from "./AdicionarServicoModal";
import PecasTable from "./PecasTable";
import SectionCard from "./SectionCard";
import ServicosTable from "./ServicosTable";

const leadMechanic = MECHANICS.find((mechanic) => mechanic.lead);

/** Aba 3: parecer técnico, peças e mão de obra. */
function DiagnosticoTab({ order, onChange, readOnly, onToast }) {
  const [adding, setAdding] = useState(null); // "peca" | "servico"

  const addPart = (line) => {
    const existing = line.code && order.parts.some((item) => item.code === line.code);
    onChange({ parts: mergeParts(order.parts, [line]) });
    onToast(existing ? `Quantidade de "${line.description}" atualizada.` : "Peça adicionada à OS. Salve para confirmar.");
  };

  return (
    <div className="space-y-6">
      <SectionCard
        icon={StethoscopeIcon}
        title="Parecer Técnico & Diagnóstico de Oficina"
        badge={
          order.diagnosis.validated && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <BadgeCheckIcon className="size-4" />
              Validado pelo mecânico líder
            </span>
          )
        }
      >
        <TextAreaField
          label="Laudo técnico (aparece na OS impressa)"
          rows={4}
          maxLength={1200}
          counter
          placeholder="Descreva o que foi constatado e o que precisa ser feito."
          value={order.diagnosis.text}
          onChange={(event) => onChange({ diagnosis: { ...order.diagnosis, text: event.target.value } })}
        />
        {!readOnly && (
          <Checkbox
            className="mt-3 text-sm"
            checked={order.diagnosis.validated}
            onChange={(event) => onChange({ diagnosis: { ...order.diagnosis, validated: event.target.checked } })}
          >
            Diagnóstico validado por <strong>{leadMechanic?.name}</strong> ({leadMechanic?.role})
          </Checkbox>
        )}
      </SectionCard>

      <PecasTable
        parts={order.parts}
        readOnly={readOnly}
        onChange={(parts) => onChange({ parts })}
        onAdd={() => setAdding("peca")}
      />

      <ServicosTable
        services={order.services}
        readOnly={readOnly}
        onChange={(services) => onChange({ services })}
        onAdd={() => setAdding("servico")}
      />

      {adding === "peca" && <AdicionarPecaModal onAdd={addPart} onClose={() => setAdding(null)} />}
      {adding === "servico" && (
        <AdicionarServicoModal
          defaultMechanicId={order.mechanicId}
          onClose={() => setAdding(null)}
          existingPartCodes={order.parts.map((part) => part.code)}
          onAdd={(line, partLines) => {
            onChange({ services: [...order.services, line], parts: mergeParts(order.parts, partLines) });
            onToast(
              partLines.length
                ? `Serviço e ${partLines.length} peça(s) adicionados. Salve para confirmar.`
                : "Serviço adicionado à OS. Salve para confirmar.",
            );
          }}
        />
      )}
    </div>
  );
}

export default DiagnosticoTab;
