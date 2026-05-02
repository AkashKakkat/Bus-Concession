import { createContext, useContext, useMemo, useState } from "react";

const sessionConfig = {
  student: {
    tokenKey: "token",
    roleKey: "studentRole",
    defaultRole: "student",
  },
  conductor: {
    tokenKey: "conductorToken",
    roleKey: "conductorRole",
    defaultRole: "conductor",
  },
  admin: {
    tokenKey: "adminToken",
    roleKey: "adminRole",
    defaultRole: "admin",
  },
};

const getStoredValue = (key) => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) || "";
};

const readInitialState = () => ({
  studentToken: getStoredValue(sessionConfig.student.tokenKey),
  studentRole: getStoredValue(sessionConfig.student.roleKey),
  conductorToken: getStoredValue(sessionConfig.conductor.tokenKey),
  conductorRole: getStoredValue(sessionConfig.conductor.roleKey),
  adminToken: getStoredValue(sessionConfig.admin.tokenKey),
  adminRole: getStoredValue(sessionConfig.admin.roleKey),
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessionState, setSessionState] = useState(readInitialState);

  const setSession = (sessionType, token, role) => {
    const config = sessionConfig[sessionType];

    if (!config) {
      return;
    }

    window.localStorage.setItem(config.tokenKey, token);
    window.localStorage.setItem(config.roleKey, role || config.defaultRole);

    setSessionState((current) => ({
      ...current,
      [`${sessionType}Token`]: token,
      [`${sessionType}Role`]: role || config.defaultRole,
    }));
  };

  const clearSession = (sessionType) => {
    const config = sessionConfig[sessionType];

    if (!config) {
      return;
    }

    window.localStorage.removeItem(config.tokenKey);
    window.localStorage.removeItem(config.roleKey);

    setSessionState((current) => ({
      ...current,
      [`${sessionType}Token`]: "",
      [`${sessionType}Role`]: "",
    }));
  };

  const value = useMemo(
    () => ({
      ...sessionState,
      setSession,
      clearSession,
    }),
    [sessionState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
