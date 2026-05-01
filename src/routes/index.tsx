import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCoins } from "@/lib/coinvault/store";
import { Coin } from "@/lib/coinvault/data";
import CoinRow from "@/components/coinvault/CoinRow";
import CoinForm from "@/components/coinvault/CoinForm";
import QuickAdd from "@/components/coinvault/QuickAdd";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const FILTERS = ["All", "Modern", "Old", "Territories", "Commemorative", "Circulation", "Bullion"];

function Index() {
  const { coins, update, remove, add } = useCoins();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Coin | null>(null);
  const [open, setOpen] = useState(false);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map((c) => (
          <CoinRow
            key={c.id}
            coin={c}
            onEdit={() => { setEditing(c); setOpen(true); }}
            onDelete={() => remove(c.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-[13px] text-muted-foreground py-12 border border-dashed border-border rounded-xl">
            No coins match your filters.
          </div>
        )}
      </div>

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
