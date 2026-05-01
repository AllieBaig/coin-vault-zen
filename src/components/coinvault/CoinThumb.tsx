export default function CoinThumb({ title, size = 44 }: { title: string; size?: number }) {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="rounded-md border border-border bg-secondary flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials || "··"}
    </div>
  );
}