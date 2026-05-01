import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Coins, Compass, BarChart3, Settings as SettingsIcon } from "lucide-react";

const tabs = [
  { to: "/", label: "Coins", icon: Coins, exact: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout() {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-[11px] font-medium tracking-tight">CV</div>
            <span className="text-[15px] font-medium tracking-tight">CoinVault</span>
          </Link>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}