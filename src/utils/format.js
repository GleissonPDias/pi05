/**
 * Formata um número como moeda brasileira.
 * formatBRL(4850)     -> "R$ 4.850,00"
 * formatBRL(38450, 0) -> "R$ 38.450"
 */
export function formatBRL(value, fractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Formata milhares de forma abreviada: 2500 -> "2,5k" */
export function formatK(value) {
  return `${(value / 1000).toLocaleString("pt-BR")}k`;
}

/** 45200 -> "45.200 km" */
export function formatKm(value) {
  return `${Number(value).toLocaleString("pt-BR")} km`;
}
