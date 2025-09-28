import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export type Address = {
  id: string;
  label: string; 
  street_address: string;
  city: string;
  county?: string;
  postal_code?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
  // Legacy support
  details?: string;
  isDefault?: boolean;
};

export type Notifications = {
  orderUpdates: boolean;
  promos: boolean;
  newProducts: boolean;
};

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization?: string;
  organizationNumber?: string;
  memberSince?: string;
  avatarUrl?: string;
};

type AccountCtx = {
  profile: Profile;
  setProfile: (p: Profile) => void;
  notifications: Notifications;
  setNotifications: (n: Notifications) => void;
  addresses: Address[];
  addAddress: (a: Omit<Address, "id">) => void;
  updateAddress: (id: string, patch: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
};

const KEY = "account_settings_v1";

const AccountContext = createContext<AccountCtx | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [profile, setProfileState] = useState<Profile>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    organizationNumber: user?.organizationNumber || '',
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined,
  });
  const [notifications, setNotificationsState] = useState<Notifications>({
    orderUpdates: true,
    promos: true,
    newProducts: false,
  });
  const [addresses, setAddresses] = useState<Address[]>([
    { 
      id: "addr-home", 
      label: "Home", 
      street_address: "123 Moi Avenue", 
      city: "Nairobi", 
      county: "Nairobi",
      formatted_address: "123 Moi Avenue, Nairobi, Kenya",
      is_default: true,
      address_type: 'home' as const,
      // Legacy support
      details: "123 Moi Avenue, Nairobi, Kenya", 
      isDefault: true 
    },
    { 
      id: "addr-office", 
      label: "Office", 
      street_address: "456 Kenyatta Avenue", 
      city: "Nairobi", 
      county: "Nairobi",
      formatted_address: "456 Kenyatta Avenue, Nairobi, Kenya",
      is_default: false,
      address_type: 'work' as const,
      // Legacy support
      details: "456 Kenyatta Avenue, Nairobi, Kenya"
    },
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.profile) setProfileState(parsed.profile);
        if (parsed.notifications) setNotificationsState(parsed.notifications);
        if (Array.isArray(parsed.addresses)) setAddresses(parsed.addresses);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const payload = JSON.stringify({ profile, notifications, addresses });
      localStorage.setItem(KEY, payload);
    } catch {}
  }, [profile, notifications, addresses]);

  // Update profile when user data changes
  useEffect(() => {
    if (user) {
      setProfileState(prev => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || prev.firstName,
        lastName: user.name?.split(' ').slice(1).join(' ') || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        organization: user.organization || prev.organization,
        organizationNumber: user.organizationNumber || prev.organizationNumber,
        memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : prev.memberSince,
      }));
    }
  }, [user]);

  const setProfile = (p: Profile) => setProfileState(p);
  const setNotifications = (n: Notifications) => setNotificationsState(n);
  const addAddress: AccountCtx["addAddress"] = (a) => {
    setAddresses((prev) => {
      const id = `addr_${Date.now()}`;
      const entry: Address = { 
        id, 
        ...a,
        // Ensure new structure fields are set
        is_default: a.isDefault || a.is_default || prev.length === 0,
        // Legacy support
        isDefault: a.isDefault || a.is_default || prev.length === 0,
        details: a.details || a.formatted_address || `${a.street_address || ''}, ${a.city || ''}`
      } as Address;
      
      // If first address or marked default, make it default and unset others
      if (entry.is_default || prev.length === 0) {
        const next = prev.map((x) => ({ ...x, isDefault: false, is_default: false }));
        return [{ ...entry, isDefault: true, is_default: true }, ...next];
      }
      return [entry, ...prev];
    });
  };
  
  const updateAddress: AccountCtx["updateAddress"] = (id, patch) => {
    setAddresses((prev) => prev.map((x) => (x.id === id ? { 
      ...x, 
      ...patch,
      // Keep legacy and new structure in sync
      isDefault: patch.isDefault ?? patch.is_default ?? x.isDefault,
      is_default: patch.is_default ?? patch.isDefault ?? x.is_default,
      details: patch.details || patch.formatted_address || x.details
    } : x)));
  };
  
  const removeAddress: AccountCtx["removeAddress"] = (id) => {
    setAddresses((prev) => {
      const next = prev.filter((x) => x.id !== id);
      // ensure at least one default remains
      if (next.length && !next.some((x) => x.isDefault || x.is_default)) {
        next[0].isDefault = true;
        next[0].is_default = true;
      }
      return [...next];
    });
  };
  
  const setDefaultAddress: AccountCtx["setDefaultAddress"] = (id) => {
    setAddresses((prev) => prev.map((x) => ({ 
      ...x, 
      isDefault: x.id === id,
      is_default: x.id === id 
    })));
  };

  const value = useMemo<AccountCtx>(() => ({
    profile,
    setProfile,
    notifications,
    setNotifications,
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  }), [profile, notifications, addresses]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const useAccount = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
};
