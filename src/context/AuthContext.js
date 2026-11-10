import { createContext } from "react";

/** Sessão do usuário: { status, user, mode, login, loginDemo, logout }. */
export const AuthContext = createContext(null);

export default AuthContext;
