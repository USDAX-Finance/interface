import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { formatCompact, formatCompactNum } from "@/lib/utils";
import { useGetNetworkStats } from "@workspace/api-client-react";
import {
  Activity, Layers, TrendingUp, Crosshair, Network, ArrowLeft, Sprout,
  BarChart2, ArrowUpDown, Users,
} from "lucide-react";

const WALLET_ADDRESS = "0x71C7...656F";
const NETWORK_NAME   = "Robinhood Chain";
const LIME           = "hsl(79 100% 57%)";
const EMERALD        = "hsl(152 70% 48%)";
const BORDER         = "hsl(0 0% 10%)";
const MUTED          = "hsl(0 0% 26%)";

const navLinks = [
  { href: "/app",              label: "Pulse",    icon: Activity,    tip: "Protocol overview"  },
  { href: "/app/nexus",        label: "Nexus",    icon: Network,     tip: "USDAX flow & RWA"   },
  { href: "/app/positions",    label: "Vaults",   icon: Layers,      tip: "Debt positions"     },
  { href: "/app/yield",        label: "Harvest",  icon: Sprout,      tip: "Yield pools"        },
  { href: "/app/staking",      label: "Earn",     icon: TrendingUp,  tip: "APX staking"        },
  { href: "/app/liquidations", label: "Hunt",     icon: Crosshair,   tip: "Liquidation hunter" },
];

/* ── Stat pill for the ticker strip ── */
function StatPill({
  icon: Icon, label, value, color = LIME, loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: MUTED }} />
      <span className="font-mono text-[10px]" style={{ color: MUTED }}>{label}</span>
      <span
        className={cn("font-black font-mono text-[10px]", loading && "animate-pulse")}
        style={{ color: loading ? MUTED : color }}
      >
        {loading ? "···" : value}
      </span>
    </div>
  );
}

/* ── Stats ticker (sub-bar above main nav row) ── */
function StatsTicker() {
  const { data, isLoading } = useGetNetworkStats();

  const pills = [
    { icon: BarChart2,   label: "TVL",       value: data ? formatCompact(data.tvlUsd) : "···",                  color: LIME    },
    { icon: ArrowUpDown, label: "Vol 24h",   value: data ? formatCompact(data.volume24hUsd) : "···",             color: LIME    },
    { icon: Activity,    label: "Txs",       value: data ? formatCompactNum(data.totalTransactions) : "···",     color: EMERALD },
    { icon: Users,       label: "Users",     value: data ? formatCompactNum(data.uniqueUsers) : "···",           color: EMERALD },
    { icon: Layers,      label: "USDAX",     value: data ? `${formatCompactNum(data.usdaxSupply)} USDAX` : "···", color: LIME  },
  ];

  return (
    <div
      className="w-full hidden sm:flex items-center justify-between px-6"
      style={{
        height: 28,
        background: "hsl(0 0% 2.5%)",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {/* Left: live stats */}
      <div className="flex items-center gap-4 overflow-x-auto">
        {pills.map((p, i) => (
          <StatPill key={i} {...p} loading={isLoading} />
        ))}
      </div>

      {/* Right: network badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Testnet tag */}
        <span
          className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
          style={{ background: "hsl(35 92% 60% / 0.10)", color: "hsl(35 92% 60%)", border: "1px solid hsl(35 92% 60% / 0.22)" }}
        >
          TESTNET
        </span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>EVM&nbsp;46630</span>
        {data && (
          <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 17%)" }}>
            Updated {new Date(data.lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC" })} UTC
          </span>
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "hsl(0 0% 3% / 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {/* ── Stats ticker ── */}
      <StatsTicker />

      {/* ── Main nav row ── */}
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
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
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
              style={{ background: `linear-gradient(135deg, ${LIME}, ${EMERALD})` }} />
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
