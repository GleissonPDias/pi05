import { maskCep, maskCpfCnpj, maskPhone, onlyDigits } from "../../utils/masks";
import {
  isValidCpfCnpj,
  isValidEmail,
  isValidPhone,
} from "../../utils/validators";

/** Valores iniciais do formulário de novo cliente. */
export function emptyValues() {
  return {
    name: "",
    document: "",
    email: "",
    phone: "",
    phoneSecondary: "",
    hasWhatsapp: false,
    acceptsComms: false,
    classification: "novo",
    status: "ativo",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  };
}

/** Converte um cliente salvo nos valores (com máscara) exibidos no formulário. */
export function toFormValues(client) {
  return {
    name: client.name,
    document: maskCpfCnpj(client.document),
    email: client.email,
    phone: maskPhone(client.phone),
    phoneSecondary: maskPhone(client.phoneSecondary),
    hasWhatsapp: client.hasWhatsapp,
    acceptsComms: client.acceptsComms,
    classification: client.classification,
    status: client.status,
    cep: maskCep(client.address.cep),
    street: client.address.street,
    number: client.address.number,
    complement: client.address.complement,
    district: client.address.district,
    city: client.address.city,
    state: client.address.state,
  };
}

/** Converte os valores do formulário no formato de cliente (dados sem máscara). */
export function toClientData(values) {
  return {
    name: values.name.trim(),
    document: onlyDigits(values.document),
    email: values.email.trim(),
    phone: onlyDigits(values.phone),
    phoneSecondary: onlyDigits(values.phoneSecondary),
    hasWhatsapp: values.hasWhatsapp,
    acceptsComms: values.acceptsComms,
    classification: values.classification,
    status: values.status,
    address: {
      cep: onlyDigits(values.cep),
      street: values.street.trim(),
      number: values.number.trim(),
      complement: values.complement.trim(),
      district: values.district.trim(),
      city: values.city.trim(),
      state: values.state,
    },
  };
}

/**
 * Valida o formulário. Retorna um objeto { campo: "mensagem" } (vazio = válido).
 * As chaves seguem a ordem visual do formulário (a primeira recebe o foco).
 */
export function validateCliente(values, { mode, clients, currentId }) {
  const errors = {};

  if (values.name.trim().length < 3) {
    errors.name = "Informe o nome completo ou a razão social.";
  }

  if (mode === "create") {
    const digits = onlyDigits(values.document);
    if (!digits) {
      errors.document = "Informe o CPF ou CNPJ.";
    } else if (!isValidCpfCnpj(values.document)) {
      errors.document =
        digits.length <= 11 ? "CPF inválido." : "CNPJ inválido.";
    } else if (
      clients.some((c) => c.id !== currentId && c.document === digits)
    ) {
      errors.document = "Já existe um cliente com este documento.";
    }
  }

  if (!values.email.trim()) {
    errors.email = "Informe o e-mail.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "E-mail inválido.";
  }

  if (!values.phone) {
    errors.phone = "Informe o telefone.";
  } else if (!isValidPhone(values.phone)) {
    errors.phone = "Telefone incompleto. Use DDD + número.";
  }

  if (values.phoneSecondary && !isValidPhone(values.phoneSecondary)) {
    errors.phoneSecondary = "Telefone incompleto. Use DDD + número.";
  }

  if (!values.cep) {
    errors.cep = "Informe o CEP.";
  } else if (onlyDigits(values.cep).length !== 8) {
    errors.cep = "CEP incompleto.";
  }

  if (!values.street.trim()) errors.street = "Informe o logradouro.";
  if (!values.number.trim()) errors.number = "Informe o número.";
  if (!values.district.trim()) errors.district = "Informe o bairro.";
  if (!values.city.trim()) errors.city = "Informe a cidade.";
  if (!values.state) errors.state = "Selecione o estado.";

  return errors;
}
