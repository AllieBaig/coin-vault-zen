import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { CoinProvider } from "@/lib/coinvault/store";
import Layout from "@/components/coinvault/Layout";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { title: "CoinVault — Unified coin database" },
      { name: "description", content: "Track, classify and explore your coin collection in a clean unified database." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "CoinVault — Unified coin database" },
      { property: "og:description", content: "Track, classify and explore your coin collection in a clean unified database." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "CoinVault — Unified coin database" },
      { name: "twitter:description", content: "Track, classify and explore your coin collection in a clean unified database." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/aa0bc739-4b93-4b4e-96ee-2203de0b7336/id-preview-24b50b78--f9cbbc35-86f8-4363-ae91-9092e406643e.lovable.app-1777661983965.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/aa0bc739-4b93-4b4e-96ee-2203de0b7336/id-preview-24b50b78--f9cbbc35-86f8-4363-ae91-9092e406643e.lovable.app-1777661983965.png" },
      { name: "theme-color", content: "#FFFFFF" },
      { name: "background-color", content: "#FFFFFF" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "CoinVault" },
      { name: "format-detection", content: "telephone=no" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Restore GitHub Pages 404.html SPA redirect path
    try {
      const saved = sessionStorage.getItem("spa-redirect");
      if (saved) {
        sessionStorage.removeItem("spa-redirect");
        if (saved && saved !== window.location.pathname + window.location.search + window.location.hash) {
          window.history.replaceState(null, "", saved);
        }
      }
    } catch {}

    if (!("serviceWorker" in navigator)) return;

    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1";
    const isDev = !!(import.meta as any).env?.DEV;

    if (isInIframe || isPreviewHost || isDev) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  return (
    <CoinProvider>
      <Layout />
      <Toaster />
    </CoinProvider>
  );
}
