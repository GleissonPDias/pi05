/**
 * Usuário logado (dados fictícios).
 * TODO: substituir pelos dados reais quando a autenticação da API existir.
 */
export const currentUser = {
  name: "Carlos Eduardo",
  role: "Gerente de Oficina",
};

/** Texto gravado como autor das alterações: "Carlos Eduardo (Gerente)". */
export let currentOperator = `${currentUser.name} (${currentUser.role.split(" ")[0]})`;

export function setCurrentOperator(name, role) {
  currentOperator = `${name || "Operador"} (${String(role || "Oficina").split(" ")[0]})`;
}
