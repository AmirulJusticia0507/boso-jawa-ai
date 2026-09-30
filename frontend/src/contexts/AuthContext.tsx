import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getAccessToken,
  setTokens,
  clearTokens,
  applyAccessToken,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  UserItem,
} from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserItem | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAccessToken() !== null);
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  async function loadUser() {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setIsAuthenticated(false);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const response = await apiLogin({ username, password });
    setTokens(response.access_token, response.refresh_token);
    applyAccessToken(response.access_token);
    setIsAuthenticated(true);
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}