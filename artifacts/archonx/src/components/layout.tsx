import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Activity, Layers, TrendingUp, Crosshair, Network, ArrowLeft,
} from "lucide-react";

const WALLET_ADDRESS = "0x71C7...656F";
const NETWORK_NAME   = "Robinhood Chain";
const LIME           = "hsl(79 100% 57%)";
const BORDER         = "hsl(0 0% 10%)";

const navLinks = [
  { href: "/app",              label: "Pulse",    icon: Activity,    tip: "Protocol overview"  },
  { href: "/app/nexus",        label: "Nexus",    icon: Network,     tip: "USDAX flow & RWA"   },
  { href: "/app/positions",    label: "Vaults",   icon: Layers,      tip: "Debt positions"     },
  { href: "/app/staking",      label: "Earn",     icon: TrendingUp,  tip: "APX staking"        },
  { href: "/app/liquidations", label: "Hunt",     icon: Crosshair,   tip: "Liquidation hunter" },
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "hsl(0 0% 3% / 0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div className="max-w-screen-xl mx-auto flex h-14 items-center justify-between px-6">

        {/* Logo + nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <img
              src="/favicon.png"
              alt="USDEX"
              className="w-7 h-7 rounded object-cover"
              style={{ border: `1px solid ${LIME}22` }}
            />
            <span className="font-bold text-sm tracking-tight hidden sm:block" style={{ color: "hsl(0 0% 80%)" }}>
              USDEX <span style={{ color: "hsl(0 0% 32%)" }}>Finance</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-4" style={{ background: BORDER }} />

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all tracking-wide",
                    active
                      ? ""
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                  style={active ? { background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}20` } : {}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            <ArrowLeft className="h-3 w-3" />
            Home
          </Link>

          {/* Network badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono"
            style={{
              background: "hsl(152 70% 48% / 0.08)",
              border: "1px solid hsl(152 70% 48% / 0.22)",
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "hsl(152 70% 48%)" }} />
            <span style={{ color: "hsl(152 70% 52%)" }}>{NETWORK_NAME}</span>
          </div>

          {/* Wallet */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono cursor-pointer transition-all"
            style={{ background: "hsl(0 0% 7%)", border: `1px solid ${BORDER}`, color: "hsl(0 0% 65%)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${LIME}30`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
          >
            <div className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${LIME}, hsl(152 70% 48%))` }} />
            {WALLET_ADDRESS}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                active ? "" : "text-muted-foreground hover:text-foreground"
              )}
              style={active ? { background: `${LIME}12`, color: LIME } : {}}
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
