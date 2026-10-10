import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackageIcon, PlusIcon, SettingsIcon, WrenchIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import MoneyInput from "../../../components/ui/MoneyInput";
import SelectField from "../../../components/ui/SelectField";
import Checkbox from "../../../components/ui/Checkbox";
import TextField from "../../../components/ui/TextField";
import { useServicos } from "../../../hooks/useServicos";
import { useEstoque } from "../../../hooks/useEstoque";
import { MECHANICS } from "../../../mocks/oficina";
import { formatBRL } from "../../../utils/format";
import { createId } from "../ordemUtils";
import CatalogList from "./CatalogList";
import ModeToggle from "./ModeToggle";

const mechanicOptions = MECHANICS.map((m) => ({ value: m.id, label: `${m.name} — ${m.specialty}` }));

/**
 * Pop-up "Adicionar Serviço": catálogo de serviços (somente ativos) ou serviço avulso.
 * Quando o serviço tem peças sugeridas, elas podem ser lançadas junto.
 *
 * - defaultMechanicId: mecânico responsável pela OS
 * - showMechanic: false nos orçamentos (o mecânico é definido na OS)
 * - existingPartCodes: peças que já estão lançadas (não vêm marcadas)
 * - onAdd(line, partLines)
 */
function AdicionarServicoModal({ defaultMechanicId, showMechanic = true, existingPartCodes = [], onAdd, onClose }) {
  const titleId = useId();
  const { services } = useServicos();
  const { partsByCode } = useEstoque();
  const catalog = useMemo(() => services.filter((service) => service.status === "ativo"), [services]);
  const [extraParts, setExtraParts] = useState({});
  const [mode, setMode] = useState("catalogo");
  const [selected, setSelected] = useState(null);
  const [mechanicId, setMechanicId] = useState(defaultMechanicId ?? "");
  const [hours, setHours] = useState(1);
  const [price, setPrice] = useState(0);
  const [custom, setCustom] = useState({ description: "", detail: "" });
  const [error, setError] = useState("");

  const choose = (item) => {
    setSelected(item);
    setHours(item.hours);
    setPrice(item.price);
    setExtraParts(
      Object.fromEntries((item.suggestedParts ?? []).map((code) => [code, !existingPartCodes.includes(code)])),
    );
    setError("");
  };

  const suggested = mode === "catalogo" && selected ? (selected.suggestedParts ?? []).filter((code) => partsByCode.get(code)?.status === "ativo") : [];

  const handleSubmit = (event) => {
    event.preventDefault();
    const base = mode === "catalogo" ? selected : custom.description.trim().length >= 3 ? custom : null;
    if (!base) {
      setError(mode === "catalogo" ? "Selecione um serviço da tabela." : "Descreva o serviço.");
      return;
    }
    const partLines = suggested
      .filter((code) => extraParts[code])
      .map((code) => {
        const part = partsByCode.get(code);
        return { id: createId("P"), code, description: part.description, unit: part.unit, qty: 1, unitPrice: part.price, quoted: true };
      });
    onAdd({
      id: createId("S"),
      code: mode === "catalogo" ? selected.code : "",
      description: base.description.trim(),
      detail: (base.detail ?? "").trim(),
      mechanicId: mechanicId || null,
      hours,
      price,
      done: false,
    }, partLines);
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={WrenchIcon}
          titleId={titleId}
          title="Adicionar Serviço / Mão de Obra"
          subtitle="Use a tabela de tempos padrão da oficina ou descreva um serviço avulso."
          onClose={onClose}
        />

        <ModalBody>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ModeToggle
              value={mode}
              onChange={(value) => {
                setMode(value);
                setError("");
              }}
              options={[
                { value: "catalogo", label: "Tabela de serviços" },
                { value: "avulso", label: "Serviço avulso" },
              ]}
            />
            <Link
              to="/ordens-de-servico/servicos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
            >
              <SettingsIcon className="size-3.5" />
              Gerenciar catálogo de serviços
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              {mode === "catalogo" ? (
                <CatalogList
                  items={catalog}
                  selected={selected}
                  onSelect={choose}
                  label="Tabela de serviços"
                  placeholder="Buscar serviço (ex.: freio, alinhamento, embreagem)..."
                  renderItem={(item) => (
                    <span className="flex items-start gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{item.description}</span>
                        {item.detail && <span className="block text-[11px] italic text-slate-500">{item.detail}</span>}
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <span className="text-sm font-bold text-slate-900">{formatBRL(item.price)}</span>
                        <span className="text-[11px] text-slate-500">{item.hours.toLocaleString("pt-BR")}h padrão</span>
                      </span>
                    </span>
                  )}
                />
              ) : (
                <div className="grid gap-4">
                  <TextField
                    label="Descrição do serviço"
                    required
                    data-autofocus
                    autoComplete="off"
                    placeholder="Ex.: Reparo no chicote do farol"
                    value={custom.description}
                    onChange={(event) => {
                      setCustom((current) => ({ ...current, description: event.target.value }));
                      setError("");
                    }}
                  />
                  <TextField
                    label="Detalhe (opcional)"
                    autoComplete="off"
                    placeholder="Aparece abaixo da descrição"
                    value={custom.detail}
                    onChange={(event) => setCustom((current) => ({ ...current, detail: event.target.value }))}
                  />
                </div>
              )}
              {error && (
                <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}
            </div>

            <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Execução</p>
              {showMechanic && (
                <SelectField
                  label="Mecânico"
                  placeholder="A definir"
                  options={mechanicOptions}
                  value={mechanicId}
                  onChange={(event) => setMechanicId(event.target.value)}
                />
              )}
              <TextField
                label="Tempo estimado (horas)"
                type="number"
                min="0"
                step="0.1"
                value={hours}
                onChange={(event) => setHours(Math.max(0, Number(event.target.value)))}
              />
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Valor da mão de obra</span>
                <MoneyInput value={price} onChange={setPrice} aria-label="Valor da mão de obra" />
                {hours > 0 && price > 0 && (
                  <p className="mt-1 text-[11px] text-slate-500">≈ {formatBRL(price / hours)} por hora</p>
                )}
              </div>
              {suggested.length > 0 && (
                <fieldset className="space-y-2 border-t border-slate-200 pt-3">
                  <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <PackageIcon className="size-3.5" />
                    Lançar peças sugeridas
                  </legend>
                  {suggested.map((code) => (
                    <Checkbox
                      key={code}
                      checked={Boolean(extraParts[code])}
                      onChange={(event) => setExtraParts((current) => ({ ...current, [code]: event.target.checked }))}
                    >
                      <span className="font-semibold">{partsByCode.get(code).description}</span>{" "}
                      <span className="text-slate-500">({formatBRL(partsByCode.get(code).price)})</span>
                      {existingPartCodes.includes(code) && <span className="text-amber-700"> • já lançada</span>}
                    </Checkbox>
                  ))}
                </fieldset>
              )}
            </aside>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={PlusIcon} className="w-full sm:w-auto">
            Adicionar à OS
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default AdicionarServicoModal;
