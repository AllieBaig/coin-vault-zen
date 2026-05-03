import { createFileRoute } from "@tanstack/react-router";
import { useCoins } from "@/lib/coinvault/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrefs } from "@/lib/coinvault/prefs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  detectFormat,
  convertOldToNew,
  saveBackup,
  readBackup,
} from "@/lib/coinvault/convert";
import { Coin } from "@/lib/coinvault/data";

export const Route = createFileRoute("/settings")({ component: Settings });

type Pending =
  | { kind: "new"; coins: Coin[]; fileName: string }
  | { kind: "old"; coins: Coin[]; fileName: string; originalCount: number };

function Settings() {
  const { coins, replaceAll } = useCoins();
  const { prefs, set, reset } = usePrefs();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [status, setStatus] = useState<{ type: "info" | "error" | "success"; msg: string } | null>(
    null,
  );

  const exportData = () => {
    const blob = new Blob([JSON.stringify(coins, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coinvault-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickFile = () => fileRef.current?.click();

  const handleFile = async (file: File) => {
    setStatus(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON.");
      }
      const det = detectFormat(parsed);
      if (det.format === "unknown") {
        throw new Error("Unrecognised file format. No coin entries found.");
      }
      if (det.format === "new") {
        setPending({ kind: "new", coins: det.coins, fileName: file.name });
        setStatus({ type: "info", msg: `New format detected · ${det.coins.length} coins` });
      } else {
        const converted = convertOldToNew(det.raw);
        const original = Array.isArray((det.raw as any)?.coins)
          ? (det.raw as any).coins.length
          : Array.isArray(det.raw)
            ? (det.raw as any[]).length
            : converted.length;
        setPending({
          kind: "old",
          coins: converted,
          fileName: file.name,
          originalCount: original,
        });
        setStatus({
          type: "info",
          msg: `Old data detected · converted ${converted.length}/${original} entries`,
        });
      }
    } catch (e: any) {
      setStatus({ type: "error", msg: e?.message ?? "Failed to read file." });
      toast.error(e?.message ?? "Failed to read file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmReplace = () => {
    if (!pending) return;
    try {
      saveBackup(coins);
      replaceAll(pending.coins);
      const msg =
        pending.kind === "old"
          ? `Conversion successful · ${pending.coins.length} coins imported`
          : `Imported ${pending.coins.length} coins`;
      setStatus({ type: "success", msg });
      toast.success(msg);
      setPending(null);
    } catch (e: any) {
      const msg = e?.message ?? "Conversion failed.";
      setStatus({ type: "error", msg });
      toast.error(msg);
    }
  };

  const restoreBackup = () => {
    const b = readBackup();
    if (!b) {
      toast.error("No backup found.");
      return;
    }
    replaceAll(b.coins);
    toast.success(`Restored backup (${b.coins.length} coins)`);
    setStatus({ type: "success", msg: `Restored backup from ${new Date(b.at).toLocaleString()}` });
  };

  const backup = readBackup();

  const clearCaches = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      toast.success("Caches cleared");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to clear caches");
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Preferences and data</p>
      </div>

      <Group title="UI & Navigation" desc="Menu visibility and placement">
        <Row title="Show bottom menu" desc="Toggle navigation menu visibility">
          <Switch checked={prefs.showMenu} onCheckedChange={(v) => set("showMenu", v)} />
        </Row>
        <Row title="Menu position" desc="Top or bottom navigation">
          <SegSelect
            value={prefs.menuPosition}
            onChange={(v) => set("menuPosition", v as any)}
            options={[{ v: "top", l: "Top" }, { v: "bottom", l: "Bottom" }]}
          />
        </Row>
        <Row title="Back button position" desc="Where back actions appear">
          <SegSelect
            value={prefs.backButtonPosition}
            onChange={(v) => set("backButtonPosition", v as any)}
            options={[{ v: "top", l: "Top" }, { v: "bottom", l: "Bottom" }]}
          />
        </Row>
      </Group>

      <Group title="Appearance" desc="Theme, mode and motion">
        <Row title="UI mode" desc="Mini for minimal, Pro for full controls">
          <SegSelect
            value={prefs.uiMode}
            onChange={(v) => set("uiMode", v as any)}
            options={[{ v: "mini", l: "Mini" }, { v: "pro", l: "Pro" }]}
          />
        </Row>
        <Row title="Theme" desc="Paper, Dark or System">
          <MiniSelect
            value={prefs.theme}
            onChange={(v) => set("theme", v as any)}
            options={[
              { v: "paper", l: "Paper" },
              { v: "dark", l: "Dark" },
              { v: "system", l: "System" },
            ]}
          />
        </Row>
        <Row title="Animation style" desc="Slide direction for transitions">
          <MiniSelect
            value={prefs.animationStyle}
            onChange={(v) => set("animationStyle", v as any)}
            options={[
              { v: "up", l: "Up" },
              { v: "down", l: "Down" },
              { v: "left", l: "Left" },
              { v: "right", l: "Right" },
            ]}
          />
        </Row>
        <Row title="Keep screen on" desc="Prevent display from sleeping">
          <Switch checked={prefs.keepScreenOn} onCheckedChange={(v) => set("keepScreenOn", v)} />
        </Row>
        <Row title="Density" desc="Compact or comfortable spacing">
          <SegSelect
            value={prefs.density}
            onChange={(v) => set("density", v as any)}
            options={[{ v: "compact", l: "Compact" }, { v: "comfortable", l: "Comfort" }]}
          />
        </Row>
      </Group>

      <Group title="Performance" desc="Tuned for iPhone 8 and older devices">
        <Row title="Battery saver" desc="Lower frame rate, fewer effects">
          <Switch checked={prefs.batterySaver} onCheckedChange={(v) => set("batterySaver", v)} />
        </Row>
        <Row title="Reduce effects" desc="Disable blur and animations">
          <Switch checked={prefs.reduceEffects} onCheckedChange={(v) => set("reduceEffects", v)} />
        </Row>
        <Row title="Lazy load UI" desc="Defer offscreen rendering">
          <Switch checked={prefs.lazyLoadUI} onCheckedChange={(v) => set("lazyLoadUI", v)} />
        </Row>
        <Row title="FPS target" desc="Frame rate cap (if supported)">
          <SegSelect
            value={String(prefs.fpsTarget)}
            onChange={(v) => set("fpsTarget", Number(v) as 60 | 120)}
            options={[{ v: "60", l: "60" }, { v: "120", l: "120" }]}
          />
        </Row>
      </Group>

      <Group title="Advanced" desc="Service worker and cache controls">
        <Row title="Service Worker safe mode" desc="Disable offline caching">
          <Switch checked={prefs.swSafeMode} onCheckedChange={(v) => set("swSafeMode", v)} />
        </Row>
        <Row title="Cache repair / reset" desc="Clear all caches and unregister SW">
          <Button size="sm" variant="outline" onClick={clearCaches}>Clear</Button>
        </Row>
        <Row title="Reset preferences" desc="Restore defaults (data is kept)">
          <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
        </Row>
      </Group>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div>
          <div className="text-[13px] font-medium">Data</div>
          <div className="text-[12px] text-muted-foreground">Export your collection as JSON.</div>
        </div>
        <Button size="sm" variant="outline" onClick={exportData}>
          Export {coins.length} coins
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div>
          <div className="text-[13px] font-medium">Data Conversion</div>
          <div className="text-[12px] text-muted-foreground">
            Import a JSON file. Old format is auto-detected and converted to the new format.
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onPickFile}>
            Import JSON
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={restoreBackup}
            disabled={!backup}
            title={backup ? `Backup from ${new Date(backup.at).toLocaleString()}` : "No backup yet"}
          >
            Restore backup
          </Button>
        </div>

        {status && (
          <div
            className={
              "text-[12px] rounded-md border px-3 py-2 " +
              (status.type === "error"
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : status.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground")
            }
          >
            {status.msg}
          </div>
        )}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "old" ? "Replace with converted data?" : "Replace with imported data?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "old"
                ? `Old format detected in “${pending.fileName}”. ${pending.coins.length} of ${pending.originalCount} entries converted. A backup of your current ${coins.length} coins will be saved before replacing.`
                : pending
                  ? `Replace your current ${coins.length} coins with ${pending.coins.length} coins from “${pending.fileName}”. A backup will be saved first.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>Replace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[12px] text-muted-foreground">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Group({
  title,
  desc,
  children,
  defaultOpen = false,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-border bg-background overflow-hidden"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div>
          <div className="text-[13px] font-medium">{title}</div>
          <div className="text-[12px] text-muted-foreground">{desc}</div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border divide-y divide-border">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SegSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-[12px]">
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`px-2.5 py-1 rounded-[5px] transition-colors ${
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function MiniSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[120px] text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v} className="text-[12px]">
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
