import { Coin } from "./data";

export type DetectResult =
  | { format: "new"; coins: Coin[] }
  | { format: "old"; raw: unknown }
  | { format: "unknown"; raw: unknown };

function isNewCoin(o: any): o is Coin {
  return (
    o &&
    typeof o === "object" &&
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    "denomination" in o &&
    "country" in o
  );
}

export function detectFormat(raw: unknown): DetectResult {
  if (Array.isArray(raw) && raw.length > 0 && raw.every(isNewCoin)) {
    return { format: "new", coins: raw as Coin[] };
  }
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as any).coins) &&
    (raw as any).coins.length > 0 &&
    (raw as any).coins.every(isNewCoin)
  ) {
    return { format: "new", coins: (raw as any).coins as Coin[] };
  }
  const list = pickList(raw);
  if (list && list.length > 0) return { format: "old", raw };
  return { format: "unknown", raw };
}

function pickList(raw: any): any[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;
  for (const key of ["coins", "items", "collection", "data", "entries", "list"]) {
    if (Array.isArray(raw[key])) return raw[key];
  }
  if (Array.isArray(raw.folders)) {
    const acc: any[] = [];
    for (const f of raw.folders) {
      const folderName = f?.name ?? f?.title;
      const inner = pickList(f) ?? [];
      for (const c of inner) acc.push({ ...c, __folder: folderName });
    }
    if (acc.length) return acc;
  }
  return null;
}

function pickStr(o: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function pickYear(o: any): number | "" {
  const cands = [o?.year, o?.date, o?.minted, o?.mintYear, o?.mint_year];
  for (const c of cands) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
    if (typeof c === "string") {
      const m = c.match(/-?\d{3,4}/);
      if (m) return parseInt(m[0], 10);
    }
  }
  return "";
}

function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function convertOne(o: any): Coin {
  const title = pickStr(o, "title", "name", "label", "coinName", "coin_name") ?? "Untitled";
  const denomination =
    pickStr(o, "denomination", "denom", "value", "faceValue", "face_value") ?? "";
  const country = pickStr(o, "country", "nation", "issuer", "origin") ?? "";
  const region = pickStr(o, "region", "subregion", "state", "province");
  const currency = pickStr(o, "currency", "curr");
  const era = pickStr(o, "era", "period", "epoch", "dynasty");
  const type = pickStr(o, "type", "category", "kind");
  const material = pickStr(o, "material", "metal", "composition");
  const mint = pickStr(o, "mint", "mintMark", "mint_mark", "mintLocation");
  const image = pickStr(o, "image", "img", "photo", "picture", "imageUrl", "image_url");

  const extras: string[] = [];
  const existingNotes = pickStr(o, "notes", "note", "comment", "comments", "description");
  if (existingNotes) extras.push(existingNotes);
  const folder = pickStr(o, "__folder", "folder", "folderName", "collection", "album");
  if (folder) extras.push(`Folder: ${folder}`);
  const spending = o?.spending ?? o?.spent ?? o?.price ?? o?.cost;
  if (spending != null && typeof spending !== "object") extras.push(`Spending: ${spending}`);
  const grade = pickStr(o, "grade", "condition");
  if (grade) extras.push(`Grade: ${grade}`);

  const id = (typeof o?.id === "string" && o.id) || genId();

  return {
    id,
    title,
    year: pickYear(o),
    country,
    region,
    currency,
    era,
    denomination,
    type,
    material,
    mint,
    notes: extras.length ? extras.join(" • ") : undefined,
    image,
  };
}

export function convertOldToNew(raw: unknown): Coin[] {
  const list = pickList(raw);
  if (!list) throw new Error("No coin entries found in file.");
  const seen = new Set<string>();
  const out: Coin[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const coin = convertOne(item);
    let id = coin.id;
    while (seen.has(id)) id = genId();
    seen.add(id);
    out.push({ ...coin, id });
  }
  if (out.length === 0) throw new Error("No convertible coin entries found.");
  return out;
}

export const BACKUP_KEY = "coinvault.backup.v1";

export function saveBackup(coins: Coin[]) {
  try {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ at: new Date().toISOString(), coins }),
    );
  } catch {}
}

export function readBackup(): { at: string; coins: Coin[] } | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
