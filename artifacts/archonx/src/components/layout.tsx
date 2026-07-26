import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { formatCompact, formatCompactNum } from "@/lib/utils";
import { useGetNetworkStats } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/privy-auth";
import {
  Activity, Layers, TrendingUp, Crosshair, Network, ArrowLeft, Sprout,
  BarChart2, ArrowUpDown, Users, Menu, X, Wallet, LogOut, ScrollText,
  ChevronDown,
} from "lucide-react";
import { formatAddress } from "@/lib/utils";

const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const BORDER  = "hsl(0 0% 10%)";
const MUTED   = "hsl(0 0% 26%)";
const CARD_BG = "hsl(0 0% 6%)";
const NETWORK_NAME = "Robinhood Chain";

type SubLink  = { href: string; label: string; icon: React.ElementType; tip: string };
type NavEntry =
  | { href: string; label: string; icon: React.ElementType; tip: string; children?: undefined }
  | { href: string; label: string; icon: React.ElementType; tip: string; children: SubLink[] };

const navLinks: NavEntry[] = [
  { href: "/app",             label: "Monitor",      icon: Activity,   tip: "Protocol overview"        },
  { href: "/app/nexus",       label: "Protocol",     icon: Network,    tip: "How USDAX works"          },
  { href: "/app/positions",   label: "Vaults",       icon: Layers,     tip: "Borrow USDAX"             },
  { href: "/app/yield",       label: "Yield",        icon: Sprout,     tip: "Earn yield on USDAX"      },
  {
    href: "/app/staking", label: "Staking", icon: TrendingUp, tip: "Stake APX, earn rewards",
    children: [
      { href: "/app/staking",          label: "Staking",  icon: TrendingUp, tip: "Stake APX, earn rewards"   },
      { href: "/app/staking-activity", label: "Activity", icon: ScrollText, tip: "Live transaction feed"     },
    ],
  },
  { href: "/app/liquidations", label: "Liquidations", icon: Crosshair, tip: "Liquidate at-risk vaults"  },
];

/* ── Desktop dropdown for nav groups ── */
function NavDropdown({ entry, location }: { entry: NavEntry & { children: SubLink[] }; location: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGroupActive = entry.children.some((c) => location === c.href);
  const Icon = entry.icon;

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Trigger button */}
      <button
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all tracking-wide select-none",
          isGroupActive
            ? ""
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        style={isGroupActive ? { background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}20` } : {}}
      >
        <Icon className="h-3.5 w-3.5" />
        {entry.label}
        <ChevronDown
          className="h-2.5 w-2.5 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute left-0 top-full mt-1 rounded-xl overflow-hidden z-50 min-w-[168px]"
        style={{
          background: "hsl(0 0% 7%)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 8px 24px hsl(0 0% 0% / 0.5)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.15s, transform 0.15s",
        }}
      >
        {entry.children.map((child) => {
          const CIcon = child.icon;
          const active = location === child.href;
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-bold transition-all",
                active ? "" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
              style={active ? { color: LIME, background: `${LIME}10` } : {}}
            >
              <CIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <div>
                <div>{child.label}</div>
                <div className="text-[9px] font-normal font-mono mt-0.5" style={{ color: "hsl(0 0% 32%)" }}>
                  {child.tip}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── USDAX coin icon (used as React.ElementType in stat pills) ── */
function USDAxCoin({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <img src="/usdax-coin.png" alt="USDAX" className={className} style={{ ...style, borderRadius: "50%", objectFit: "cover" as const, filter: "opacity(0.6)" }} />;
}

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

/* ── App footer with live protocol stats ── */
export function AppFooter() {
  const { data, isLoading } = useGetNetworkStats();

  const stats = [
    { icon: BarChart2,   label: "Total Value Locked",  value: data ? `$${formatCompact(data.tvlUsd)}` : "···",               color: LIME    },
    { icon: ArrowUpDown, label: data && data.volume24hUsd > 0 ? "Volume 24h" : "Volume Total", value: data ? `$${formatCompact(data.volume24hUsd > 0 ? data.volume24hUsd : data.totalVolumeUsd)}` : "···", color: LIME },
    { icon: Activity,    label: "Transactions",         value: data ? formatCompactNum(data.totalTransactions) : "···",        color: EMERALD },
    { icon: Users,       label: "Users",                value: data ? formatCompactNum(data.uniqueUsers) : "···",              color: EMERALD },
    { icon: USDAxCoin,   label: "USDAX Supply",         value: data ? `${formatCompactNum(data.usdaxSupply)} USDAX` : "···",   color: LIME    },
  ];

  return (
    <footer
      className="w-full mt-auto"
      style={{
        background: "hsl(0 0% 2.5%)",
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Left: live stats grid */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
                <span className="text-xs" style={{ color: MUTED }}>{s.label}</span>
                <span
                  className={cn("text-xs font-bold font-mono", isLoading && "animate-pulse")}
                  style={{ color: isLoading ? MUTED : s.color }}
                >
                  {isLoading ? "···" : s.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: network info */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[11px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-widest"
            style={{ background: "hsl(35 92% 60% / 0.10)", color: "hsl(35 92% 60%)", border: "1px solid hsl(35 92% 60% / 0.22)" }}
          >
            Testnet
          </span>
          <span className="text-xs font-mono" style={{ color: MUTED }}>Robinhood Chain · EVM 46630</span>
        </div>
      </div>
    </footer>
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

            if (link.children) {
              const isGroupActive = link.children.some((c) => location === c.href);
              return (
                <div key={link.href}>
                  {/* Group header — not clickable, just label */}
                  <div
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ color: isGroupActive ? LIME : "hsl(0 0% 32%)" }}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {link.label}
                  </div>
                  {/* Sub-items indented */}
                  <div className="ml-4 pl-3 space-y-0.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                    {link.children.map((child) => {
                      const CIcon = child.icon;
                      const active = location === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all w-full",
                            active ? "" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                          style={active ? { background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}22` } : {}}
                        >
                          <CIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          {child.label}
                          <span className="ml-auto text-[10px] font-mono font-normal" style={{ color: "hsl(0 0% 28%)" }}>
                            {child.tip}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

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
        {/* ── Main nav row ── */}
        <div className="max-w-screen-xl mx-auto flex h-14 items-center justify-between px-6">

          {/* Logo + desktop nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
              <img
                src="/favicon.png"
                alt="USDAX"
                className="w-7 h-7 rounded object-cover"
                style={{ border: `1px solid ${LIME}22` }}
              />
              <span className="font-bold text-sm tracking-tight hidden sm:block" style={{ color: "hsl(0 0% 80%)" }}>
                USDAX <span style={{ color: "hsl(0 0% 32%)" }}>Finance</span>
              </span>
            </Link>

            <div className="hidden md:block w-px h-4" style={{ background: BORDER }} />

            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                if (link.children) {
                  return <NavDropdown key={link.href} entry={link} location={location} />;
                }
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
              className="hidden sm:flex items-center rounded-lg px-2.5 py-1.5"
              style={{
                background: "hsl(0 0% 6%)",
                border: "1px solid hsl(0 0% 12%)",
              }}
            >
              <img
                src="/robinhood-logo.webp"
                alt="Robinhood Chain"
                className="h-4 w-auto object-contain"
                style={{ mixBlendMode: "screen" }}
              />
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
