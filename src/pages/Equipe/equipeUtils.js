import { getMechanics } from "../../services/mechanics";
import { isValidEmail, isValidPhone } from "../../utils/validators";

export const CARGO_SUGGESTIONS = [
  "Mecânico",
  "Eletricista",
  "Atendente",
  "Consultor Técnico",
  "Gerente",
  "Auxiliar",
];

const PROFILE_LABELS = {
  ADMIN: "Administrador",
  FUNCIONARIO: "Funcionário",
};

export function profileLabel(profile) {
  return PROFILE_LABELS[profile] ?? "Funcionário";
}

export function initials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function mapUsuario(dto) {
  return {
    id: String(dto.id),
    name: dto.nome ?? "",
    email: dto.email ?? "",
    role: dto.cargo ?? "",
    profile: dto.perfil ?? "FUNCIONARIO",
    permissions: Array.isArray(dto.permissoes) ? dto.permissoes : [],
    phone: dto.telefone ?? "",
    specialties: dto.especialidades ?? "",
    lead: Boolean(dto.lider),
    commission: Number(dto.comissaoPercentual ?? 0),
    color: dto.corAgenda ?? "",
    photo: dto.fotoUrl ?? "",
    active: dto.ativo !== false,
    executesOrders: dto.executaOs !== false,
    mustChangePassword: Boolean(dto.deveTrocarSenha),
  };
}

export function emptyMember() {
  return {
    name: "",
    email: "",
    role: "",
    phone: "",
    specialties: "",
    lead: false,
    commission: 0,
    color: "#2563eb",
    executesOrders: true,
    password: "",
    profile: "FUNCIONARIO",
    permissions: [],
  };
}

export function memberToValues(member) {
  if (!member) return emptyMember();
  return {
    name: member.name,
    email: member.email,
    role: member.role,
    phone: member.phone,
    specialties: member.specialties,
    lead: member.lead,
    commission: member.commission,
    color: member.color || "#2563eb",
    executesOrders: member.executesOrders,
    password: "",
    profile: member.profile ?? "FUNCIONARIO",
    permissions: Array.isArray(member.permissions) ? member.permissions : [],
  };
}

export function createUsuarioPayload(values) {
  const isAdmin = values.profile === "ADMIN";
  const payload = {
    nome: values.name.trim(),
    email: values.email.trim(),
    cargo: values.role.trim(),
    telefone: values.phone.trim() || null,
    especialidades: values.specialties.trim() || null,
    lider: Boolean(values.lead),
    comissaoPercentual: Number(values.commission || 0),
    corAgenda: values.color.trim() || null,
    executaOs: Boolean(values.executesOrders),
    perfil: isAdmin ? "ADMIN" : "FUNCIONARIO",
    permissoes: isAdmin ? [] : (Array.isArray(values.permissions) ? values.permissions : []),
  };
  if (values.password.trim()) payload.senhaInicial = values.password.trim();
  return payload;
}

export function updateUsuarioPayload(values) {
  const isAdmin = values.profile === "ADMIN";
  return {
    nome: values.name.trim(),
    cargo: values.role.trim(),
    telefone: values.phone.trim() || null,
    especialidades: values.specialties.trim() || null,
    lider: Boolean(values.lead),
    comissaoPercentual: Number(values.commission || 0),
    corAgenda: values.color.trim() || null,
    executaOs: Boolean(values.executesOrders),
    perfil: isAdmin ? "ADMIN" : "FUNCIONARIO",
    permissoes: isAdmin ? [] : (Array.isArray(values.permissions) ? values.permissions : []),
  };
}

export function validateMember(values, { isEdit = false } = {}) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Informe o nome do funcionário.";
  if (!values.role.trim()) errors.role = "Informe o cargo.";

  if (!isEdit) {
    if (!values.email.trim()) errors.email = "Informe o e-mail de acesso.";
    else if (!isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";
  }

  if (values.phone.trim() && !isValidPhone(values.phone)) {
    errors.phone = "Informe um telefone com DDD.";
  }

  const commission = Number(values.commission);
  if (values.commission !== "" && (!Number.isFinite(commission) || commission < 0 || commission > 100)) {
    errors.commission = "A comissão deve ficar entre 0 e 100%.";
  }

  if (values.color.trim() && !/^#[0-9A-Fa-f]{6}$/.test(values.color.trim())) {
    errors.color = "Use o formato #RRGGBB.";
  }

  if (!isEdit && values.password.trim() && values.password.trim().length < 8) {
    errors.password = "A senha inicial deve ter pelo menos 8 caracteres.";
  }

  return errors;
}

export function filterMembers(members, { search = "", status = "todos", role = "todos" }) {
  const term = normalize(search);

  return members.filter((member) => {
    if (status === "ativos" && !member.active) return false;
    if (status === "inativos" && member.active) return false;

    if (role === "mecanicos" && !member.executesOrders) return false;
    if (role === "sem-os" && member.executesOrders) return false;
    if (role === "admins" && member.profile !== "ADMIN") return false;

    if (!term) return true;
    return [member.name, member.email, member.role, member.specialties]
      .some((value) => normalize(value).includes(term));
  });
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function generateDemoPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
  ).join("");
}

/** Equipe simulada do modo demonstração. */
export function buildDemoMembers(currentUser) {
  const admin = {
    id: "demo-admin",
    name: currentUser?.name ?? "Administrador",
    email: currentUser?.email || "admin@demo.local",
    role: "Administrador",
    profile: "ADMIN",
    phone: "",
    specialties: "",
    lead: true,
    commission: 0,
    color: "#2563eb",
    photo: "",
    active: true,
    executesOrders: true,
    mustChangePassword: false,
  };

  const mechanics = getMechanics().map((item, index) => ({
    id: `demo-mec-${index + 1}`,
    name: item.name,
    email: `${String(item.name).split(" ")[0].toLowerCase()}@demo.local`,
    role: item.role,
    profile: "FUNCIONARIO",
    phone: "",
    specialties: item.specialty ?? "",
    lead: Boolean(item.lead),
    commission: 0,
    color: index === 0 ? "#2563eb" : index === 1 ? "#0f766e" : "#b45309",
    photo: "",
    active: true,
    executesOrders: true,
    mustChangePassword: false,
  }));

  return [admin, ...mechanics];
}
