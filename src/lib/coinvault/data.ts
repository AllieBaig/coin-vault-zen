export type Coin = {
  id: string;
  title: string;
  year: number | "";
  country: string;
  region?: string;
  currency?: string;
  era?: string;
  denomination: string;
  type?: string;
  material?: string;
  mint?: string;
  notes?: string;
  image?: string;
};

export type CountryNode = {
  name: string;
  regions: { name: string; currency: string; eras: string[]; denominations: string[] }[];
};

export const COUNTRIES: CountryNode[] = [
  {
    name: "United States",
    regions: [
      {
        name: "Federal",
        currency: "USD",
        eras: ["Colonial", "Early Republic", "Modern"],
        denominations: ["1¢", "5¢", "10¢", "25¢", "50¢", "$1"],
      },
    ],
  },
  {
    name: "United Kingdom",
    regions: [
      {
        name: "Great Britain",
        currency: "GBP",
        eras: ["Pre-decimal", "Decimal", "Modern"],
        denominations: ["1p", "2p", "5p", "10p", "20p", "50p", "£1", "£2"],
      },
      {
        name: "Territories",
        currency: "GBP",
        eras: ["Colonial", "Modern"],
        denominations: ["Penny", "Shilling", "Crown"],
      },
    ],
  },
  {
    name: "Eurozone",
    regions: [
      {
        name: "Common",
        currency: "EUR",
        eras: ["Modern"],
        denominations: ["1c", "2c", "5c", "10c", "20c", "50c", "€1", "€2"],
      },
    ],
  },
  {
    name: "Japan",
    regions: [
      {
        name: "Imperial",
        currency: "JPY",
        eras: ["Meiji", "Taisho", "Showa", "Heisei", "Reiwa"],
        denominations: ["¥1", "¥5", "¥10", "¥50", "¥100", "¥500"],
      },
    ],
  },
  {
    name: "Canada",
    regions: [
      {
        name: "Federal",
        currency: "CAD",
        eras: ["Pre-Confederation", "Modern"],
        denominations: ["1¢", "5¢", "10¢", "25¢", "50¢", "$1", "$2"],
      },
    ],
  },
];

export const SAMPLE_COINS: Coin[] = [
  { id: "1", title: "Lincoln Cent", year: 1969, country: "United States", region: "Federal", currency: "USD", era: "Modern", denomination: "1¢", type: "Circulation" },
  { id: "2", title: "Buffalo Nickel", year: 1936, country: "United States", region: "Federal", currency: "USD", era: "Early Republic", denomination: "5¢", type: "Circulation" },
  { id: "3", title: "One Penny", year: 1967, country: "United Kingdom", region: "Great Britain", currency: "GBP", era: "Pre-decimal", denomination: "1p", type: "Circulation" },
  { id: "4", title: "Two Euro Commemorative", year: 2015, country: "Eurozone", region: "Common", currency: "EUR", era: "Modern", denomination: "€2", type: "Commemorative" },
  { id: "5", title: "100 Yen Showa", year: 1985, country: "Japan", region: "Imperial", currency: "JPY", era: "Showa", denomination: "¥100", type: "Circulation" },
  { id: "6", title: "Maple Leaf Quarter", year: 2002, country: "Canada", region: "Federal", currency: "CAD", era: "Modern", denomination: "25¢", type: "Circulation" },
  { id: "7", title: "Crown Coin", year: 1953, country: "United Kingdom", region: "Territories", currency: "GBP", era: "Colonial", denomination: "Crown", type: "Commemorative" },
  { id: "8", title: "Half Dollar Kennedy", year: 1971, country: "United States", region: "Federal", currency: "USD", era: "Modern", denomination: "50¢", type: "Circulation" },
];