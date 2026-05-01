import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import { useCoins } from "@/lib/coinvault/store";

export default function QuickAdd({ onExpand }: { onExpand: () => void }) {
  const { add } = useCoins();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    add({ title: title.trim(), year: year ? Number(year) : "", country: "", denomination: "", type });
    setTitle(""); setYear(""); setType("");
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add: title"
        className="border-0 shadow-none focus-visible:ring-0 h-8 px-2 flex-1"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <div className="h-5 w-px bg-border" />
      <Input
        value={year}
        onChange={(e) => setYear(e.target.value)}
        placeholder="Year"
        className="border-0 shadow-none focus-visible:ring-0 h-8 px-2 w-20"
      />
      <div className="h-5 w-px bg-border" />
      <Input
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Type"
        className="border-0 shadow-none focus-visible:ring-0 h-8 px-2 w-28"
      />
      <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={onExpand} title="Expand">
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button size="sm" className="h-8 px-3" onClick={submit}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add
      </Button>
    </div>
  );
}