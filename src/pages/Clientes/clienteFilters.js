import { formatDate } from "../../utils/dates";
import { maskCpfCnpj, maskPhone, onlyDigits } from "../../utils/masks";

/** Minúsculas e sem acentos: "João" -> "joao". */
function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Letras e números apenas: "ABC-1234" -> "abc1234". */
function alphanumeric(text) {
  return normalize(text).replace(/[^a-z0-9]/g, "");
}

/** Busca por nome, e-mail, CPF/CNPJ, telefone ou placa do veículo. */
function matchesSearch(client, query) {
  const text = normalize(query.trim());
  if (!text) return true;

  const textHaystack = normalize(
    [client.name, client.email, ...client.vehicles.map((v) => v.model)].join(" "),
  );
  if (textHaystack.includes(text)) return true;

  const digits = onlyDigits(text);
  const digitsHaystack = `${client.document} ${client.phone} ${client.phoneSecondary}`;
  if (digits.length >= 3 && digitsHaystack.includes(digits)) return true;

  const compact = alphanumeric(text);
  return (
    compact.length >= 3 &&
    client.vehicles.some((v) => alphanumeric(v.plate).includes(compact))
  );
}

export function filterClients(clients, { search, filter }) {
  return clients.filter((client) => {
    if (filter === "open" && !(client.status === "ativo" && client.openOrders > 0)) {
      return false;
    }
    if (filter === "inactive" && client.status !== "inativo") return false;
    return matchesSearch(client, search);
  });
}

/** Contadores exibidos nas abas e no subtítulo. */
export function countClients(clients) {
  return {
    all: clients.length,
    active: clients.filter((c) => c.status === "ativo").length,
    open: clients.filter((c) => c.status === "ativo" && c.openOrders > 0).length,
    inactive: clients.filter((c) => c.status === "inativo").length,
  };
}

/** Texto de "n veículos cadastrados" (singular/plural). */
export function vehiclesLabel(count) {
  if (count === 0) return "Nenhum veículo cadastrado";
  return count === 1 ? "1 veículo cadastrado" : `${count} veículos cadastrados`;
}

/** "Honda Civic (ABC-1234), Toyota Yaris (GHJ-5561)" */
export function vehiclesList(vehicles) {
  return vehicles.map((v) => `${v.model} (${v.plate})`).join(", ");
}

/** Iniciais para o avatar: "João Carlos Silva" -> "JS" */
export function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

/** Exporta a lista atual para o formato de linhas do CSV. */
export const CSV_HEADERS = [
  "Código",
  "Nome",
  "CPF/CNPJ",
  "E-mail",
  "Telefone",
  "WhatsApp",
  "Veículos",
  "Última visita",
  "Situação",
];

export function toCsvRows(clients) {
  return clients.map((client) => [
    client.id,
    client.name,
    maskCpfCnpj(client.document),
    client.email,
    maskPhone(client.phone),
    client.hasWhatsapp ? "Sim" : "Não",
    vehiclesList(client.vehicles),
    formatDate(client.lastVisit),
    client.status === "ativo" ? "Ativo" : "Inativo",
  ]);
}
