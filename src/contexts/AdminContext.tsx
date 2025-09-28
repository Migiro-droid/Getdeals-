import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

interface SiteSettings {
  blackFridayCountdownDate?: string; // ISO date string
  blackFridayEnabled: boolean;
  maintenanceMode: boolean;
  supportPhone: string;
  supportEmail: string;
  location: string;
}

type AdminRole = "guest" | "staff" | "admin";

type AdminPermission =
  | "viewDashboard"
  | "manageOrders"
  | "manageProducts"
  | "manageSettings";

interface AdminUserInfo {
  name?: string;
  email?: string;
}

interface AdminSession {
  role: AdminRole;
  user: AdminUserInfo | null;
  expiresAt: number | null; // epoch ms
}

interface AdminContextValue {
  settings: SiteSettings;
  updateSettings: (partial: Partial<SiteSettings>) => void;

  role: AdminRole;
  user: AdminUserInfo | null;
  session: Pick<AdminSession, "expiresAt">;
  login: (passcode: string, info?: AdminUserInfo) => boolean;
  logout: () => void;
  hasPermission: (perm: AdminPermission) => boolean;
  setAdminUser: (info: AdminUserInfo | null) => void;

  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void; 
}

const defaultSettings: SiteSettings = {
  blackFridayEnabled: true,
  blackFridayCountdownDate: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString(), 
  maintenanceMode: false,
  supportPhone: "+254 700 123 456",
  supportEmail: "info@getdeals.co.ke",
  location: "Karen Green, Nairobi, Kenya",
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const LS_SETTINGS = "getdeals_admin_settings_v1";
const LS_IS_ADMIN = "getdeals_admin_flag_v1"; 
const LS_SESSION = "getdeals_admin_session_v1";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; 

const ROLE_PERMS: Record<AdminRole, AdminPermission[]> = {
  guest: ["viewDashboard"],
  staff: ["viewDashboard", "manageOrders"],
  admin: ["viewDashboard", "manageOrders", "manageProducts", "manageSettings"],
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      return raw ? { ...defaultSettings, ...(JSON.parse(raw) as SiteSettings) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [role, setRole] = useState<AdminRole>(() => {
    try {
      const raw = localStorage.getItem(LS_SESSION);
      if (raw) {
        const s = JSON.parse(raw) as AdminSession;
        if (s.expiresAt && Date.now() < s.expiresAt) return s.role;
      }
    } catch {}
    try {
      return localStorage.getItem(LS_IS_ADMIN) === "1" ? "admin" : "guest";
    } catch {}
    return "guest";
  });
  const [user, setUser] = useState<AdminUserInfo | null>(() => {
    try {
      const raw = localStorage.getItem(LS_SESSION);
      if (raw) {
        const s = JSON.parse(raw) as AdminSession;
        if (s.expiresAt && Date.now() < s.expiresAt) return s.user ?? null;
      }
    } catch {}
    return null;
  });
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(LS_SESSION);
      if (raw) {
        const s = JSON.parse(raw) as AdminSession;
        if (s.expiresAt && Date.now() < s.expiresAt) return s.expiresAt;
      }
    } catch {}
    return null;
  });

  const sessionRef = useRef<{ timer?: number | null }>({ timer: null });

  useEffect(() => {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const persistSession = (s: AdminSession | null) => {
    try {
      if (s) {
        localStorage.setItem(LS_SESSION, JSON.stringify(s));
        localStorage.setItem(LS_IS_ADMIN, s.role === "admin" ? "1" : "0");
      } else {
        localStorage.removeItem(LS_SESSION);
        localStorage.setItem(LS_IS_ADMIN, "0");
      }
    } catch {}
  };

  const setExpiryTimer = (ts: number | null) => {
    if (sessionRef.current.timer) {
      
      window.clearTimeout(sessionRef.current.timer as number);
    }
    sessionRef.current.timer = null;
    if (ts && ts > Date.now()) {
      const delay = Math.max(0, ts - Date.now());
      sessionRef.current.timer = window.setTimeout(() => {
        
        doLogout();
      }, delay);
    }
  };

  useEffect(() => {
    setExpiryTimer(expiresAt);
    
  }, [expiresAt]);

  
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SESSION) {
        try {
          const raw = e.newValue;
          if (!raw) {
            
            setRole("guest");
            setUser(null);
            setExpiresAt(null);
            return;
          }
          const s = JSON.parse(raw) as AdminSession;
          if (!s.expiresAt || Date.now() >= s.expiresAt) {
            setRole("guest");
            setUser(null);
            setExpiresAt(null);
            return;
          }
          setRole(s.role);
          setUser(s.user ?? null);
          setExpiresAt(s.expiresAt);
        } catch {}
      } else if (e.key === LS_SETTINGS && e.newValue) {
        try {
          const ns = JSON.parse(e.newValue) as SiteSettings;
          setSettings((prev) => ({ ...prev, ...ns }));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const doLogin = (passcode: string, info?: AdminUserInfo): AdminSession | null => {
    // Determine role based on passcode
    const adminPin = (import.meta as any)?.env?.VITE_ADMIN_PIN ?? (import.meta as any)?.env?.VITE_ADMIN_PASSCODE ?? "1234";
    const staffPin = (import.meta as any)?.env?.VITE_STAFF_PIN ?? "1111";
    let nextRole: AdminRole = "guest";
    if (passcode === String(adminPin)) nextRole = "admin";
    else if (passcode === String(staffPin)) nextRole = "staff";
    else return null;

    const next: AdminSession = {
      role: nextRole,
      user: info ?? null,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    setRole(next.role);
    setUser(next.user ?? null);
    setExpiresAt(next.expiresAt);
    persistSession(next);
    return next;
  };

  const doLogout = () => {
    setRole("guest");
    setUser(null);
    setExpiresAt(null);
    persistSession(null);
  };

  const login = (passcode: string, info?: AdminUserInfo) => {
    const s = doLogin(passcode, info);
    return !!s;
  };
  const logout = () => doLogout();

  const hasPermission = (perm: AdminPermission) => ROLE_PERMS[role].includes(perm);

  const updateSettings = (partial: Partial<SiteSettings>) => setSettings((s) => ({ ...s, ...partial }));

  // Allow updating user info (e.g., attach authenticated site user to admin session)
  const setAdminUser = (info: AdminUserInfo | null) => {
    setUser(info);
    persistSession({ role, user: info, expiresAt });
  };

  // Back-compat setters
  const isAdmin = role === "admin";
  const setIsAdmin = (v: boolean) => {
    if (v) {
      const s: AdminSession = { role: "admin", user: user ?? null, expiresAt: Date.now() + SESSION_TTL_MS };
      setRole("admin");
      setExpiresAt(s.expiresAt);
      persistSession(s);
    } else {
      doLogout();
    }
  };

  const value = useMemo<AdminContextValue>(
    () => ({
      settings,
      updateSettings,
      role,
      user,
      session: { expiresAt },
      login,
      logout,
      hasPermission,
      setAdminUser,
      // back-compat
      isAdmin,
      setIsAdmin,
    }),
    [settings, role, user, expiresAt]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};
