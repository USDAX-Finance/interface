import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { formatCompact, formatCompactNum } from "@/lib/utils";
import { useGetNetworkStats } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/privy-auth";
import {
  Activity, Layers, TrendingUp, Crosshair, Network, ArrowLeft, Sprout,
  BarChart2, ArrowUpDown, Users, Menu, X, Wallet, LogOut,
} from "lucide-react";
import { formatAddress } from "@/lib/utils";

const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const BORDER  = "hsl(0 0% 10%)";
const MUTED   = "hsl(0 0% 26%)";
const CARD_BG = "hsl(0 0% 6%)";
const NETWORK_NAME = "Robinhood Chain";

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
    { icon: BarChart2,   label: "TVL",     value: data ? formatCompact(data.tvlUsd) : "···",                   color: LIME    },
    { icon: ArrowUpDown, label: "Vol 24h", value: data ? formatCompact(data.volume24hUsd) : "···",              color: LIME    },
    { icon: Activity,    label: "Txs",     value: data ? formatCompactNum(data.totalTransactions) : "···",      color: EMERALD },
    { icon: Users,       label: "Users",   value: data ? formatCompactNum(data.uniqueUsers) : "···",            color: EMERALD },
    { icon: Layers,      label: "USDAX",   value: data ? `${formatCompactNum(data.usdaxSupply)} USDAX` : "···", color: LIME    },
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

/* ── Wallet button (Privy-connected) ── */
function WalletButton() {
  const { ready, authenticated, login, logout, address } = useAuth();

  if (!ready) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono animate-pulse"
        style={{ background: "hsl(0 0% 7%)", border: `1px solid ${BORDER}`, color: "hsl(0 0% 30%)", minWidth: 120 }}
      >
        <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: "hsl(0 0% 12%)" }} />
        ···
      </div>
    );
  }

  if (authenticated && address) {
    return (
      <div className="flex items-center gap-1">
        {/* Address chip */}
        <div
          className="flex items-center gap-2 rounded-l-lg px-3 py-1.5 text-xs font-mono"
          style={{
            background: `${LIME}0c`,
            border: `1px solid ${LIME}22`,
            borderRight: "none",
            color: "hsl(0 0% 72%)",
          }}
        >
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${LIME}, ${EMERALD})` }}
          />
          {formatAddress(address)}
        </div>
        {/* Logout button */}
        <button
          onClick={() => logout()}
          className="flex items-center justify-center rounded-r-lg px-2 py-1.5 transition-all"
          style={{
            background: "hsl(0 0% 7%)",
            border: `1px solid ${BORDER}`,
            color: MUTED,
            height: "100%",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 84% 60%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsl(0 84% 60% / 0.30)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = MUTED; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
          title="Disconnect wallet"
        >
          <LogOut className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => login()}
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition-all"
      style={{
        background: `${LIME}14`,
        border: `1px solid ${LIME}30`,
        color: LIME,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${LIME}22`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${LIME}14`; }}
    >
      <Wallet className="h-3.5 w-3.5" />
      Connect Wallet
    </button>
  );
}

/* ── Mobile slide-in nav drawer ── */
function MobileDrawer({
  open,
  onClose,
  location,
}: {
  open: boolean;
  onClose: () => void;
  location: string;
}) {
  const { ready, authenticated, login, logout, address } = useAuth();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: "hsl(0 0% 0% / 0.70)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          backdropFilter: open ? "blur(4px)" : "none",
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-72 transition-transform duration-300"
        style={{
          background: CARD_BG,
          borderLeft: `1px solid ${BORDER}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: MUTED }}>
            Navigation
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
            style={{ background: "hsl(0 0% 10%)", border: `1px solid ${BORDER}`, color: MUTED }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full",
                  active ? "" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                style={active ? { background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}22` } : {}}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {link.label}
                <span className="ml-auto text-[10px] font-mono font-normal" style={{ color: "hsl(0 0% 28%)" }}>
                  {link.tip}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: wallet + home */}
        <div
          className="px-4 py-4 space-y-3"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          {/* Wallet */}
          {ready && (
            authenticated && address ? (
              <div className="space-y-2">
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3 font-mono text-xs"
                  style={{ background: `${LIME}08`, border: `1px solid ${LIME}18` }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${LIME}, ${EMERALD})` }}
                  />
                  <span style={{ color: "hsl(0 0% 72%)" }}>{formatAddress(address)}</span>
                </div>
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono font-bold transition-all"
                  style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.20)", color: "hsl(0 84% 60%)" }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => { login(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-mono font-bold transition-all"
                style={{ background: `${LIME}14`, border: `1px solid ${LIME}30`, color: LIME }}
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            )
          )}

          <Link
            href="/"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono transition-all"
            style={{ color: MUTED, border: `1px solid ${BORDER}` }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
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

          {/* Logo + desktop nav */}
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

          {/* Right: desktop controls + mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop: Home + Network badge + Wallet */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              <ArrowLeft className="h-3 w-3" />
              Home
            </Link>

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

            {/* Wallet (hidden on mobile — shown in drawer instead) */}
            <div className="hidden sm:flex">
              <WalletButton />
            </div>

            {/* Mobile hamburger button */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{
                background: mobileOpen ? `${LIME}12` : "hsl(0 0% 7%)",
                border: `1px solid ${mobileOpen ? LIME + "30" : BORDER}`,
                color: mobileOpen ? LIME : MUTED,
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        location={location}
      />
    </>
  );
}
