import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Vault, Layers, Crosshair, ArrowLeft } from "lucide-react";

const WALLET_ADDRESS = "0x71C7...656F";
const NETWORK_NAME = "Robinhood Chain";

const navLinks = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/positions", label: "Vaults", icon: Layers },
  { href: "/app/staking", label: "Staking", icon: Vault },
  { href: "/app/liquidations", label: "Liquidations", icon: Crosshair },
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "hsl(232 20% 4% / 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid hsl(263 20% 12%)",
      }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_hsl(263_70%_62%/0.5)]"
              style={{
                background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))",
              }}
            >
              <span className="text-white font-black text-[10px]">AP</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground hidden sm:inline">
              APEX
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                  style={
                    active
                      ? {
                          background: "hsl(263 70% 62% / 0.12)",
                          color: "hsl(263 70% 78%)",
                        }
                      : {}
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Back to landing */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            <ArrowLeft className="h-3 w-3" />
            Landing
          </Link>

          {/* Network badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono"
            style={{
              background: "hsl(142 71% 45% / 0.08)",
              border: "1px solid hsl(142 71% 45% / 0.2)",
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" />
            <span className="text-safe/80">{NETWORK_NAME}</span>
          </div>

          {/* Wallet */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono text-foreground cursor-pointer transition-all hover:border-purple/30"
            style={{
              background: "hsl(263 20% 10%)",
              border: "1px solid hsl(263 20% 16%)",
            }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))",
              }}
            />
            {WALLET_ADDRESS}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto"
        style={{ borderTop: "1px solid hsl(263 20% 10%)" }}
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? { background: "hsl(263 70% 62% / 0.12)", color: "hsl(263 70% 78%)" }
                  : {}
              }
            >
              <Icon className="h-3 w-3" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
