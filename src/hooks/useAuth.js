import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/** Sessão do usuário + login/logout (veja AuthProvider). */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth precisa estar dentro do AuthProvider.");
  }
  return value;
}

export default useAuth;
