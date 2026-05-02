import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { Coin, SAMPLE_COINS } from "./data";

type Ctx = {
  coins: Coin[];
  add: (c: Omit<Coin, "id">) => void;
  update: (id: string, c: Partial<Coin>) => void;
  remove: (id: string) => void;
  replaceAll: (coins: Coin[]) => void;
};

const CoinCtx = createContext<Ctx | null>(null);
const KEY = "coinvault.coins.v1";

export function CoinProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<Coin[]>(SAMPLE_COINS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCoins(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(coins)); } catch {}
  }, [coins]);

  const value = useMemo<Ctx>(() => ({
    coins,
    add: (c) => setCoins((p) => [{ ...c, id: crypto.randomUUID() }, ...p]),
    update: (id, c) => setCoins((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
    remove: (id) => setCoins((p) => p.filter((x) => x.id !== id)),
    replaceAll: (next) => setCoins(next),
  }), [coins]);

  return <CoinCtx.Provider value={value}>{children}</CoinCtx.Provider>;
}

export function useCoins() {
  const ctx = useContext(CoinCtx);
  if (!ctx) throw new Error("useCoins must be used within CoinProvider");
  return ctx;
}