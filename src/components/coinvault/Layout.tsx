import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Coins, Compass, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { usePrefs } from "@/lib/coinvault/prefs";

const tabs = [
  { to: "/", label: "Coins", icon: Coins, exact: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout() {
  const loc = useLocation();
  const { prefs } = usePrefs();
  const showMenu = prefs.showMenu;
  const isBottom = prefs.menuPosition === "bottom";

  const Nav = (
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
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center text-[11px] font-medium tracking-tight">CV</div>
            <span className="text-[15px] font-medium tracking-tight">CoinVault</span>
          </Link>
          {showMenu && !isBottom ? Nav : null}
        </div>
      </header>
      <main
        className="mx-auto max-w-6xl px-4 py-6"
        style={showMenu && isBottom ? { paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)" } : undefined}
      >
        <Outlet />
      </main>
      {showMenu && isBottom ? (
        <div
          className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center">
            {Nav}
          </div>
        </div>
      ) : null}
    </div>
  );
}