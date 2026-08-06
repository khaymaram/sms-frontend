import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, get, post, put } from "../lib/axios";
import type { UserAccount } from "../types";

interface AuthContextValue {
  user: UserAccount | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<UserAccount>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "sms_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) { setLoading(false); return; }
    get<UserAccount>("/auth/me").then(setUser).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const result = await post<{ token: string; user: UserAccount }>("/auth/login", { identifier, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    return result.user;
  }
  function clearSession() { localStorage.removeItem(TOKEN_KEY); setUser(null); }
  async function logout() {
    try { await post("/auth/logout"); }
    finally { clearSession(); }
  }
  async function updateProfile(name: string, email: string) { const updated = await put<UserAccount>("/auth/me", { name, email }); setUser(updated); }
  async function changePassword(currentPassword: string, newPassword: string) { await put("/auth/password", { currentPassword, newPassword }); }
  async function deleteAccount(password: string) { await api.delete("/auth/me", { data: { password } }); clearSession(); }

  return <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, changePassword, deleteAccount }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
