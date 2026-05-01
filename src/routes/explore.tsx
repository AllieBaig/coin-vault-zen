import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { COUNTRIES } from "@/lib/coinvault/data";
import { useCoins } from "@/lib/coinvault/store";
import CoinRow from "@/components/coinvault/CoinRow";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/explore")({ component: Explore });

function Explore() {
  const { coins, remove } = useCoins();
  const [country, setCountry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [era, setEra] = useState<string | null>(null);

  const countryNode = COUNTRIES.find((c) => c.name === country);
  const regionNode = countryNode?.regions.find((r) => r.name === region);

  const matches = coins.filter((c) => {
    if (country && c.country !== country) return false;
    if (region && c.region !== region) return false;
    if (era && c.era !== era) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Explore</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Browse by country → region → era</p>
      </div>

      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground flex-wrap">
        <Crumb active={!country} onClick={() => { setCountry(null); setRegion(null); setEra(null); }}>All</Crumb>
        {country && (<><ChevronRight className="h-3 w-3" /><Crumb active={!region} onClick={() => { setRegion(null); setEra(null); }}>{country}</Crumb></>)}
        {region && (<><ChevronRight className="h-3 w-3" /><Crumb active={!era} onClick={() => setEra(null)}>{region}</Crumb></>)}
        {era && (<><ChevronRight className="h-3 w-3" /><Crumb active>{era}</Crumb></>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
          {!country && COUNTRIES.map((c) => (
            <BrowseRow key={c.name} label={c.name} sub={`${c.regions.length} region${c.regions.length > 1 ? "s" : ""}`} onClick={() => setCountry(c.name)} />
          ))}
          {country && !region && countryNode?.regions.map((r) => (
            <BrowseRow key={r.name} label={r.name} sub={`${r.currency} · ${r.eras.length} eras`} onClick={() => setRegion(r.name)} />
          ))}
          {region && !era && regionNode?.eras.map((e) => (
            <BrowseRow key={e} label={e} sub={`${regionNode.denominations.length} denominations`} onClick={() => setEra(e)} />
          ))}
          {era && regionNode?.denominations.map((d) => (
            <div key={d} className="px-3 py-2 rounded-xl border border-border text-[13px] flex items-center justify-between">
              <span>{d}</span>
              <span className="text-[11px] text-muted-foreground">{regionNode.currency}</span>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="text-[12px] text-muted-foreground px-1">{matches.length} matching coin{matches.length === 1 ? "" : "s"}</div>
          {matches.map((c) => (
            <CoinRow key={c.id} coin={c} onEdit={() => {}} onDelete={() => remove(c.id)} />
          ))}
          {matches.length === 0 && (
            <div className="text-center text-[13px] text-muted-foreground py-12 border border-dashed border-border rounded-xl">
              Drill down to see coins.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Crumb({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`px-2 py-0.5 rounded-full ${active ? "text-foreground font-medium" : "hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function BrowseRow({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary/60 transition-colors text-left">
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}