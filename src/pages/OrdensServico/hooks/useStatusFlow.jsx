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

  const requestStatus = (order, status) => {
    const check = canMoveTo(order, status);
    if (!check.ok) {
      if (check.reason) onToast(check.reason, "warning");
      return false;
    }
    if (check.action) {
      setPending({ type: check.action, order });
      return true;
    }
    changeStatus(order.number, status);
    onToast(`OS ${formatOrderNumber(order.number)} movida para "${STATUS[status].label}".`);
    return true;
  };

  const close = () => setPending(null);

  const statusModals = pending && (
    <>
      {pending.type === "cancel" && (
        <CancelarOrdemModal
          order={pending.order}
          onClose={close}
          onConfirm={({ reason, note }) => {
            changeStatus(pending.order.number, "cancelada", { cancelReason: reason, cancelNote: note }, `OS cancelada: ${reason}`);
            onToast(`OS ${formatOrderNumber(pending.order.number)} cancelada.`, "warning");
          }}
        />
      )}
      {pending.type === "deliver" && (
        <EntregarOrdemModal
          order={pending.order}
          onClose={close}
          onConfirm={({ payment, mileageOut, rating }) => {
            const { order } = pending;
            changeStatus(
              order.number,
              "entregue",
              { payment, mileageOut, rating },
              `Veículo entregue ao cliente — ${formatBRL(orderTotals({ ...order, payment }).total)} via ${PAYMENT_METHODS[payment.method]}`,
            );
            if (order.vehicle && mileageOut > order.vehicle.mileage) {
              updateMileage(order.vehicle.id, mileageOut);
            }
            // Baixa automática das peças no almoxarifado
            const lowered = consumeForOrder(order);
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
