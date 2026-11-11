import { STATES } from "../Clientes/constants";
import { maskCep, maskCnpj, maskPhone, onlyDigits } from "../../utils/masks";
import { isValidEmail } from "../../utils/validators";

export const UF_OPTIONS = [
  { value: "", label: "Selecione" },
  ...STATES.map(([value, label]) => ({ value, label: `${value} — ${label}` })),
];

export function emptyOficina() {
  return {
    nome: "",
    nomeFantasia: "",
    cnpj: "",
    telefone: "",
    whatsapp: "",
    email: "",
    site: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    horarioFuncionamento: "",
    validadeOrcamentoDias: 7,
    descontoMaximoPercentual: 0,
    corPrimaria: "#2563eb",
  };
}

/** `OficinaDTO` da API -> valores do formulário. */
export function oficinaToForm(dto) {
  return {
    nome: dto.nome ?? "",
    nomeFantasia: dto.nomeFantasia ?? "",
    cnpj: maskCnpj(dto.cnpj ?? ""),
    telefone: maskPhone(dto.telefone ?? ""),
    whatsapp: maskPhone(dto.whatsapp ?? ""),
    email: dto.email ?? "",
    site: dto.site ?? "",
    cep: maskCep(dto.cep ?? ""),
    logradouro: dto.logradouro ?? "",
    numero: dto.numero ?? "",
    complemento: dto.complemento ?? "",
    bairro: dto.bairro ?? "",
    cidade: dto.cidade ?? "",
    uf: dto.uf ?? "",
    horarioFuncionamento: dto.horarioFuncionamento ?? "",
    validadeOrcamentoDias: dto.validadeOrcamentoDias ?? 7,
    descontoMaximoPercentual: Number(dto.descontoMaximoPercentual ?? 0),
    corPrimaria: dto.corPrimaria ?? "",
  };
}

/**
 * Valores do formulário -> `AtualizarOficinaDTO`. Texto vazio é enviado como ""
 * para que a API limpe o campo (null significaria "não alterar").
 */
export function oficinaToPayload(values) {
  const text = (value) => String(value ?? "").trim();
  return {
    nome: text(values.nome),
    nomeFantasia: text(values.nomeFantasia),
    cnpj: onlyDigits(values.cnpj),
    telefone: onlyDigits(values.telefone),
    whatsapp: onlyDigits(values.whatsapp),
    email: text(values.email),
    site: text(values.site),
    cep: onlyDigits(values.cep),
    logradouro: text(values.logradouro),
    numero: text(values.numero),
    complemento: text(values.complemento),
    bairro: text(values.bairro),
    cidade: text(values.cidade),
    uf: text(values.uf),
    horarioFuncionamento: text(values.horarioFuncionamento),
    validadeOrcamentoDias: Number(values.validadeOrcamentoDias),
    descontoMaximoPercentual: Number(values.descontoMaximoPercentual || 0),
    corPrimaria: text(values.corPrimaria),
  };
}

export function validateOficina(values) {
  const errors = {};
  if (!values.nome.trim()) errors.nome = "Informe o nome da oficina.";

  const cnpj = onlyDigits(values.cnpj);
  if (cnpj && cnpj.length !== 14) errors.cnpj = "O CNPJ deve ter 14 dígitos.";

  const phone = onlyDigits(values.telefone);
  if (phone && (phone.length < 10 || phone.length > 11)) errors.telefone = "Informe um telefone com DDD.";

  const whatsapp = onlyDigits(values.whatsapp);
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 11)) errors.whatsapp = "Informe um WhatsApp com DDD.";

  if (values.email.trim() && !isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";

  const cep = onlyDigits(values.cep);
  if (cep && cep.length !== 8) errors.cep = "O CEP deve ter 8 dígitos.";

  const validade = Number(values.validadeOrcamentoDias);
  if (!Number.isInteger(validade) || validade < 1 || validade > 365) {
    errors.validadeOrcamentoDias = "Informe um prazo entre 1 e 365 dias.";
  }

  const desconto = Number(values.descontoMaximoPercentual);
  if (!Number.isFinite(desconto) || desconto < 0 || desconto > 100) {
    errors.descontoMaximoPercentual = "O desconto máximo deve ficar entre 0 e 100%.";
  }

  if (values.corPrimaria.trim() && !/^#[0-9A-Fa-f]{6}$/.test(values.corPrimaria.trim())) {
    errors.corPrimaria = "Use o formato #RRGGBB.";
  }

  return errors;
}

/** Tipos de box sugeridos ao cadastrar. */
export const BOX_TYPE_SUGGESTIONS = [
  "Elevador Hidráulico",
  "Elevador de Chassi (pesados)",
  "Rampa de Diagnóstico",
  "Alinhamento & Balanceamento",
  "Funilaria e pintura",
];
