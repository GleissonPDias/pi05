import { maskKm, onlyDigits, parseKm } from "../../utils/masks";
import { formatKm } from "../../utils/format";
import { fromDateTimeLocal, toDateTimeLocal } from "./ordemUtils";

/** Previsão padrão: próximo dia útil às 17h (valor para datetime-local). */
export function defaultForecast() {
  const date = new Date();
  date.setDate(date.getDate() + (date.getDay() === 5 ? 3 : date.getDay() === 6 ? 2 : 1));
  date.setHours(17, 0, 0, 0);
  return toDateTimeLocal(date.toISOString());
}

/** Valores iniciais do pop-up "Nova OS". */
export function emptyValues(vehicle) {
  return {
    vehicleId: vehicle?.id ?? "",
    type: "",
    channel: "balcao",
    priority: "normal",
    title: "",
    complaint: "",
    mileageIn: vehicle ? maskKm(String(vehicle.mileage)) : "",
    fuelLevel: null,
    mechanicId: "",
    boxId: "",
    expectedAt: defaultForecast(),
    internalNotes: "",
  };
}

/**
 * Valida o pop-up "Nova OS". Retorna { campo: "mensagem" } (vazio = válido).
 * - vehicle: veículo escolhido · activeOrder: OS em andamento do veículo (se houver)
 */
export function validateNovaOrdem(values, { vehicle, activeOrder }) {
  const errors = {};

  if (!vehicle) {
    errors.vehicleId = "Selecione o veículo atendido.";
  } else if (vehicle.draft) {
    errors.vehicleId = "Este veículo é um rascunho. Complete o cadastro antes de abrir a OS.";
  } else if (!vehicle.ownerId) {
    errors.vehicleId = "Vincule um proprietário ao veículo (tela de Veículos) antes de abrir a OS.";
  } else if (activeOrder) {
    errors.vehicleId = `Este veículo já está com a OS #${activeOrder.number} em andamento.`;
  }

  if (!values.type) errors.type = "Selecione o tipo de atendimento.";
  if (values.complaint.trim().length < 10) {
    errors.complaint = "Descreva o relato do cliente (mínimo de 10 caracteres).";
  }

  if (!onlyDigits(values.mileageIn)) {
    errors.mileageIn = "Informe a quilometragem de entrada.";
  } else if (vehicle && parseKm(values.mileageIn) < vehicle.mileage) {
    errors.mileageIn = `Menor que o último registro do veículo (${formatKm(vehicle.mileage)}).`;
  }

  if (values.fuelLevel === null) errors.fuelLevel = "Marque o nível de combustível.";

  if (values.expectedAt && new Date(values.expectedAt) < Date.now()) {
    errors.expectedAt = "A previsão de entrega precisa ser uma data futura.";
  }

  return errors;
}

/** Converte os valores do formulário nos dados da OS. */
export function toOrderData(values, vehicle) {
  return {
    vehicleId: vehicle.id,
    clientId: vehicle.ownerId,
    type: values.type,
    channel: values.channel,
    priority: values.priority,
    title: values.title.trim(),
    complaint: values.complaint.trim(),
    internalNotes: values.internalNotes.trim(),
    mileageIn: parseKm(values.mileageIn),
    fuelLevel: values.fuelLevel,
    mechanicId: values.mechanicId || null,
    boxId: values.boxId || null,
    expectedAt: fromDateTimeLocal(values.expectedAt),
  };
}
