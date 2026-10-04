import { onlyDigits } from "./masks";

function allDigitsEqual(digits) {
  return /^(\d)\1+$/.test(digits);
}

/** Calcula um dígito verificador (módulo 11) a partir dos pesos informados. */
function checkDigit(digits, weights) {
  const sum = weights.reduce((total, weight, i) => total + weight * Number(digits[i]), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(value) {
  const d = onlyDigits(value);
  if (d.length !== 11 || allDigitsEqual(d)) return false;

  const first = checkDigit(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(d[9]) && second === Number(d[10]);
}

export function isValidCnpj(value) {
  const d = onlyDigits(value);
  if (d.length !== 14 || allDigitsEqual(d)) return false;

  const first = checkDigit(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(d[12]) && second === Number(d[13]);
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos). */
export function isValidCpfCnpj(value) {
  const length = onlyDigits(value).length;
  if (length === 11) return isValidCpf(value);
  if (length === 14) return isValidCnpj(value);
  return false;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

/** Telefone brasileiro com DDD: 10 (fixo) ou 11 (celular) dígitos. */
export function isValidPhone(value) {
  const length = onlyDigits(value).length;
  return length === 10 || length === 11;
}

/** Placa no modelo antigo (ABC-1234) ou Mercosul (ABC-1D23). */
export function isValidPlate(value) {
  return /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/i.test(String(value).trim());
}

/** Chassi (VIN): 17 caracteres, letras e números, sem I, O e Q. */
export function isValidChassis(value) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(value);
}
