import { useId, useMemo, useState } from "react";
import { ArrowLeftRightIcon, ArrowRightIcon, CheckIcon, TriangleAlertIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import MoneyInput from "../../../components/ui/MoneyInput";
import QuantityStepper from "../../../components/ui/QuantityStepper";
import SelectField from "../../../components/ui/SelectField";
import TextField from "../../../components/ui/TextField";
import { SUPPLIERS } from "../../../mocks/catalogo";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import CatalogList from "../../OrdensServico/detalhe/CatalogList";
import ModeToggle from "../../OrdensServico/detalhe/ModeToggle";
import { ADJUST_REASONS, EXIT_REASONS, MOVEMENT_TYPES } from "../constants";

const supplierOptions = SUPPLIERS.map((supplier) => ({ value: supplier.id, label: supplier.name }));
const typeOptions = Object.entries(MOVEMENT_TYPES).map(([value, item]) => ({
  value,
  label: value === "ajuste" ? "Ajuste" : item.label,
}));

/**
 * Movimentação manual de estoque: entrada (compra), saída, ajuste de
 * inventário ou devolução.
 * - part: peça já escolhida (opcional) · initialType: tipo inicial
 * - parts: peças ativas · reserved: Map de reservas em OS
 * - onConfirm({ code, type, qty, unitCost, supplierId, document, note })
 */
function MovementModal({ part: initialPart, initialType = "entrada", parts, reserved, onConfirm, onClose }) {
  const titleId = useId();
  const [part, setPart] = useState(initialPart ?? null);
  const [type, setType] = useState(initialType);
  const [qty, setQty] = useState(initialPart?.onOrder?.qty ?? 1);
  const [count, setCount] = useState(String(initialPart?.stock ?? 0));
  const [unitCost, setUnitCost] = useState(initialPart?.cost ?? 0);
  const [supplierId, setSupplierId] = useState(initialPart?.supplierId ?? "");
  const [document, setDocument] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const catalog = useMemo(
    () => parts.map((item) => ({ ...item, detail: `${item.brand} • estoque ${item.stock} ${item.unit}` })),
    [parts],
  );

  const choose = (item) => {
    const full = parts.find((candidate) => candidate.code === item.code);
    setPart(full);
    setUnitCost(full.cost);
    setSupplierId(full.supplierId ?? "");
    setCount(String(full.stock));
    setQty(full.onOrder?.qty ?? 1);
    setError("");
  };

  const reservedQty = part ? reserved.get(part.code) ?? 0 : 0;
  const newBalance = !part
    ? 0
    : type === "ajuste"
      ? Number(count) || 0
      : type === "saida"
        ? part.stock - qty
        : part.stock + qty;
  const newCost =
    part && type === "entrada" && unitCost
      ? (Math.max(0, part.stock) * part.cost + qty * unitCost) / (Math.max(0, part.stock) + qty)
      : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!part) return setError("Escolha a peça.");
    if (type === "saida" && qty > part.stock) return setError(`Só há ${part.stock} ${part.unit} em estoque.`);
    if ((type === "saida" || type === "ajuste") && !reason) return setError("Informe o motivo.");
    if (type === "entrada" && !(unitCost > 0)) return setError("Informe o custo unitário da compra.");
    onConfirm({
      code: part.code,
      type,
      qty: type === "ajuste" ? Number(count) || 0 : qty,
      unitCost: type === "entrada" ? unitCost : null,
      supplierId: type === "entrada" ? supplierId || null : null,
      document: type === "entrada" ? (document.trim() ? `NF ${document.trim()}` : "Entrada manual") : type === "devolucao" ? document.trim() || "Devolução" : reason,
      note: type === "entrada" || type === "devolucao" ? reason : document.trim(),
    });
    onClose();
    return undefined;
  };

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          icon={ArrowLeftRightIcon}
          titleId={titleId}
          title="Movimentação de Estoque"
          subtitle="Entradas de compra, saídas avulsas, ajustes de inventário e devoluções ficam no histórico da peça."
          onClose={onClose}
        />

        <ModalBody>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              {initialPart ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-mono text-xs font-bold text-blue-700">{part.code}</p>
                  <p className="text-sm font-bold text-slate-900">{part.description}</p>
                  <p className="text-xs text-slate-600">{part.brand} • Prat. {part.location} • {formatBRL(part.cost)} custo médio</p>
                </div>
              ) : (
                <CatalogList
                  items={catalog}
                  selected={part}
                  onSelect={choose}
                  label="Peças do estoque"
                  placeholder="Buscar peça por código ou descrição..."
                  renderItem={(item) => (
                    <span className="flex items-start gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{item.description}</span>
                        <span className="block text-[11px] text-slate-500"><span className="font-mono">{item.code}</span> • {item.detail}</span>
                      </span>
                    </span>
                  )}
                />
              )}

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-slate-700">Tipo de movimentação</p>
                <ModeToggle value={type} onChange={(value) => { setType(value); setError(""); }} options={typeOptions} />
              </div>
            </div>

            <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {type === "ajuste" ? (
                <TextField label="Nova contagem física" type="number" min="0" value={count} onChange={(event) => setCount(event.target.value)} hint="Quantidade encontrada na prateleira" />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">Quantidade</span>
                  <QuantityStepper value={qty} onChange={setQty} />
                </div>
              )}

              {type === "entrada" && (
                <>
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-700">Custo unitário da compra</span>
                    <MoneyInput value={unitCost} onChange={setUnitCost} aria-label="Custo unitário da compra" />
                  </div>
                  <SelectField label="Fornecedor" placeholder="Selecione..." options={supplierOptions} value={supplierId} onChange={(event) => setSupplierId(event.target.value)} />
                  <TextField label="Nº da nota fiscal" autoComplete="off" inputMode="numeric" value={document} onChange={(event) => setDocument(event.target.value)} />
                </>
              )}
              {type === "saida" && (
                <>
                  <SelectField label="Motivo da saída" required placeholder="Selecione..." options={EXIT_REASONS} value={reason} onChange={(event) => setReason(event.target.value)} />
                  <TextField label="Documento / observação" autoComplete="off" value={document} onChange={(event) => setDocument(event.target.value)} />
                </>
              )}
              {type === "ajuste" && (
                <>
                  <SelectField label="Motivo do ajuste" required placeholder="Selecione..." options={ADJUST_REASONS} value={reason} onChange={(event) => setReason(event.target.value)} />
                  <TextField label="Observação" autoComplete="off" value={document} onChange={(event) => setDocument(event.target.value)} />
                </>
              )}
              {type === "devolucao" && (
                <TextField label="Origem (ex.: OS #1034)" autoComplete="off" value={document} onChange={(event) => setDocument(event.target.value)} hint="Peça que voltou de uma OS cancelada ou sobra de serviço" />
              )}

              {part && (
                <div className="rounded-lg bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Saldo</span>
                    <span className="flex items-center gap-2 font-bold">
                      {part.stock}
                      <ArrowRightIcon className="size-3.5 text-slate-400" />
                      <span className={cn(newBalance < 0 ? "text-red-600" : newBalance <= part.minStock ? "text-amber-700" : "text-emerald-700")}>
                        {Math.max(0, newBalance)} {part.unit}
                      </span>
                    </span>
                  </div>
                  {newCost !== null && (
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Custo médio</span>
                      <span>{formatBRL(part.cost)} → <strong>{formatBRL(newCost)}</strong></span>
                    </div>
                  )}
                  {type === "entrada" && part.onOrder && (
                    <p className="mt-2 text-xs text-blue-700">Pedido em aberto: {part.onOrder.qty} {part.unit} (será baixado do pedido)</p>
                  )}
                  {type === "saida" && reservedQty > 0 && part.stock - qty < reservedQty && (
                    <p className="mt-2 flex gap-1.5 text-xs text-amber-800">
                      <TriangleAlertIcon className="size-3.5 shrink-0" />
                      {reservedQty} {part.unit} estão reservados para OS em andamento.
                    </p>
                  )}
                </div>
              )}

              {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
            </aside>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="soft" size="lg" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" size="lg" icon={CheckIcon} className="w-full sm:w-auto">
            Registrar {MOVEMENT_TYPES[type].label}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default MovementModal;
