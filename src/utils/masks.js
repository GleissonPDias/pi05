/** Mantém só os dígitos de um texto. */
export function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

/** Junta partes ignorando as vazias, aplicando o separador antes de cada uma. */
function join(parts) {
  const [first, ...rest] = parts;
  return rest.reduce(
    (text, [separator, chunk]) => (chunk ? `${text}${separator}${chunk}` : text),
    first,
  );
}

/** 32489104822 -> 324.891.048-22 */
export function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return join([
    d.slice(0, 3),
    [".", d.slice(3, 6)],
    [".", d.slice(6, 9)],
    ["-", d.slice(9, 11)],
  ]);
}

/** 12345678000195 -> 12.345.678/0001-95 */
export function maskCnpj(value) {
  const d = onlyDigits(value).slice(0, 14);
  return join([
    d.slice(0, 2),
    [".", d.slice(2, 5)],
    [".", d.slice(5, 8)],
    ["/", d.slice(8, 12)],
    ["-", d.slice(12, 14)],
  ]);
}

/** Aplica máscara de CPF (até 11 dígitos) ou de CNPJ (a partir do 12º). */
export function maskCpfCnpj(value) {
  return onlyDigits(value).length > 11 ? maskCnpj(value) : maskCpf(value);
}

/** 11987654321 -> (11) 98765-4321 | 1132441000 -> (11) 3244-1000 */
export function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (!d) return "";
  if (d.length < 3) return `(${d}`;

  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const split = d.length > 10 ? 5 : 4;
  const head = rest.slice(0, split);
  const tail = rest.slice(split);

  return tail ? `(${ddd}) ${head}-${tail}` : `(${ddd}) ${head}`;
}

/** 04538133 -> 04538-133 */
export function maskCep(value) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Celular brasileiro: DDD + 9 + 8 dígitos (11 dígitos no total). */
export function isMobilePhone(value) {
  const d = onlyDigits(value);
  return d.length === 11 && d[2] === "9";
}

/** Placa de veículo (modelo antigo ABC-1234 ou Mercosul ABC-1D23), em maiúsculas. */
export function maskPlate(value) {
  const clean = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

/** Quilometragem com separador de milhar: "45200" -> "45.200". */
export function maskKm(value) {
  const digits = onlyDigits(value).slice(0, 7);
  return digits ? Number(digits).toLocaleString("pt-BR") : "";
}

/** "45.200" -> 45200 */
export function parseKm(value) {
  return Number(onlyDigits(value) || 0);
}

/** Valor em reais digitado como "caixa registradora": "120550" -> "1.205,50". */
export function maskMoney(value) {
  const digits = onlyDigits(String(value)).slice(0, 10);
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "1.205,50" -> 1205.5 */
export function parseMoney(value) {
  return Number(onlyDigits(String(value)) || 0) / 100;
}

/** 1205.5 -> "1.205,50" (para preencher um campo de valor). */
export function moneyToInput(number) {
  return maskMoney(String(Math.round(Number(number || 0) * 100)));
}
