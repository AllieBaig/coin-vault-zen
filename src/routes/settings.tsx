import { createFileRoute } from "@tanstack/react-router";
import { useCoins } from "@/lib/coinvault/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { coins } = useCoins();
  const [compact, setCompact] = useState(true);
  const [animations, setAnimations] = useState(true);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(coins, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "coinvault-export.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Preferences and data</p>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border bg-background">
        <Row title="Compact rows" desc="Slim list with smaller thumbnails">
          <Switch checked={compact} onCheckedChange={setCompact} />
        </Row>
        <Row title="Subtle animations" desc="Minimal motion on interactions">
          <Switch checked={animations} onCheckedChange={setAnimations} />
        </Row>
        <Row title="Lazy-load images" desc="Defer image rendering offscreen">
          <Switch checked disabled />
        </Row>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div>
          <div className="text-[13px] font-medium">Data</div>
          <div className="text-[12px] text-muted-foreground">Export your collection as JSON.</div>
        </div>
        <Button size="sm" variant="outline" onClick={exportData}>Export {coins.length} coins</Button>
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[12px] text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}