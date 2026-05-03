import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCoins } from "@/lib/coinvault/store";
import { Coin } from "@/lib/coinvault/data";
import CoinRow from "@/components/coinvault/CoinRow";
import CoinForm from "@/components/coinvault/CoinForm";
import QuickAdd from "@/components/coinvault/QuickAdd";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GROUP_LABELS, SORT_LABELS, GroupKey, SortKey, groupCoins } from "@/lib/coinvault/group";

export const Route = createFileRoute("/")({
  component: Index,
});

const FILTERS = ["All", "Modern", "Old", "Territories", "Commemorative", "Circulation", "Bullion"];

const PREF_KEY = "coinvault.view.v1";
const EXP_KEY = "coinvault.expanded.v1";

function Index() {
  const { coins, update, remove, add } = useCoins();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Coin | null>(null);
  const [open, setOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupKey>("country");
  const [sortBy, setSortBy] = useState<SortKey>("year-desc");
  const [flat, setFlat] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.groupBy) setGroupBy(p.groupBy);
        if (p.sortBy) setSortBy(p.sortBy);
        if (typeof p.flat === "boolean") setFlat(p.flat);
      }
      const exp = localStorage.getItem(EXP_KEY);
      if (exp) setCollapsed(JSON.parse(exp));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ groupBy, sortBy, flat })); } catch {}
  }, [groupBy, sortBy, flat]);
  useEffect(() => {
    try { localStorage.setItem(EXP_KEY, JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  const filtered = useMemo(() => {
    return coins.filter((c) => {
      if (query) {
        const q = query.toLowerCase();
        const blob = `${c.title} ${c.country} ${c.denomination} ${c.year}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (filter === "All") return true;
      if (filter === "Modern") return typeof c.year === "number" && c.year >= 1950;
      if (filter === "Old") return typeof c.year === "number" && c.year < 1950;
      if (filter === "Territories") return c.region === "Territories";
      return c.type === filter;
    });
  }, [coins, filter, query]);

  const groups = useMemo(
    () => groupCoins(filtered, flat ? "none" : groupBy, sortBy),
    [filtered, groupBy, sortBy, flat]
  );

  const reset = () => {
    setGroupBy("country");
    setSortBy("year-desc");
    setFlat(false);
    setFilter("All");
    setQuery("");
    setCollapsed({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight">Coins</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{coins.length} in your collection</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coins…"
            className="h-9 pl-8 rounded-full bg-secondary border-transparent focus-visible:bg-background"
          />
        </div>
      </div>

      <QuickAdd onExpand={() => { setEditing(null); setOpen(true); }} />

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Group</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupKey)}>
            <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(GROUP_LABELS) as GroupKey[]).map((k) => (
                <SelectItem key={k} value={k}>{GROUP_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Sort</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-muted-foreground">Flat</span>
          <Switch checked={flat} onCheckedChange={setFlat} />
          <button onClick={reset} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-[13px] text-muted-foreground py-12 border border-dashed border-border rounded-xl">
          No coins match your filters.
        </div>
      ) : flat || groupBy === "none" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {groups[0]?.coins.map((c) => (
            <CoinRow key={c.id} coin={c} onEdit={() => { setEditing(c); setOpen(true); }} onDelete={() => remove(c.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const isCollapsed = !!collapsed[g.key];
            return (
              <div key={g.key} className="rounded-xl border border-border overflow-hidden bg-background">
                <button
                  onClick={() => setCollapsed((s) => ({ ...s, [g.key]: !s[g.key] }))}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/60 transition-colors"
                >
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
                  <span className="text-[13px] font-medium truncate">{g.key}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{g.coins.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 pt-0">
                    {g.coins.map((c) => (
                      <CoinRow key={c.id} coin={c} onEdit={() => { setEditing(c); setOpen(true); }} onDelete={() => remove(c.id)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CoinForm
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? undefined}
        onSubmit={(data) => {
          if (editing) update(editing.id, data);
          else add(data);
        }}
      />
    </div>
  );
}
