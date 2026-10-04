import { maskKm, maskPlate, onlyDigits, parseKm } from "../../utils/masks";
import { isValidChassis, isValidPlate } from "../../utils/validators";

export const MIN_YEAR = 1980;

/** Valores iniciais do formulário de novo veículo. */
export function emptyValues() {
  return {
    ownerId: "",
    plate: "",
    brand: "",
    model: "",
    yearManufacture: "",
    yearModel: "",
    color: "",
    mileage: "",
    fuel: "",
    engine: "",
    transmission: "",
    category: "",
    chassis: "",
  };
}

/** Converte um veículo salvo nos valores (com máscara) exibidos no formulário. */
export function toFormValues(vehicle) {
  return {
    ownerId: vehicle.ownerId ?? "",
    plate: maskPlate(vehicle.plate),
    brand: vehicle.brand,
    model: vehicle.model,
    yearManufacture: vehicle.yearManufacture ? String(vehicle.yearManufacture) : "",
    yearModel: vehicle.yearModel ? String(vehicle.yearModel) : "",
    color: vehicle.color,
    mileage: vehicle.mileage ? maskKm(String(vehicle.mileage)) : "",
    fuel: vehicle.fuel,
    engine: vehicle.engine ?? "",
    transmission: vehicle.transmission ?? "",
    category: vehicle.category ?? "",
    chassis: vehicle.chassis ?? "",
  };
}

/**
 * Converte os valores do formulário no formato de veículo (sem máscara).
 * `draft` marca o cadastro como rascunho; `photoUrl` é a foto escolhida.
 */
export function toVehicleData(values, { draft, photoUrl }) {
  return {
    ownerId: values.ownerId || null,
    plate: maskPlate(values.plate),
    brand: values.brand.trim(),
    model: values.model.trim(),
    yearManufacture: values.yearManufacture ? Number(values.yearManufacture) : null,
    yearModel: values.yearModel ? Number(values.yearModel) : null,
    color: values.color.trim(),
    mileage: parseKm(values.mileage),
    fuel: values.fuel,
    engine: values.engine.trim(),
    transmission: values.transmission,
    category: values.category,
    chassis: values.chassis.trim(),
    photoUrl: photoUrl ?? null,
    draft,
  };
}

function normalizePlate(plate) {
  return String(plate).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validateYear(value, label, maxYear) {
  if (!value) return `Informe o ${label}.`;
  const year = Number(value);
  if (year < MIN_YEAR || year > maxYear) {
    return `Use um ano entre ${MIN_YEAR} e ${maxYear}.`;
  }
  return "";
}

/**
 * Valida o formulário. Retorna { campo: "mensagem" } (vazio = válido).
 * As chaves seguem a ordem visual do formulário (a primeira recebe o foco).
 *
 * - draft: rascunho só exige uma placa válida e que não esteja repetida
 * - vehicles / currentId: para impedir placas duplicadas
 */
export function validateVeiculo(values, { draft, vehicles, currentId }) {
  const errors = {};
  const maxYear = new Date().getFullYear() + 1;

  if (!draft && !values.ownerId) {
    errors.ownerId = "Selecione o proprietário do veículo.";
  }

  if (!values.plate) {
    errors.plate = "Informe a placa.";
  } else if (!isValidPlate(values.plate)) {
    errors.plate = "Placa inválida. Ex.: ABC-1D23 (Mercosul) ou ABC-1234.";
  } else if (
    vehicles.some(
      (vehicle) =>
        vehicle.id !== currentId &&
        normalizePlate(vehicle.plate) === normalizePlate(values.plate),
    )
  ) {
    errors.plate = "Já existe um veículo cadastrado com esta placa.";
  }

  if (values.chassis && !isValidChassis(values.chassis)) {
    errors.chassis = "O chassi deve ter 17 caracteres (sem I, O ou Q).";
  }

  if (draft) return errors;

  if (!values.brand.trim()) errors.brand = "Informe a marca.";
  if (!values.model.trim()) errors.model = "Informe o modelo e a versão.";

  const manufactureError = validateYear(values.yearManufacture, "ano de fabricação", maxYear);
  if (manufactureError) errors.yearManufacture = manufactureError;

  const modelError = validateYear(values.yearModel, "ano do modelo", maxYear);
  if (modelError) {
    errors.yearModel = modelError;
  } else if (!manufactureError && Number(values.yearModel) < Number(values.yearManufacture)) {
    errors.yearModel = "Não pode ser anterior ao ano de fabricação.";
  }

  if (!values.color.trim()) errors.color = "Informe a cor.";
  if (!onlyDigits(values.mileage)) errors.mileage = "Informe a quilometragem atual.";
  if (!values.fuel) errors.fuel = "Selecione o combustível.";

  // Reordena para seguir a ordem visual (o objeto já foi preenchido fora de ordem)
  const order = [
    "ownerId",
    "plate",
    "brand",
    "model",
    "yearManufacture",
    "yearModel",
    "color",
    "mileage",
    "fuel",
    "chassis",
  ];
  return Object.fromEntries(order.filter((key) => errors[key]).map((key) => [key, errors[key]]));
}
