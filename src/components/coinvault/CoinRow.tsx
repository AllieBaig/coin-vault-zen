import { Coin } from "@/lib/coinvault/data";
import CoinThumb from "./CoinThumb";
import { Pencil, Trash2 } from "lucide-react";

export default function CoinRow({ coin, onEdit, onDelete }: { coin: Coin; onEdit: () => void; onDelete: () => void }) {
  const subtitle = [coin.year || null, coin.country || null].filter(Boolean).join(" · ");
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary/60 transition-colors">
      <CoinThumb title={coin.title} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-foreground truncate">{coin.title}</div>
        <div className="text-[12px] text-muted-foreground truncate">
          {subtitle || "—"}{coin.era ? ` · ${coin.era}` : ""}
        </div>
      </div>
      {coin.denomination && (
        <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-foreground border border-border whitespace-nowrap">
          {coin.denomination}
        </span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive" aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}