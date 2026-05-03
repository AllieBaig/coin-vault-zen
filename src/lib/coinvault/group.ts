import { Coin } from "./data";

export type GroupKey =
  | "none"
  | "country"
  | "region"
  | "era"
  | "year"
  | "month"
  | "date"
  | "denomination"
  | "folder";

export type SortKey =
  | "year-desc"
  | "year-asc"
  | "denomination"
  | "added"
  | "name"
  | "rarity";

export const GROUP_LABELS: Record<GroupKey, string> = {
  none: "None",
  country: "Country",
  region: "Region / Currency",
  era: "Era",
  year: "Year",
  month: "Month Added",
  date: "Date Added",
  denomination: "Denomination",
  folder: "Folder",
};

export const SORT_LABELS: Record<SortKey, string> = {
  "year-desc": "Year (newest)",
  "year-asc": "Year (oldest)",
  denomination: "Denomination",
  added: "Date Added",
  name: "Name (A–Z)",
  rarity: "Rarity / Custom",
};

const FALLBACK = "Other";

function fmtMonth(ts?: number) {
  if (!ts) return FALLBACK;
  const d = new Date(ts);
  return d.toLocaleString(undefined, { year: "numeric", month: "long" });
}
function fmtDate(ts?: number) {
  if (!ts) return FALLBACK;
  const d = new Date(ts);
  return d.toLocaleDateString();
}

function groupKeyValue(c: Coin, k: GroupKey): string {
  switch (k) {
    case "country": return c.country || FALLBACK;
    case "region": return [c.region, c.currency].filter(Boolean).join(" · ") || FALLBACK;
    case "era": return c.era || FALLBACK;
    case "year": return c.year ? String(c.year) : FALLBACK;
    case "month": return fmtMonth(c.addedAt);
    case "date": return fmtDate(c.addedAt);
    case "denomination": return c.denomination || FALLBACK;
    case "folder": return c.folder || FALLBACK;
    default: return "";
  }
}

export function sortCoins(coins: Coin[], s: SortKey): Coin[] {
  const arr = [...coins];
  switch (s) {
    case "year-asc":
      return arr.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    case "year-desc":
      return arr.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    case "denomination":
      return arr.sort((a, b) => (a.denomination || "").localeCompare(b.denomination || ""));
    case "added":
      return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    case "name":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "rarity":
      return arr.sort((a, b) => (a.type || "").localeCompare(b.type || ""));
  }
}

export type Group = { key: string; coins: Coin[] };

export function groupCoins(coins: Coin[], g: GroupKey, s: SortKey): Group[] {
  if (g === "none") return [{ key: "All", coins: sortCoins(coins, s) }];
  const map = new Map<string, Coin[]>();
  for (const c of coins) {
    const k = groupKeyValue(c, g);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(c);
  }
  const groups = Array.from(map.entries())
    .filter(([, v]) => v.length > 0)
    .map(([key, v]) => ({ key, coins: sortCoins(v, s) }));
  groups.sort((a, b) => {
    if (a.key === FALLBACK) return 1;
    if (b.key === FALLBACK) return -1;
    return a.key.localeCompare(b.key);
  });
  return groups;
}