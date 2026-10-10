import { useId, useMemo, useState } from "react";
import { MessageCircleIcon, PrinterIcon, SendIcon, ShoppingCartIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/Modal";
import QuantityStepper from "../../../components/ui/QuantityStepper";
import { SUPPLIERS } from "../../../mocks/catalogo";
import { cn } from "../../../utils/cn";
import { formatBRL } from "../../../utils/format";
import { STOCK_STATUS } from "../constants";
import { stockStatus, suggestedQty } from "../estoqueUtils";

/**
 * Cotação rápida / pedido de compra dos itens em falta ou abaixo do mínimo,
 * agrupados por fornecedor.
 * - parts / reserved: estoque atual · preselected: código já marcado
 * - onSend(supplier, items, { channel }) — channel: "whatsapp" | "print" | "registrar"
 */
function PurchaseOrderModal({ parts, reserved, preselected, onSend, onClose }) {
  const titleId = useId();
  const candidates = useMemo(
    () =>
      parts
        .filter((part) => part.status === "ativo")
        .map((part) => ({ part, status: stockStatus(part, reserved.get(part.code)) }))
        .filter(({ part, status }) => ["critico", "baixo"].includes(status.key) || part.code === preselected)
        .sort((a, b) => (a.status.key === b.status.key ? a.part.code.localeCompare(b.part.code) : a.status.key === "critico" ? -1 : 1)),
    [parts, reserved, preselected],
  );

  const [selection, setSelection] = useState(() =>
    Object.fromEntries(
      candidates.map(({ part, status }) => [
        part.code,
        {
          checked: preselected ? part.code === preselected : status.key === "critico" && !part.onOrder,
          qty: suggestedQty(part, reserved.get(part.code)),
        },
      ]),
    ),
  );

  const groups = SUPPLIERS.map((supplier) => ({
    supplier,
    rows: candidates.filter(({ part }) => part.supplierId === supplier.id),
  })).filter((group) => group.rows.length);

  const chosen = (group) =>
    group.rows.filter(({ part }) => selection[part.code]?.checked).map(({ part }) => ({ part, qty: selection[part.code].qty }));

  const update = (code, patch) => setSelection((current) => ({ ...current, [code]: { ...current[code], ...patch } }));
  const totalSelected = groups.reduce((sum, group) => sum + chosen(group).reduce((acc, item) => acc + item.qty * item.part.cost, 0), 0);

  return (
    <Modal onClose={onClose} labelledBy={titleId} size="lg" closeOnOverlay={false}>
      <ModalHeader
        icon={ShoppingCartIcon}
        iconClassName="bg-red-100 text-red-700"
        titleId={titleId}
        title="Cotação Rápida / Pedido de Compra"
        subtitle="Itens sem disponibilidade ou no ponto de pedido, agrupados pelo fornecedor preferencial."
        onClose={onClose}
      />
      <ModalBody className="space-y-5">
        {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhum item precisa de reposição agora. 🎉</p>}
        {groups.map((group) => {
          const items = chosen(group);
          const subtotal = items.reduce((sum, item) => sum + item.qty * item.part.cost, 0);
          return (
            <section key={group.supplier.id} aria-label={group.supplier.name} className="overflow-hidden rounded-xl border border-slate-200">
              <header className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{group.supplier.name}</p>
                  <p className="text-xs text-slate-600">
                    {group.supplier.contact} • entrega em ~{group.supplier.leadTimeDays} dia(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" icon={PrinterIcon} disabled={!items.length} onClick={() => onSend(group.supplier, items, { channel: "print" })}>
                    Imprimir
                  </Button>
                  <Button size="sm" variant="success" icon={MessageCircleIcon} disabled={!items.length} onClick={() => onSend(group.supplier, items, { channel: "whatsapp" })}>
                    Pedir no WhatsApp ({formatBRL(subtotal, 0)})
                  </Button>
                </div>
              </header>
              <ul className="divide-y divide-slate-100">
                {group.rows.map(({ part, status }) => {
                  const row = selection[part.code];
                  const style = STOCK_STATUS[status.key];
                  return (
                    <li key={part.code} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !row.checked && "opacity-70")}>
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(event) => update(part.code, { checked: event.target.checked })}
                        aria-label={`Incluir ${part.code} no pedido`}
                        className="size-4 accent-blue-600"
                      />
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="font-mono text-xs text-blue-700">{part.code}</span> {part.description}
                        </p>
                        <p className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                          <span className={cn("rounded-full px-2 py-0.5 font-bold", style.badge)}>{style.label}</span>
                          Disponível {Math.max(0, status.available)} • mín. {part.minStock}
                          {part.onOrder && <span className="font-semibold text-blue-700">• já pedido: {part.onOrder.qty}</span>}
                        </p>
                      </div>
                      <QuantityStepper value={row.qty} onChange={(qty) => update(part.code, { qty, checked: true })} label={`Quantidade de ${part.code}`} />
                      <span className="w-24 text-right text-sm font-bold text-slate-900">{formatBRL(row.qty * part.cost)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </ModalBody>
      <ModalFooter className="sm:justify-between">
        <p className="text-sm text-slate-700">
          Total selecionado: <strong className="text-slate-900">{formatBRL(totalSelected)}</strong>
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="soft" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
          <Button
            icon={SendIcon}
            disabled={!totalSelected}
            onClick={() => {
              groups.forEach((group) => {
                const items = chosen(group);
                if (items.length) onSend(group.supplier, items, { channel: "registrar" });
              });
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Registrar Pedidos Selecionados
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

export default PurchaseOrderModal;
