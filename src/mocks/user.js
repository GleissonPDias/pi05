/**
 * Usuário logado (dados fictícios).
 * TODO: substituir pelos dados reais quando a autenticação da API existir.
 */
export const currentUser = {
  name: "Carlos Eduardo",
  role: "Gerente de Oficina",
};

/** Texto gravado como autor das alterações: "Carlos Eduardo (Gerente)". */
export const currentOperator = `${currentUser.name} (${currentUser.role.split(" ")[0]})`;
