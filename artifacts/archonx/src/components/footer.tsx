import { useState } from "react";
import { Link } from "wouter";
import {
  Copy, Check, ExternalLink, Twitter, BookOpen,
  Map, Sprout, Activity, Network, Layers, TrendingUp,
  Crosshair, Github, ArrowUpRight, Zap, Shield,
} from "lucide-react";
import { formatCompact, formatCompactNum } from "@/lib/utils";
import { useGetNetworkStats } from "@workspace/api-client-react";

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const BORDER  = "hsl(0 0% 9%)";
const CARD_BG = "hsl(0 0% 5%)";
const MUTED   = "hsl(0 0% 25%)";
const SOFT    = "hsl(0 0% 40%)";
const DIM     = "hsl(0 0% 55%)";

/* ─── Robinhood Chain testnet params ─── */
const NETWORK = {
  name:     "Robinhood Chain Testnet",
  rpc:      "https://testnet-rpc.robinhoodchain.io",
  chainId:  "46630",
  chainHex: "0xB666",
  symbol:   "ETH",
  explorer: "https://testnet-explorer.robinhoodchain.io",
};

/* ─── Copy button ─── */
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all"
      style={{ color: copied ? LIME : MUTED }}
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Add Robinhood Chain to wallet ─── */
function AddNetworkBtn() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const add = async () => {
    if (!(window as any).ethereum) { setStatus("err"); return; }
    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: NETWORK.chainHex,
          chainName: NETWORK.name,
          rpcUrls: [NETWORK.rpc],
          nativeCurrency: { name: "Ether", symbol: NETWORK.symbol, decimals: 18 },
          blockExplorerUrls: [NETWORK.explorer],
        }],
      });
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("err");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const color =
    status === "ok"  ? EMERALD :
    status === "err" ? "hsl(0 84% 60%)" :
    LIME;
  const label =
    status === "ok"  ? "Network added!" :
    status === "err" ? "No wallet found" :
    "Add to MetaMask";

  return (
    <button
      onClick={add}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all"
      style={{ background: `${color}10`, color, border: `1px solid ${color}28` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}1e`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}10`; }}
    >
      <Zap className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/* ─── Nav link ─── */
function NavLink({
  href, label, icon: Icon, external = false,
}: {
  href: string; label: string; icon: React.ElementType; external?: boolean;
}) {
  const inner = (
    <>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
      <span>{label}</span>
      {external && <ArrowUpRight className="w-3 h-3 opacity-40 ml-auto" />}
    </>
  );

  const cls =
    "flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-[13px] font-medium transition-all w-full";
  const style = { color: SOFT } as React.CSSProperties;
  const hoverOn  = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.color      = DIM;
    (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)";
  };
  const hoverOff = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.color      = SOFT;
    (e.currentTarget as HTMLElement).style.background = "transparent";
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className={cls} style={style}
        onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} style={style}
      onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
      {inner}
    </Link>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3 mt-1"
      style={{ color: MUTED }}>
      {children}
    </div>
  );
}

/* ─── FOOTER ─── */
export function Footer() {
  const { data: stats } = useGetNetworkStats();

  return (
    <footer style={{ background: "hsl(0 0% 3%)", borderTop: `1px solid ${BORDER}` }}>
      {/* top lime accent line */}
      <div className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${LIME}30 40%, ${LIME}10 100%)` }} />

      <div className="max-w-screen-xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 xl:gap-16">

          {/* ══════════════════════════════════
              COL 1 — Brand + live stats
          ══════════════════════════════════ */}
          <div className="space-y-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 w-fit cursor-pointer group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${LIME}10`, border: `1px solid ${LIME}20` }}>
                <img src="/favicon.png" alt="USDEX"
                  className="w-5 h-5 object-contain" />
              </div>
              <div>
                <div className="font-bold text-[14px] leading-tight"
                  style={{ color: "hsl(0 0% 78%)" }}>
                  USDEX <span style={{ color: MUTED }}>Finance</span>
                </div>
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase mt-0.5"
                  style={{ color: "hsl(0 0% 20%)" }}>
                  Robinhood Chain · EVM 46630
                </div>
              </div>
            </Link>

            {/* Description */}
            <p className="text-[12px] leading-[1.7]" style={{ color: MUTED }}>
              Decentralized overcollateralized stablecoin protocol on Robinhood
              Chain. Mint USDAX against crypto &amp; RWA collateral. Governed by
              APX token holders.
            </p>

            {/* Live protocol stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "TVL",       v: formatCompact(stats.tvlUsd)           },
                  { l: "USDAX",     v: formatCompactNum(stats.usdaxSupply)   },
                  { l: "Vol 24h",   v: formatCompact(stats.volume24hUsd)     },
                  { l: "Txs",       v: formatCompactNum(stats.totalTransactions) },
                ].map(({ l, v }) => (
                  <div key={l} className="rounded-xl px-3 py-2.5"
                    style={{ background: "hsl(0 0% 6%)", border: `1px solid ${BORDER}` }}>
                    <div className="font-mono text-[9px] uppercase tracking-widest mb-1"
                      style={{ color: MUTED }}>
                      {l}
                    </div>
                    <div className="font-black font-mono text-[13px]" style={{ color: LIME }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Copyright */}
            <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 16%)" }}>
              © {new Date().getFullYear()} USDEX Finance · All rights reserved
            </div>
          </div>

          {/* ══════════════════════════════════
              COL 2 — Navigation
          ══════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-8">
            {/* App links */}
            <div>
              <SectionLabel>Application</SectionLabel>
              <div className="space-y-0.5">
                {[
                  { href: "/app",              label: "Pulse",   icon: Activity   },
                  { href: "/app/nexus",        label: "Nexus",   icon: Network    },
                  { href: "/app/positions",    label: "Vaults",  icon: Layers     },
                  { href: "/app/yield",        label: "Harvest", icon: Sprout     },
                  { href: "/app/staking",      label: "Earn",    icon: TrendingUp },
                  { href: "/app/liquidations", label: "Hunt",    icon: Crosshair  },
                ].map((l) => <NavLink key={l.href} {...l} />)}
              </div>
            </div>

            {/* Resource links */}
            <div>
              <SectionLabel>Resources</SectionLabel>
              <div className="space-y-0.5">
                {[
                  { href: "/docs",       label: "Documentation", icon: BookOpen, external: false },
                  { href: "/docs#guide", label: "User Guide",    icon: Map,      external: false },
                  { href: "/protocol",   label: "Protocol",      icon: Shield,   external: false },
                  {
                    href:     "https://x.com/usdexfinance",
                    label:    "X · @usdexfinance",
                    icon:     Twitter,
                    external: true,
                  },
                  {
                    href:     "https://github.com/usdexfinance",
                    label:    "GitHub",
                    icon:     Github,
                    external: true,
                  },
                ].map((l) => <NavLink key={l.href} {...l} />)}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              COL 3 — Testnet / Network
          ══════════════════════════════════ */}
          <div className="space-y-4">
            <SectionLabel>Testnet Setup</SectionLabel>

            {/* Network card */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${LIME}15` }}>
              {/* card top accent */}
              <div className="h-0.5 w-full"
                style={{ background: `linear-gradient(90deg, ${LIME}55, ${LIME}10)` }} />

              <div className="p-4 space-y-0">
                {/* header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: LIME }} />
                  <span className="font-mono font-black text-[11px] uppercase tracking-[0.15em]"
                    style={{ color: LIME }}>
                    Robinhood Chain
                  </span>
                </div>

                {/* network rows */}
                {[
                  { label: "Network",  value: "Robinhood Chain Testnet",               href: undefined },
                  { label: "Chain ID", value: "46630",                                 href: undefined },
                  { label: "Symbol",   value: "ETH",                                   href: undefined },
                  { label: "RPC",      value: NETWORK.rpc,                             href: NETWORK.rpc },
                  { label: "Explorer", value: NETWORK.explorer,                        href: NETWORK.explorer },
                ].map(({ label, value, href }) => (
                  <div key={label}
                    className="flex items-center justify-between gap-2 py-2"
                    style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-mono text-[9px] uppercase tracking-widest flex-shrink-0 w-16"
                      style={{ color: "hsl(0 0% 22%)" }}>
                      {label}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-[10px] truncate hover:underline flex items-center gap-1"
                          style={{ color: SOFT }}>
                          {value.replace("https://", "").slice(0, 28)}
                          {value.length > 32 ? "…" : ""}
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
                        </a>
                      ) : (
                        <span className="font-mono text-[10px]" style={{ color: SOFT }}>{value}</span>
                      )}
                      <CopyBtn value={value} />
                    </div>
                  </div>
                ))}

                <div className="pt-3">
                  <AddNetworkBtn />
                </div>
              </div>
            </div>

            {/* Faucet */}
            <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: "hsl(0 0% 20%)" }}>
                  Faucet
                </div>
                <a href="https://faucet.robinhoodchain.io" target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] flex items-center gap-1 transition-colors"
                  style={{ color: SOFT }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = LIME; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = SOFT; }}>
                  faucet.robinhoodchain.io
                  <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                </a>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${LIME}10`, border: `1px solid ${LIME}20` }}>
                <Zap className="w-4 h-4" style={{ color: LIME }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <p className="font-mono text-[10px]" style={{ color: "hsl(0 0% 16%)" }}>
            ⚠ Testnet environment · All assets are simulated · No real monetary value
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
            <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 18%)" }}>
              EVM 46630 · TESTNET
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
