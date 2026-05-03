import type { Coin } from "./data";

// ---------- Universal Coin Schema ----------

export type EraSystem = "Modern" | "Old" | "Pre-Euro" | "Pre-Decimal" | "Decimal";
export type CurrencyName =
  | "Euro"
  | "Franc"
  | "Mark"
  | "Pound"
  | "Punt"
  | "Dollar"
  | "Yen"
  | string;
export type SystemType = "Modern" | "Old" | "Transitional";

export type SystemClassification = {
  era: EraSystem;
  currency: CurrencyName;
  type: SystemType;
};

export type Denomination = {
  value: number | null;
  unit: string;
  display: string; // ALWAYS REQUIRED — never empty
};

export type Territory = {
  isTerritory: boolean;
  parentCountry: "United Kingdom" | null;
};

export const UK_REGIONS = ["Mainland", "Jersey", "Guernsey", "Isle of Man"] as const;

export const CURRENCY_UNITS: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
  JPY: "¥",
  CAD: "$",
  Pound: "£",
  Euro: "€",
  Franc: "F",
  Mark: "DM",
  Punt: "£",
  Dollar: "$",
  Yen: "¥",
};

const KNOWN_UNITS = new Set([
  "p", "£", "€", "c", "¢", "pf", "F", "DM", "$", "¥",
]);

/** Parse arbitrary denomination strings/numbers into a structured Denomination. */
export function parseDenomination(input: unknown, currencyHint?: string): Denomination {
  if (input == null || input === "") return fallbackDenom(currencyHint);

  // numeric → assume currency major unit
  if (typeof input === "number" && Number.isFinite(input)) {
    const unit = CURRENCY_UNITS[currencyHint || ""] || "";
    return formatDenomination({ value: input, unit, display: "" });
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return fallbackDenom(currencyHint);

    // try unit-prefix (£2, €5, $1, ¥100)
    const prefix = s.match(/^([£€$¥])\s*([\d.,]+)$/);
    if (prefix) {
      return { value: toNum(prefix[2]), unit: prefix[1], display: `${prefix[1]}${prefix[2]}` };
    }
    // try unit-suffix (5p, 10c, 50¢, 2pf, 100F, 5DM)
    const suffix = s.match(/^([\d.,]+)\s*(p|c|¢|pf|F|DM)$/);
    if (suffix) {
      return { value: toNum(suffix[1]), unit: suffix[2], display: `${suffix[1]}${suffix[2]}` };
    }
    // bare number with hint
    const bare = s.match(/^([\d.,]+)$/);
    if (bare) {
      const unit = CURRENCY_UNITS[currencyHint || ""] || "";
      return formatDenomination({ value: toNum(bare[1]), unit, display: "" });
    }
    // unknown shape — keep as display string
    return { value: null, unit: "", display: s };
  }

  if (typeof input === "object") {
    const o = input as any;
    const value = typeof o.value === "number" ? o.value : toNum(o.value);
    const unit = typeof o.unit === "string" ? o.unit : "";
    const display = typeof o.display === "string" && o.display ? o.display : "";
    return formatDenomination({ value: Number.isFinite(value) ? value : null, unit, display });
  }

  return fallbackDenom(currencyHint);
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

function fallbackDenom(currencyHint?: string): Denomination {
  return { value: null, unit: CURRENCY_UNITS[currencyHint || ""] || "", display: "Unknown" };
}

/** Build display from value+unit, prefix vs suffix based on convention. */
export function formatDenomination(d: Denomination): Denomination {
  if (d.display && d.display.trim()) return { ...d, display: d.display.trim() };
  const v = d.value;
  const u = d.unit || "";
  if (v == null || !Number.isFinite(v)) {
    return { value: null, unit: u, display: u || "Unknown" };
  }
  const isPrefix = ["£", "€", "$", "¥"].includes(u);
  const display = isPrefix ? `${u}${v}` : `${v}${u}`;
  return { value: v, unit: u, display: display || "Unknown" };
}

/** Reconstruct denomination from any legacy-shaped input. */
export function reconstructDenomination(src: any, currencyHint?: string): Denomination {
  if (!src) return fallbackDenom(currencyHint);
  if (src.denomination && typeof src.denomination === "object") {
    return parseDenomination(src.denomination, currencyHint);
  }
  if (src.denomValue != null || src.denomUnit) {
    return formatDenomination({
      value: toNum(src.denomValue) || null,
      unit: String(src.denomUnit || CURRENCY_UNITS[currencyHint || ""] || ""),
      display: "",
    });
  }
  if (typeof src.denomination === "string" || typeof src.denomination === "number") {
    return parseDenomination(src.denomination, currencyHint);
  }
  for (const k of ["denom", "value", "faceValue", "face_value"]) {
    if (src[k] != null) return parseDenomination(src[k], currencyHint);
  }
  return fallbackDenom(currencyHint);
}

/** UI helper — guaranteed non-empty display. */
export function getDenominationDisplay(c: Pick<Coin, "denomination" | "denom" | "currency">): string {
  if (c.denom?.display) return c.denom.display;
  if (typeof c.denomination === "string" && c.denomination.trim()) return c.denomination.trim();
  const rebuilt = reconstructDenomination(c, c.currency);
  return rebuilt.display || "Unknown";
}

// ---------- System / Territory ----------

export function classifySystem(c: Partial<Coin>): SystemClassification {
  const country = c.country || "";
  const era = (c.era || "").toLowerCase();
  const currency = c.currency || "";

  let eraSys: EraSystem = "Modern";
  if (country === "United Kingdom") {
    eraSys = era.includes("pre-decimal") ? "Pre-Decimal" : "Decimal";
  } else if (["FR", "DE", "IE", "IT", "ES", "France", "Germany", "Ireland", "Italy", "Spain"].includes(country)) {
    eraSys = era.includes("euro") || currency === "EUR" ? "Modern" : "Pre-Euro";
  } else if (era.includes("old") || era.includes("colonial") || era.includes("imperial")) {
    eraSys = "Old";
  }

  const curName: CurrencyName =
    currency === "EUR" ? "Euro" :
    currency === "GBP" ? "Pound" :
    currency === "USD" ? "Dollar" :
    currency === "JPY" ? "Yen" :
    currency === "CAD" ? "Dollar" :
    currency === "FRF" ? "Franc" :
    currency === "DEM" ? "Mark" :
    currency === "IEP" ? "Punt" :
    currency || "";

  const type: SystemType =
    eraSys === "Modern" ? "Modern" :
    eraSys === "Old" || eraSys === "Pre-Decimal" || eraSys === "Pre-Euro" ? "Old" :
    "Transitional";

  return { era: eraSys, currency: curName, type };
}

export function classifyTerritory(c: Partial<Coin>): Territory {
  const country = c.country || "";
  const region = c.region || "";
  if (country === "United Kingdom") {
    const isTerritory = !!region && region !== "Mainland" && region !== "Great Britain";
    return { isTerritory, parentCountry: "United Kingdom" };
  }
  return { isTerritory: false, parentCountry: null };
}

// ---------- Validation ----------

const REQUIRED_FIELDS: (keyof Coin)[] = ["title", "country"];

export function validateCoin(c: Coin): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];
  for (const k of REQUIRED_FIELDS) {
    const v = c[k];
    if (v == null || v === "") missing.push(String(k));
  }
  const display = getDenominationDisplay(c);
  if (!display || display === "Unknown") missing.push("denomination.display");
  return { isValid: missing.length === 0, missingFields: missing };
}

// ---------- Normalization ----------

/** Idempotent — safe to run on every load / add / update / import. */
export function normalizeCoin(input: any): Coin {
  const src = input || {};
  const country: string = src.country || "";
  const region: string | undefined = src.region || undefined;
  const currency: string | undefined = src.currency || undefined;

  const denom = reconstructDenomination(src, currency);
  // legacy string field stays in sync with display
  const denomination = denom.display;

  const system = classifySystem({ country, region, currency, era: src.era });
  const territory = classifyTerritory({ country, region });

  const tags: string[] = Array.isArray(src.tags)
    ? src.tags.filter((t: any) => typeof t === "string")
    : [];

  const coin: Coin = {
    id: typeof src.id === "string" && src.id ? src.id : safeId(),
    title: (src.title || "Untitled").toString(),
    year: typeof src.year === "number" ? src.year : (src.year ? Number(src.year) || "" : ""),
    country,
    region,
    currency,
    era: src.era,
    denomination,
    denom,
    type: src.type,
    material: src.material,
    mint: src.mint,
    notes: src.notes,
    image: src.image,
    imageId: src.imageId,
    folder: src.folder,
    addedAt: typeof src.addedAt === "number" ? src.addedAt : Date.now(),
    system,
    territory,
    rarity: src.rarity,
    design: src.design,
    tags,
    amountPaid: typeof src.amountPaid === "number" ? src.amountPaid : undefined,
    lastOpened: typeof src.lastOpened === "number" ? src.lastOpened : undefined,
  };

  const v = validateCoin(coin);
  coin.isValid = v.isValid;
  coin.missingFields = v.missingFields;
  return coin;
}

function safeId(): string {
  try { return crypto.randomUUID(); } catch {
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function normalizeAll(list: any[]): Coin[] {
  return (list || []).map(normalizeCoin);
}