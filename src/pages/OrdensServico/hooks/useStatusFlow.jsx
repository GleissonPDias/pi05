import { useState } from "react";
import { useEstoque } from "../../../hooks/useEstoque";
import { useOrdens } from "../../../hooks/useOrdens";
import { useVeiculos } from "../../../hooks/useVeiculos";
import { formatBRL } from "../../../utils/format";
import CancelarOrdemModal from "../components/CancelarOrdemModal";
import EntregarOrdemModal from "../components/EntregarOrdemModal";
import { PAYMENT_METHODS, STATUS } from "../constants";
import { canMoveTo, formatOrderNumber, orderTotals } from "../ordemUtils";

/**
 * Mudança de etapa da OS, com as regras e os pop-ups necessários.
 * Usado pelo quadro (arrastar / botão Mover) e pela página de detalhes.
 *
 * const { requestStatus, statusModals } = useStatusFlow(showToast);
 * requestStatus(order, "pronta");   // order com `vehicle` e `client`
 * ...
 * {statusModals}
 */
export function useStatusFlow(onToast) {
  const { changeStatus, addEvent } = useOrdens();
  const { consumeForOrder } = useEstoque();
  const { updateMileage } = useVeiculos();
  const [pending, setPending] = useState(null); // { type: "cancel" | "deliver", order }

  const requestStatus = async (order, status) => {
    const check = canMoveTo(order, status);
    if (!check.ok) {
      if (check.reason) onToast(check.reason, "warning");
      return false;
    }
    if (check.action) {
      setPending({ type: check.action, order });
      return true;
    }
    const ok = await changeStatus(order.number, status);
    if (ok) onToast(`OS ${formatOrderNumber(order.number)} movida para "${STATUS[status].label}".`);
    return ok;
  };

  const close = () => setPending(null);

  const statusModals = pending && (
    <>
      {pending.type === "cancel" && (
        <CancelarOrdemModal
          order={pending.order}
          onClose={close}
          onConfirm={async ({ reason, note }) => {
            const ok = await changeStatus(
              pending.order.number,
              "cancelada",
              { cancelReason: reason, cancelNote: note },
              `OS cancelada: ${reason}`,
            );
            if (ok) {
              onToast(`OS ${formatOrderNumber(pending.order.number)} cancelada.`, "warning");
            }
          }}
        />
      )}
      {pending.type === "deliver" && (
        <EntregarOrdemModal
          order={pending.order}
          onClose={close}
          onConfirm={async ({ payment, mileageOut, rating }) => {
            const { order } = pending;
            const ok = await changeStatus(
              order.number,
              "entregue",
              { payment, mileageOut, rating },
              `Veículo entregue ao cliente — ${formatBRL(orderTotals({ ...order, payment }).total)} via ${PAYMENT_METHODS[payment.method]}`,
            );
            if (!ok) return;
            if (order.vehicle && mileageOut > order.vehicle.mileage) {
              updateMileage(order.vehicle.id, mileageOut);
            }
            // Baixa automática das peças no almoxarifado
            const lowered = await consumeForOrder(order);
            if (lowered) addEvent(order.number, `Baixa de ${lowered} item(ns) no estoque`, "slate");
            onToast(
              `OS ${formatOrderNumber(order.number)} entregue. Garantia iniciada${lowered ? ` e ${lowered} peça(s) baixada(s) do estoque` : ""}.`,
            );
          }}
        />
      )}
    </>
  );

  return { requestStatus, statusModals };
}
