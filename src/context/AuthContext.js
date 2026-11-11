import { createContext } from "react";

/** Sessão do usuário: { status, user, mode, isAdmin, login, loginDemo, logout }. */
export const AuthContext = createContext(null);

export default AuthContext;
