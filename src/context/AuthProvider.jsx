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
export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [mode, setModeState] = useState(() => getMode());

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
    resetMechanics();
    resetCatalogs();
    applyAnonymous();
  }, [applyAnonymous]);

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
    }),
    [status, user, mode, login, register, loginDemo, logout, sync],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
