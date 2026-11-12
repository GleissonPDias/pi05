import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import {
  api,
  clearMode,
  clearSession,
  getMode,
  getSession,
  isDemo,
  saveSession,
  setDemoMode,
  setSessionUser,
  restoreSession,
  subscribe,
} from "../services/api";
import { resetCatalogs } from "../services/catalogs";
import { resetMechanics } from "../services/mechanics";
import { currentUser } from "../mocks/user";

const DEMO_USER = {
  id: "demo",
  name: currentUser.name,
  role: currentUser.role,
  profile: "ADMIN",
  isAdmin: true,
  active: true,
  executesOrders: true,
  email: "demo@salvo.local",
  workshopId: null,
  workshopName: "Oficina Matriz",
};

function mapUser(dto) {
  const profile = dto.perfil ?? (dto.cargo?.toUpperCase() === "ADMIN" ? "ADMIN" : null);
  return {
    id: String(dto.id),
    name: dto.nome ?? dto.email ?? "Operador",
    role: dto.cargo ?? "Oficina",
    profile,
    isAdmin: profile === "ADMIN",
    active: dto.ativo !== false,
    executesOrders: dto.executaOs !== false,
    email: dto.email ?? "",
    workshopId: dto.oficinaId ?? null,
    workshopName: dto.oficinaNome ?? "Oficina",
    permissions: Array.isArray(dto.permissoes) ? dto.permissoes : [],
    mustChangePassword: dto.deveTrocarSenha === true,
    isDono: dto.dono === true,
  };
}

function sessionUser(fallbackName = "Operador") {
  const stored = getSession()?.user;
  if (stored?.name) return stored;
  return {
    id: "session",
    name: fallbackName,
    role: "Oficina",
    profile: null,
    isAdmin: false,
    active: true,
    executesOrders: false,
    email: "",
    workshopId: null,
    workshopName: "Oficina",
  };
}

/**
 * Sessão do usuário (login real na API ou modo demonstração).
 *
 * O modo demonstração mantém a interface utilizável mesmo sem backend —
 * os dados continuam sendo os fictícios dos mocks.
 */

const ADMIN_SESSION_KEY = "salvo.admin.session.v1";
const ADMIN_USER_KEY = "salvo.admin.user.v1";

function readAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAdminSession(value) {
  try {
    if (value === null) localStorage.removeItem(ADMIN_SESSION_KEY);
    else localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(value));
  } catch (error) {
    void error;
  }
}

function readAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAdminUser(value) {
  try {
    if (value === null) localStorage.removeItem(ADMIN_USER_KEY);
    else localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(value));
  } catch (error) {
    void error;
  }
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [mode, setModeState] = useState(() => getMode());
  const [adminSession, setAdminSession] = useState(() => readAdminSession());
  const [adminUser, setAdminUser] = useState(() => readAdminUser());

  const applyAuthenticated = useCallback((nextUser, nextMode) => {
    setUser(nextUser);
    setModeState(nextMode);
    setStatus("authenticated");
  }, []);

  const applyAnonymous = useCallback(() => {
    setUser(null);
    setModeState(getMode());
    setStatus("anonymous");
  }, []);

  const sync = useCallback(async () => {
    if (isDemo()) {
      applyAuthenticated(DEMO_USER, "demo");
      return;
    }

    const current = getSession();
    if (!current?.accessToken) {
      applyAnonymous();
      return;
    }

    try {
      const dto = await api.me();
      const nextUser = mapUser(dto);
      setSessionUser(nextUser);
      applyAuthenticated(nextUser, "api");
    } catch (error) {
      if (error?.status === 401) {
        clearSession();
        clearMode();
        applyAnonymous();
        return;
      }
      // API fora do ar: mantém a sessão salva para tentar de novo depois.
      applyAuthenticated(sessionUser(), "api");
    }
  }, [applyAuthenticated, applyAnonymous]);

  useEffect(() => {
    // Adia a verificação da sessão para não atualizar estado no corpo do efeito.
    queueMicrotask(sync);
  }, [sync]);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "unauthorized") {
          resetCatalogs();
          resetMechanics();
          applyAnonymous();
        }
        if (event.type === "mode") {
          setModeState(event.mode);
        }
      }),
    [applyAnonymous],
  );

  const login = useCallback(async (email, password) => {
    setStatus("loading");
    let saved = false;

    try {
      const response = await api.login(String(email).trim(), password);
      saveSession(response);
      saved = true;

      let dto = null;
      try {
        dto = await api.me();
      } catch (error) {
        if (error?.status === 401) throw error;
        // Falha de rede logo após o login: segue com os dados básicos.
      }

      const nextUser = dto ? mapUser(dto) : sessionUser(email.split("@")[0]);
      if (dto) setSessionUser(nextUser);
      applyAuthenticated(nextUser, "api");
      return { ok: true };
    } catch (error) {
      if (saved) {
        clearSession();
        clearMode();
      }
      applyAnonymous();
      return { ok: false, error };
    }
  }, [applyAuthenticated, applyAnonymous]);

  const register = useCallback(
    async (payload) => {
      setStatus("loading");
      let saved = false;

      try {
        const response = await api.register(payload);
        if (response?.access_token) {
          saveSession(response);
          saved = true;

          let dto = null;
          try {
            dto = await api.me();
          } catch (error) {
            if (error?.status === 401) throw error;
          }

          const nextUser = dto
            ? mapUser(dto)
            : sessionUser(payload.nomeUsuario || payload.email.split("@")[0]);
          if (dto) setSessionUser(nextUser);
          applyAuthenticated(nextUser, "api");
          return { ok: true, autoLogin: true };
        }
        applyAnonymous();
        return { ok: true, autoLogin: false };
      } catch (error) {
        if (saved) {
          clearSession();
          clearMode();
        }
        applyAnonymous();
        return { ok: false, error };
      }
    },
    [applyAuthenticated, applyAnonymous],
  );

  const loginDemo = useCallback(() => {
    setDemoMode(true);
    resetMechanics();
    resetCatalogs();
    applyAuthenticated(DEMO_USER, "demo");
    return { ok: true };
  }, [applyAuthenticated]);

  const logout = useCallback(() => {
    clearSession();
    clearMode();
    writeAdminSession(null);
    writeAdminUser(null);
    setAdminSession(null);
    setAdminUser(null);
    resetMechanics();
    resetCatalogs();
    applyAnonymous();
  }, [applyAnonymous]);


  const switchUser = useCallback(async (targetUser, password) => {
    if (!targetUser?.id) return { ok: false, error: new Error("Usuário inválido") };
    if (!adminSession) {
      // primeira troca: preserva a sessão do admin
      writeAdminSession(getSession());
      setAdminSession(getSession());
      writeAdminUser(user);
      setAdminUser(user);
    }
    try {
      const response = await api.trocarUsuario(Number(targetUser.id), password);
      saveSession(response);
      const dto = await api.me().catch(() => null);
      const nextUser = dto ? mapUser(dto) : sessionUser(targetUser.name);
      if (dto) setSessionUser(nextUser);
      applyAuthenticated(nextUser, "api");
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }, [adminSession, user, applyAuthenticated]);

  const returnToAdmin = useCallback(async (password) => {
    if (!adminUser?.id) return { ok: false, error: new Error("Sessão do admin não encontrada") };
    try {
      await api.validarSenha(Number(adminUser.id), password);
    } catch (error) {
      return { ok: false, error };
    }
    const stored = readAdminSession() || adminSession;
    if (stored?.accessToken) {
      restoreSession(stored);
    }
    const dto = await api.me().catch(() => null);
    const nextUser = dto ? mapUser(dto) : adminUser;
    if (dto) setSessionUser(nextUser);
    applyAuthenticated(nextUser, "api");
    // limpa a sessão admin preservada
    writeAdminSession(null);
    writeAdminUser(null);
    setAdminSession(null);
    setAdminUser(null);
    return { ok: true };
  }, [adminSession, adminUser, applyAuthenticated]);

  const changePassword = useCallback(async (novaSenha) => {
    try {
      await api.alterarSenha(novaSenha);
      if (user) {
        const next = { ...user, mustChangePassword: false };
        setUser(next);
        setSessionUser(next);
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }, [user]);

  const hasPermission = useCallback((modulo) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(modulo);
  }, [user]);

  const value = useMemo(
    () => ({
      status,
      user,
      mode,
      isDemo: mode === "demo",
      isAdmin: Boolean(user?.isAdmin),
      login,
      register,
      loginDemo,
      logout,
      reload: sync,
      adminUser,
      hasAdminSession: Boolean(adminSession || readAdminSession()),
      switchUser,
      returnToAdmin,
      changePassword,
      hasPermission,
    }),
    [status, user, mode, login, register, loginDemo, logout, sync],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
