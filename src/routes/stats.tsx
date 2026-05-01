import { createFileRoute } from "@tanstack/react-router";
import { useCoins } from "@/lib/coinvault/store";
import { useMemo } from "react";

export const Route = createFileRoute("/stats")({ component: Stats });

function Stats() {
  const { coins } = useCoins();

  const stats = useMemo(() => {
    const byCountry = new Map<string, number>();
    const byType = new Map<string, number>();
    const byEra = new Map<string, number>();
    let oldest: number | null = null;
    let newest: number | null = null;
    for (const c of coins) {
      if (c.country) byCountry.set(c.country, (byCountry.get(c.country) ?? 0) + 1);
      if (c.type) byType.set(c.type, (byType.get(c.type) ?? 0) + 1);
      if (c.era) byEra.set(c.era, (byEra.get(c.era) ?? 0) + 1);
      if (typeof c.year === "number") {
        oldest = oldest === null ? c.year : Math.min(oldest, c.year);
        newest = newest === null ? c.year : Math.max(newest, c.year);
      }
    }
    return { byCountry, byType, byEra, oldest, newest };
  }, [coins]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Stats</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Overview of your collection</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={coins.length} />
        <Stat label="Countries" value={stats.byCountry.size} />
        <Stat label="Oldest" value={stats.oldest ?? "—"} />
        <Stat label="Newest" value={stats.newest ?? "—"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Breakdown title="By country" items={stats.byCountry} total={coins.length} />
        <Breakdown title="By type" items={stats.byType} total={coins.length} />
        <Breakdown title="By era" items={stats.byEra} total={coins.length} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3 bg-background">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-[22px] font-medium tracking-tight mt-1">{value}</div>
    </div>
  );
}

function Breakdown({ title, items, total }: { title: string; items: Map<string, number>; total: number }) {
  const arr = [...items.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-border p-4 bg-background">
      <div className="text-[13px] font-medium mb-3">{title}</div>
      <div className="space-y-2">
        {arr.length === 0 && <div className="text-[12px] text-muted-foreground">No data</div>}
        {arr.map(([k, v]) => (
          <div key={k}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-foreground">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-foreground/80" style={{ width: `${(v / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}