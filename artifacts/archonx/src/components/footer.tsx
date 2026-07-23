import { useState } from "react";
import { Link } from "wouter";
import {
  Copy, Check, ExternalLink, Twitter, BookOpen,
  Map, Sprout, Activity, Network, Layers, TrendingUp,
  Crosshair, Github, ArrowUpRight, Zap,
} from "lucide-react";
import { formatCompact, formatCompactNum } from "@/lib/utils";
import { useGetNetworkStats } from "@workspace/api-client-react";

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 5%)";
const MUTED   = "hsl(0 0% 26%)";
const SOFT    = "hsl(0 0% 38%)";

/* ─── Robinhood Chain testnet params (static) ─── */
const NETWORK = {
  name:      "Robinhood Chain Testnet",
  rpc:       "https://testnet-rpc.robinhoodchain.io",
  chainId:   "46630",
  chainHex:  "0xB666",
  symbol:    "ETH",
  decimals:  "18",
  explorer:  "https://testnet-explorer.robinhoodchain.io",
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
      onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.color = SOFT; }}
      onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.color = MUTED; }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Network row ─── */
function NetRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2"
      style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="font-mono text-[10px] uppercase tracking-widest flex-shrink-0 w-20" style={{ color: MUTED }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[11px] truncate hover:underline flex items-center gap-1 transition-colors"
            style={{ color: SOFT }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 65%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = SOFT; }}>
            {value} <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
          </a>
        ) : (
          <span className="font-mono text-[11px] truncate" style={{ color: SOFT }}>{value}</span>
        )}
        <CopyBtn value={value} />
      </div>
    </div>
  );
}

/* ─── Add to MetaMask ─── */
function AddNetworkBtn() {
  const [status, setStatus] = useState<"idle"|"ok"|"err">("idle");

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
    } catch { setStatus("err"); setTimeout(() => setStatus("idle"), 2500); }
  };

  const label = status === "ok" ? "Network added!" : status === "err" ? "Failed / No wallet" : "Add to MetaMask";
  const color = status === "ok" ? EMERALD : status === "err" ? "hsl(0 84% 60%)" : LIME;

  return (
    <button onClick={add}
      className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl font-black text-[12px] transition-all"
      style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}20`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}12`; }}>
      <Zap className="w-3 h-3" /> {label}
    </button>
  );
}

/* ─── APP NAV links (left col) ─── */
const APP_LINKS = [
  { href: "/app",              label: "Pulse",   icon: Activity   },
  { href: "/app/nexus",        label: "Nexus",   icon: Network    },
  { href: "/app/positions",    label: "Vaults",  icon: Layers     },
  { href: "/app/yield",        label: "Harvest", icon: Sprout     },
  { href: "/app/staking",      label: "Earn",    icon: TrendingUp },
  { href: "/app/liquidations", label: "Hunt",    icon: Crosshair  },
];

const RESOURCE_LINKS = [
  { href: "/docs",       label: "Documentation", icon: BookOpen,     external: false },
  { href: "/docs#guide", label: "User Guide",    icon: Map,          external: false },
  { href: "https://x.com/usdexfinance", label: "X · @usdexfinance", icon: Twitter, external: true },
  { href: "https://github.com/usdexfinance",     label: "GitHub",    icon: Github,   external: true },
];

/* ─── FOOTER ─── */
export function Footer() {
  const { data: stats } = useGetNetworkStats();

  return (
    <footer style={{ background: "hsl(0 0% 3%)", borderTop: `1px solid ${BORDER}` }}>
      {/* Thin top accent */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${LIME}25, transparent)` }} />

      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">

          {/* ── Col 1: Brand ── */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 cursor-pointer w-fit">
              <img src="/favicon.png" alt="USDEX" className="w-8 h-8 rounded object-cover"
                style={{ border: `1px solid ${LIME}22` }} />
              <div>
                <div className="font-bold text-sm" style={{ color: "hsl(0 0% 80%)" }}>
                  USDEX <span style={{ color: "hsl(0 0% 32%)" }}>Finance</span>
                </div>
                <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color: MUTED }}>
                  Robinhood Chain · EVM 46630
                </div>
              </div>
            </Link>

            <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
              Decentralized stablecoin protocol issuing USDAX, a fully
              collateral-backed stablecoin on Robinhood Chain. Governed by APX
              token holders.
            </p>

            {/* Protocol quick stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "TVL",      v: formatCompact(stats.tvlUsd)       },
                  { l: "Supply",   v: `${formatCompactNum(stats.usdaxSupply)} USDAX` },
                  { l: "Vol 24h",  v: formatCompact(stats.volume24hUsd) },
                  { l: "Total TXs",v: formatCompactNum(stats.totalTransactions) },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg px-2.5 py-2"
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                    <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: MUTED }}>{s.l}</div>
                    <div className="font-black font-mono text-[12px]" style={{ color: LIME }}>{s.v}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 18%)" }}>
              © {new Date().getFullYear()} USDEX Finance · All rights reserved
            </div>
          </div>

          {/* ── Col 2: App navigation ── */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: MUTED }}>
              Application
            </div>
            <div className="space-y-1">
              {APP_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg w-fit group transition-all text-[13px] font-medium"
                  style={{ color: SOFT }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)";
                    (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = SOFT;
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Col 3: Resources ── */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: MUTED }}>
              Resources
            </div>
            <div className="space-y-1">
              {RESOURCE_LINKS.map(({ href, label, icon: Icon, external }) => (
                external ? (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg w-fit text-[13px] font-medium transition-all"
                    style={{ color: SOFT }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)";
                      (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = SOFT;
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {label}
                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                  </a>
                ) : (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg w-fit text-[13px] font-medium transition-all"
                    style={{ color: SOFT }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)";
                      (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = SOFT;
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {label}
                  </Link>
                )
              ))}
            </div>

            {/* Contract addresses */}
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: MUTED }}>
                Contracts
              </div>
              {[
                { label: "USDAX", addr: "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b" },
                { label: "APX",   addr: "0x9F8e7D6c5B4a3C2d1E0f9A8b7C6d5E4f3A2b1C0d" },
              ].map(({ label, addr }) => (
                <div key={label} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <span className="font-mono text-[9px] font-black" style={{ color: LIME }}>{label}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[9px]" style={{ color: MUTED }}>
                      {addr.slice(0, 8)}…{addr.slice(-6)}
                    </span>
                    <CopyBtn value={addr} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Col 4: Network Setup ── */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: MUTED }}>
              Testnet Setup
            </div>

            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${LIME}18` }}>
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${LIME}50, ${LIME}12)` }} />

              {/* Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: LIME }} />
                <span className="font-mono font-black text-[11px] uppercase tracking-widest" style={{ color: LIME }}>
                  Robinhood Chain
                </span>
              </div>

              <div className="space-y-0">
                <NetRow label="Network" value={NETWORK.name} />
                <NetRow label="RPC URL" value={NETWORK.rpc} href={NETWORK.rpc} />
                <NetRow label="Chain ID" value={NETWORK.chainId} />
                <NetRow label="Symbol" value={NETWORK.symbol} />
                <NetRow label="Explorer" value={NETWORK.explorer} href={NETWORK.explorer} />
              </div>

              <AddNetworkBtn />
            </div>

            <div className="mt-4 rounded-xl p-3" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <div className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: MUTED }}>Faucet</div>
              <a href="https://faucet.robinhoodchain.io" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-[11px] transition-colors"
                style={{ color: SOFT }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = LIME; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = SOFT; }}>
                <Zap className="w-3 h-3" />
                faucet.robinhoodchain.io
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
              <p className="font-mono text-[10px] mt-1.5" style={{ color: "hsl(0 0% 20%)" }}>
                Get free testnet ETH to interact with the protocol.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-[10px] text-center sm:text-left" style={{ color: "hsl(0 0% 18%)" }}>
            ⚠ This is a testnet environment. All assets are simulated and have no real monetary value.
            Do not use real funds.
          </p>
          <div className="flex items-center gap-3">
            {[
              { label: "Docs",     href: "/docs"           },
              { label: "Protocol", href: "/protocol"       },
              { label: "Staking",  href: "/staking"        },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="font-mono text-[10px] transition-colors"
                style={{ color: "hsl(0 0% 22%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = SOFT; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 22%)"; }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
