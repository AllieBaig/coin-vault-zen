import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Prefs = {
  // UI & Navigation
  showMenu: boolean;
  menuPosition: "top" | "bottom";
  backButtonPosition: "top" | "bottom";
  // Appearance
  uiMode: "mini" | "pro";
  theme: "paper" | "dark" | "system";
  animationStyle: "up" | "down" | "left" | "right";
  keepScreenOn: boolean;
  density: "compact" | "comfortable";
  // Performance
  batterySaver: boolean;
  reduceEffects: boolean;
  lazyLoadUI: boolean;
  fpsTarget: 60 | 120;
  // Advanced
  swSafeMode: boolean;
};

const DEFAULTS: Prefs = {
  showMenu: true,
  menuPosition: "top",
  backButtonPosition: "top",
  uiMode: "mini",
  theme: "paper",
  animationStyle: "up",
  keepScreenOn: false,
  density: "compact",
  batterySaver: false,
  reduceEffects: false,
  lazyLoadUI: true,
  fpsTarget: 60,
  swSafeMode: false,
};

const KEY = "coinvault.prefs.v1";

type Ctx = {
  prefs: Prefs;
  set: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  reset: () => void;
};

const PrefsContext = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  // Apply theme + density + reduce-effects to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark =
        prefs.theme === "dark" ||
        (prefs.theme === "system" && !!mql?.matches);
      root.classList.toggle("dark", isDark);
    };
    applyTheme();
    if (prefs.theme === "system" && mql) {
      mql.addEventListener?.("change", applyTheme);
      return () => mql.removeEventListener?.("change", applyTheme);
    }
  }, [prefs.theme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.density = prefs.density;
    root.dataset.uiMode = prefs.uiMode;
    root.dataset.animation = prefs.animationStyle;
    root.classList.toggle("reduce-effects", prefs.reduceEffects || prefs.batterySaver);
  }, [prefs.density, prefs.uiMode, prefs.animationStyle, prefs.reduceEffects, prefs.batterySaver]);

  // Keep screen on via WakeLock (best-effort)
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    let lock: any = null;
    let cancelled = false;
    const request = async () => {
      try {
        if (prefs.keepScreenOn && (navigator as any).wakeLock?.request) {
          lock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {}
    };
    const onVis = () => {
      if (document.visibilityState === "visible" && prefs.keepScreenOn && !cancelled) request();
    };
    request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      try { lock?.release?.(); } catch {}
    };
  }, [prefs.keepScreenOn]);

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      set: (k, v) => setPrefs((p) => ({ ...p, [k]: v })),
      reset: () => setPrefs(DEFAULTS),
    }),
    [prefs],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}