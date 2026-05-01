import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ImageIcon } from "lucide-react";
import { Coin, COUNTRIES } from "@/lib/coinvault/data";
import CoinThumb from "./CoinThumb";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Coin;
  onSubmit: (c: Omit<Coin, "id">) => void;
};

export default function CoinForm({ open, onOpenChange, initial, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState<string>("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [era, setEra] = useState("");
  const [denomination, setDenomination] = useState("");
  const [type, setType] = useState("");
  const [material, setMaterial] = useState("");
  const [mint, setMint] = useState("");
  const [openSections, setOpenSections] = useState({ basic: true, classification: true, image: false });

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setYear(initial?.year ? String(initial.year) : "");
      setCountry(initial?.country ?? "");
      setRegion(initial?.region ?? "");
      setEra(initial?.era ?? "");
      setDenomination(initial?.denomination ?? "");
      setType(initial?.type ?? "");
      setMaterial(initial?.material ?? "");
      setMint(initial?.mint ?? "");
    }
  }, [open, initial]);

  const countryNode = useMemo(() => COUNTRIES.find((c) => c.name === country), [country]);
  const regionNode = useMemo(() => countryNode?.regions.find((r) => r.name === region), [countryNode, region]);
  const denominations = regionNode?.denominations ?? [];
  const eras = regionNode?.eras ?? [];
  const currency = regionNode?.currency ?? "";

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      year: year ? Number(year) : "",
      country, region, currency, era, denomination, type, material, mint,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 rounded-2xl border-border">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base font-medium">{initial ? "Edit coin" : "Add coin"}</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Section title="Basic" open={openSections.basic} onToggle={(v) => setOpenSections((s) => ({ ...s, basic: v }))}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title" className="col-span-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lincoln Cent" />
              </Field>
              <Field label="Year">
                <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="1969" inputMode="numeric" />
              </Field>
              <Field label="Type">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {["Circulation", "Commemorative", "Bullion", "Proof", "Token"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Classification" open={openSections.classification} onToggle={(v) => setOpenSections((s) => ({ ...s, classification: v }))}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <Select value={country} onValueChange={(v) => { setCountry(v); setRegion(""); setEra(""); setDenomination(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Region${currency ? ` · ${currency}` : ""}`}>
                <Select value={region} onValueChange={(v) => { setRegion(v); setEra(""); setDenomination(""); }} disabled={!countryNode}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {countryNode?.regions.map((r) => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Era">
                <Select value={era} onValueChange={setEra} disabled={!regionNode}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {eras.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Denomination">
                <Select value={denomination} onValueChange={setDenomination} disabled={!regionNode}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {denominations.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Material">
                <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Copper, Silver…" />
              </Field>
              <Field label="Mint">
                <Input value={mint} onChange={(e) => setMint(e.target.value)} placeholder="Mint mark" />
              </Field>
            </div>
          </Section>

          <Section title="Image" open={openSections.image} onToggle={(v) => setOpenSections((s) => ({ ...s, image: v }))}>
            <div className="flex items-center gap-3">
              <CoinThumb title={title || "?"} size={56} />
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Image upload coming soon — placeholder shown.
              </div>
            </div>
          </Section>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}>{initial ? "Save" : "Add coin"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={onToggle} className="rounded-xl border border-border">
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium">
        <span>{title}</span>
        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3.5 pb-3.5 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-normal">{label}</Label>
      {children}
    </div>
  );
}