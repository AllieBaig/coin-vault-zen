import { createFileRoute } from "@tanstack/react-router";
import { useCoins } from "@/lib/coinvault/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRef, useState } from "react";
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
  const [compact, setCompact] = useState(true);
  const [animations, setAnimations] = useState(true);
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
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[12px] text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
