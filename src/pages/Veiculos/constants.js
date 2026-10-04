/** Quantidade de veículos por página na listagem. */
export const PAGE_SIZE = 6;

/** Capacidade de boxes da oficina (usada no cálculo da taxa de ocupação). */
export const BOXES_TOTAL = 8;

export const FUELS = [
  "Flex (Álcool / Gasolina)",
  "Gasolina",
  "Álcool",
  "Diesel S10",
  "Híbrido (Gasolina/Elétrico)",
  "Elétrico",
  "GNV",
].map((fuel) => ({ value: fuel, label: fuel }));

export const TRANSMISSIONS = [
  "Manual",
  "Automático",
  "Automatizado",
  "CVT",
].map((item) => ({ value: item, label: item }));

export const CATEGORIES = [
  "Hatch Compacto",
  "Sedan Compacto",
  "Sedan Médio",
  "SUV Compacto",
  "SUV Médio",
  "Picape Compacta",
  "Picape Média 4×4",
  "Utilitário / Van",
  "Esportivo",
].map((item) => ({ value: item, label: item }));

/** Sugestões para o campo "Marca" (o usuário também pode digitar outra). */
export const BRAND_SUGGESTIONS = [
  "Audi",
  "BMW",
  "BYD",
  "Chevrolet",
  "Citroën",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Kia",
  "Land Rover",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Peugeot",
  "Renault",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
