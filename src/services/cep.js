import { onlyDigits } from "../utils/masks";

/**
 * Consulta um CEP na API pública ViaCEP.
 * Retorna { street, district, city, state } ou lança um Error com
 * a mensagem pronta para ser exibida ao usuário.
 */
export async function fetchAddressByCep(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    throw new Error("Informe um CEP com 8 dígitos.");
  }

  let data;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) throw new Error("request failed");
    data = await response.json();
  } catch {
    throw new Error("Não foi possível consultar o CEP. Preencha manualmente.");
  }

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}
