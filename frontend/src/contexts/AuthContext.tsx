import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  getAccessToken,
  setTokens,
  clearTokens,
  applyAccessToken,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  refreshToken as apiRefreshToken,
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
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUser();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated]);

  async function loadUser() {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      try {
        const refreshToken = localStorage.getItem("boso-jawa-refresh-token");
        if (refreshToken) {
          const response = await apiRefreshToken({ refresh_token: refreshToken });
          setTokens(response.access_token, response.refresh_token);
          applyAccessToken(response.access_token);
          const u = await getCurrentUser();
          setUser(u);
          return;
        }
      } catch {
        // refresh failed, fall through to logout
      }
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
    hasLoadedRef.current = false;
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
    hasLoadedRef.current = false;
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