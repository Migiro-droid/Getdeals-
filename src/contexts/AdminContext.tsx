import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface SiteSettings {
  blackFridayEnabled: boolean;
  maintenanceMode: boolean;
  supportPhone: string;
  supportEmail: string;
  location: string;
}

interface AdminContextValue {
  settings: SiteSettings;
  updateSettings: (partial: Partial<SiteSettings>) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const defaultSettings: SiteSettings = {
  blackFridayEnabled: true,
  maintenanceMode: false,
  supportPhone: "+254 700 123 456",
  supportEmail: "support@getdeals.co.ke",
  location: "Karen Green, Nairobi, Kenya",
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const LS_SETTINGS = "getdeals_admin_settings_v1";
const LS_IS_ADMIN = "getdeals_admin_flag_v1";

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      return raw ? { ...defaultSettings, ...(JSON.parse(raw) as SiteSettings) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(LS_IS_ADMIN) === "1");

  useEffect(() => {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); } catch {}
  }, [settings]);
  useEffect(() => {
    try { localStorage.setItem(LS_IS_ADMIN, isAdmin ? "1" : "0"); } catch {}
  }, [isAdmin]);

  const updateSettings = (partial: Partial<SiteSettings>) => setSettings((s) => ({ ...s, ...partial }));

  const value = useMemo<AdminContextValue>(() => ({ settings, updateSettings, isAdmin, setIsAdmin }), [settings, isAdmin]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};
