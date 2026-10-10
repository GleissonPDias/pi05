import { useId, useMemo, useState } from "react";
import { PackagePlusIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import MoneyInput from "../../../components/ui/MoneyInput";
import QuantityStepper from "../../../components/ui/QuantityStepper";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { useEstoque } from "../../../hooks/useEstoque";
import { useOrdens } from "../../../hooks/useOrdens";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { reservedByCode } from "../../Estoque/estoqueUtils";
import { createId } from "../ordemUtils";
import CatalogList from "./CatalogList";
import ModeToggle from "./ModeToggle";

const UNITS = ["un", "kit", "par", "L", "jogo", "carga"].map((unit) => ({ value: unit, label: unit }));

/** Selo de disponibilidade: estoque físico menos o que já está reservado em OS. */
function stockChip(item) {
  if (item.available <= 0) return { text: item.stock > 0 ? "Tudo reservado" : "Sem estoque", className: "bg-red-100 text-red-700" };
  if (item.available <= item.minStock) return { text: `Disponível: ${item.available}`, className: "bg-amber-100 text-amber-900" };
  return { text: `Disponível: ${item.available}`, className: "bg-emerald-100 text-emerald-800" };
}

/**
 * Pop-up "Adicionar Peça": busca no catálogo do almoxarifado ou peça avulsa.
 * - onAdd(line): recebe a linha pronta para a OS
 */
function AdicionarPecaModal({ onAdd, onClose }) {
  const titleId = useId();
  const { parts } = useEstoque();
  const { orders } = useOrdens();
  const catalog = useMemo(() => {
    const reserved = reservedByCode(orders);
    return parts
      .filter((part) => part.status === "ativo")
      .map((part) => ({ ...part, available: part.stock - (reserved.get(part.code) ?? 0) }));
  }, [parts, orders]);
  const [mode, setMode] = useState("catalogo");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [custom, setCustom] = useState({ description: "", code: "", unit: "un", quoted: false });
  const [error, setError] = useState("");

  const choose = (item) => {
    setSelected(item);
    setPrice(item.price);
    setQty(1);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === "catalogo") {
      if (!selected) {
        setError("Selecione uma peça da lista.");
        return;
      }
      onAdd({
        id: createId("P"),
        code: selected.code,
        description: selected.description,
        unit: selected.unit,
        qty,
        unitPrice: price,
        quoted: true,
      });
    } else {
      if (custom.description.trim().length < 3) {
        setError("Informe a descrição da peça.");
        return;
      }
      onAdd({
        id: createId("P"),
        code: custom.code.trim().toUpperCase(),
        description: custom.description.trim(),
        unit: custom.unit,
        qty,
        unitPrice: price,
        quoted: custom.quoted,
      });
    }
    onClose();
  };

  const missing = mode === "catalogo" && selected && qty > selected.available;

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={PackagePlusIcon}
          titleId={titleId}
          title="Adicionar Peça à OS"
          subtitle="Busque no almoxarifado ou lance uma peça comprada fora do estoque."
          onClose={onClose}
        />

        <ModalBody>
          <div className="mb-4">
            <ModeToggle
              value={mode}
              onChange={(value) => {
                setMode(value);
                setError("");
              }}
              options={[
                { value: "catalogo", label: "Do estoque" },
                { value: "avulsa", label: "Peça avulsa" },
              ]}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              {mode === "catalogo" ? (
                <CatalogList
                  items={catalog}
                  selected={selected}
                  onSelect={choose}
                  label="Peças do estoque"
                  placeholder="Buscar por código ou descrição (ex.: pastilha, PF-2041)..."
                  renderItem={(item) => {
                    const chip = stockChip(item);
                    return (
                      <span className="flex items-start gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{item.description}</span>
                          <span className="mt-0.5 block text-[11px] text-slate-500"><span className="font-mono">{item.code}</span> • {item.brand} • Prat. {item.location}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-bold text-slate-900">{formatBRL(item.price)}</span>
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", chip.className)}>{chip.text}</span>
                        </span>
                      </span>
                    );
                  }}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    className="sm:col-span-2"
                    label="Descrição da peça"
                    required
                    data-autofocus
                    autoComplete="off"
                    placeholder="Ex.: Sensor de rotação (comprado na autopeças)"
                    value={custom.description}
                    onChange={(event) => {
                      setCustom((current) => ({ ...current, description: event.target.value }));
                      setError("");
                    }}
                  />
                  <TextField
                    label="Código / referência (opcional)"
                    autoComplete="off"
                    value={custom.code}
                    onChange={(event) => setCustom((current) => ({ ...current, code: event.target.value }))}
                  />
                  <SelectField
                    label="Unidade"
                    options={UNITS}
                    value={custom.unit}
                    onChange={(event) => setCustom((current) => ({ ...current, unit: event.target.value }))}
                  />
                  <div className="rounded-lg bg-blue-50 p-3 sm:col-span-2">
                    <Checkbox
                      checked={custom.quoted}
                      onChange={(event) => setCustom((current) => ({ ...current, quoted: event.target.checked }))}
                      className="text-sm"
                    >
                      Preço já confirmado com o fornecedor
                    </Checkbox>
                  </div>
                </div>
              )}
              {error && (
                <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}
            </div>

            <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Item selecionado</p>
              <p className="text-sm font-bold text-slate-900">
                {mode === "catalogo" ? (selected?.description ?? "Nenhuma peça selecionada") : custom.description || "Peça avulsa"}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-700">Quantidade</span>
                <QuantityStepper value={qty} onChange={setQty} />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Valor unitário de venda</span>
                <MoneyInput value={price} onChange={setPrice} aria-label="Valor unitário de venda" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm text-slate-600">Subtotal</span>
                <strong className="text-lg text-slate-900">{formatBRL(qty * price)}</strong>
              </div>
              {missing && (
                <p className="flex gap-2 rounded-lg bg-orange-100 p-2.5 text-xs text-orange-900">
                  <TriangleAlertIcon className="size-4 shrink-0" />
                  Estoque insuficiente ({Math.max(0, selected.available)} disponível). A peça será encomendada e a OS poderá ir para
                  “Aguard. Peças”.
                </p>
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

export default AdicionarPecaModal;
