import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { deleteUserHistory, getUserToken, syncUserHistory } from "../services/api";

export interface HistoryItem {
  id: string;
  type: "transliterasi" | "chat" | "macapat" | "angka";
  input: string;
  output: string;
  timestamp: number;
}

interface HistoryContextValue {
  items: HistoryItem[];
  add: (item: Omit<HistoryItem, "id" | "timestamp">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);
const STORAGE_KEY = "boso-jawa-history";
const MAX_ITEMS = 50;

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (!getUserToken()) return;
    const timer = window.setTimeout(() => {
      void syncUserHistory(items).then((response) => {
        if (JSON.stringify(response.data) !== JSON.stringify(items)) setItems(response.data.slice(0, MAX_ITEMS));
      }).catch(() => { /* tetap pakai data lokal saat offline */ });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [items]);

  const add = useCallback((entry: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setItems((prev) => [newItem, ...prev].slice(0, MAX_ITEMS));
  }, []);

  const remove = useCallback(async (id: string) => {
    if (getUserToken()) await deleteUserHistory(id).catch(() => undefined);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(async () => {
    if (getUserToken()) await deleteUserHistory().catch(() => undefined);
    setItems([]);
  }, []);

  return (
    <HistoryContext.Provider value={{ items, add, remove, clear }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}
