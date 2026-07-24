import { Link } from "wouter";
import { useGetCollateralBreakdown, useGetProtocolStats } from "@workspace/api-client-react";
import {
  Zap, Lock, RefreshCw, TrendingUp, Coins,
  Globe, Shield, Landmark, Building2, FileText,
  BarChart3, ArrowRight, Check, Package, ChevronRight, LineChart,
} from "lucide-react";
import { formatCurrency, formatNumber, formatCompact } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const INDIGO  = "hsl(231 92% 72%)";
const VIOLET  = "hsl(280 70% 65%)";
const BLUE    = "hsl(200 80% 55%)";
const ROSE    = "hsl(346 84% 61%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 7.5%)";

/* ─── atoms ─── */
function LBracket({ size = 8, color }: { size?: number; color: string }) {
  const s = { position: "absolute" as const, width: size, height: size };
  return (
    <>
      <span style={{ ...s, top: 0, left: 0, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
      <span style={{ ...s, top: 0, right: 0, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
      <span style={{ ...s, bottom: 0, left: 0, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
      <span style={{ ...s, bottom: 0, right: 0, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
    </>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}>
      {children}
    </span>
  );
}

/* ─── Collateral config — no emoji, consistent token badges ─── */
type CollCfg = {
  symbol: string;
  icon?: LucideIcon;
  ltv: number;
  liqThreshold: number;
  type: "crypto" | "yield" | "rwa" | "stock";
  color: string;
  badge: string;
  desc: string;
  oracle: string;
  ceil: string;
};

const COLL: Record<string, CollCfg> = {
  // ── Crypto ──────────────────────────────────────────────────────────────
  WETH:    { symbol: "Ξ",  ltv: 75, liqThreshold: 80, type: "crypto", color: INDIGO,
             badge: "Core Crypto", desc: "Wrapped Ether — most liquid EVM asset with deep Chainlink + Pyth oracle coverage.", oracle: "Chainlink + Pyth", ceil: "$20M" },
  WBTC:    { symbol: "₿",  ltv: 65, liqThreshold: 70, type: "crypto", color: AMBER,
             badge: "Core Crypto", desc: "Wrapped Bitcoin — highest market-cap crypto, accepted at conservative LTV for safety.", oracle: "Chainlink + Pyth", ceil: "$15M" },
  stETH:   { symbol: "∞",  ltv: 63, liqThreshold: 68, type: "yield",  color: EMERALD,
             badge: "Yield-bearing", desc: "Lido staked ETH — yield-bearing collateral, accrued rewards reduce effective borrow cost.", oracle: "Chainlink + Lido", ceil: "$10M" },
  // ── RWA ─────────────────────────────────────────────────────────────────
  "RWA-TB":{ symbol: "",   icon: Landmark,  ltv: 92, liqThreshold: 95, type: "rwa", color: LIME,
             badge: "T-Bills",     desc: "Tokenized US Treasury Bills via Ondo Finance. Daily NAV attestation by BigFour auditors.", oracle: "Ondo Daily NAV",    ceil: "$50M" },
  "RWA-RE":{ symbol: "",   icon: Building2, ltv: 68, liqThreshold: 73, type: "rwa", color: VIOLET,
             badge: "Real Estate", desc: "Tokenized first-lien commercial real estate senior debt via Centrifuge.", oracle: "Centrifuge Feed",  ceil: "$25M" },
  "RWA-CB":{ symbol: "",   icon: FileText,  ltv: 78, liqThreshold: 83, type: "rwa", color: BLUE,
             badge: "Corp. Bonds", desc: "Tokenized investment-grade corporate bonds via Maple Finance. Monthly oracle feeds.", oracle: "Maple Monthly",   ceil: "$30M" },
  // ── Robinhood Chain Stock Tokens ─────────────────────────────────────────
  TSLA:    { symbol: "",  icon: LineChart, ltv: 60, liqThreshold: 67, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "Tesla Inc. tokenized equity on Robinhood Chain. Tracks NASDAQ:TSLA price via Robinhood oracle.", oracle: "Robinhood Oracle", ceil: "$10M" },
  AMZN:    { symbol: "",  icon: LineChart, ltv: 65, liqThreshold: 72, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "Amazon.com Inc. tokenized equity. Large-cap stable growth stock accepted at moderate LTV.", oracle: "Robinhood Oracle", ceil: "$10M" },
  PLTR:    { symbol: "",  icon: LineChart, ltv: 55, liqThreshold: 63, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "Palantir Technologies — high-growth AI analytics. Conservative LTV reflects higher volatility.", oracle: "Robinhood Oracle", ceil: "$5M" },
  NFLX:    { symbol: "",  icon: LineChart, ltv: 63, liqThreshold: 70, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "Netflix Inc. tokenized equity. Streaming leader with strong cash flow and moderate volatility.", oracle: "Robinhood Oracle", ceil: "$8M" },
  AMD:     { symbol: "",  icon: LineChart, ltv: 62, liqThreshold: 68, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "Advanced Micro Devices — semiconductor leader in CPU & GPU. Cyclical but liquid.", oracle: "Robinhood Oracle", ceil: "$8M" },
  NVDA:    { symbol: "",  icon: LineChart, ltv: 65, liqThreshold: 72, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "NVIDIA Corp — dominant AI/GPU chipmaker. Large-cap, high liquidity, accepted at standard LTV.", oracle: "Robinhood Oracle", ceil: "$10M" },
  AAPL:    { symbol: "",  icon: LineChart, ltv: 68, liqThreshold: 75, type: "stock", color: ROSE,
             badge: "Stock Token", desc: "Apple Inc. — highest market-cap stock. Most stable of the stock tokens, highest LTV allowed.", oracle: "Robinhood Oracle", ceil: "$12M" },
};

function TokenBadge({ sym, cfg }: { sym: string; cfg: CollCfg }) {
  const Icon = cfg.icon;
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg font-mono"
      style={{ background: `${cfg.color}12`, border: `1.5px solid ${cfg.color}28`, color: cfg.color }}>
      {Icon ? <Icon className="w-4.5 h-4.5" style={{ color: cfg.color, width: 18, height: 18 }} />
             : <span style={{ lineHeight: 1 }}>{cfg.symbol}</span>}
    </div>
  );
}

/* ─────── SECTIONS ─────── */

/* Hero */
function Hero({ stats }: { stats: any }) {
  const tvl    = stats ? formatCompact(stats.tvlUsd)                       : "—";
  const supply = stats ? formatCompact(stats.usdaxSupply)                   : "—";
  const ratio  = stats ? `${formatNumber(stats.collateralRatio * 100, 0)}%` : "—";
  const cr     = stats?.collateralRatio ?? 0;
  const crColor= cr >= 2 ? LIME : cr >= 1.5 ? EMERALD : AMBER;

  return (
    <div className="relative overflow-hidden pb-4">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{
        backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(0 0% 100% / 0.03) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
          USDAX Finance · Protocol Nexus
        </span>
      </div>
      <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight mb-1.5">
        USDAX <span style={{ color: LIME }}>Nexus</span>
      </h1>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: "hsl(0 0% 38%)" }}>
        The CDP engine behind USDAX — a dollar-pegged stablecoin overcollateralised by battle-tested
        crypto assets and real-world assets. Deposit → Mint → Deploy.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Collateral Locked", val: tvl,    color: LIME,    sub: "Across all active vaults" },
          { label: "USDAX in Circulation",    val: supply, color: EMERALD, sub: "Active minted supply"      },
          { label: "Collateral Ratio",        val: ratio,  color: crColor, sub: "Protocol-wide average"    },
        ].map((s) => (
          <div key={s.label} className="relative rounded-xl px-5 py-4 overflow-hidden"
            style={{ background: CARD, border: `1px solid ${s.color}18` }}>
            <div className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: `linear-gradient(90deg, ${s.color}50, transparent)` }} />
            <LBracket color={`${s.color}22`} />
            <div className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "hsl(0 0% 28%)" }}>
              {s.label}
            </div>
            <div className="font-black text-2xl font-mono mb-0.5" style={{ color: s.color }}>{s.val}</div>
            <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Mint Flow */
const FLOW_STEPS = [
  { n: "01", icon: Coins,     title: "Deposit Collateral",
    body: "Lock WETH, WBTC, stETH, RWA tokens, or Robinhood Chain Stock Tokens (TSLA, AMZN, NVDA, AAPL…) into a USDAX Vault on Robinhood Chain (EVM 46630)." },
  { n: "02", icon: Lock,      title: "Open CDP Vault",
    body: "The Vault Manager creates a Collateralised Debt Position (CDP) tracking your deposit and outstanding USDAX debt." },
  { n: "03", icon: Zap,       title: "Mint USDAX",
    body: "Borrow USDAX up to your LTV ceiling. A 0.1% one-time mint fee and 0.5% annualised stability fee apply." },
  { n: "04", icon: TrendingUp, title: "Deploy Capital",
    body: "Use USDAX in DeFi — liquidity pools, yield strategies, cross-chain payments, or hold a dollar-stable position." },
  { n: "05", icon: RefreshCw,  title: "Repay & Reclaim",
    body: "Return USDAX + accrued fees at any time to unlock and withdraw your collateral. No lock periods." },
];

function MintFlow() {
  return (
    <div className="relative rounded-xl overflow-hidden h-full"
      style={{ background: CARD, border: `1px solid ${LIME}18` }}>
      <div className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${LIME}55, transparent)` }} />
      <LBracket color={`${LIME}22`} />

      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-1 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            Minting Flow
          </span>
        </div>
        <h2 className="font-black text-lg uppercase tracking-tight mb-5 flex-shrink-0" style={{ color: "hsl(0 0% 90%)" }}>
          How USDAX is Created
        </h2>

        <div className="flex-1 overflow-y-auto space-y-0 min-h-0">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === FLOW_STEPS.length - 1;
            return (
              <div key={step.n} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${LIME}12`, border: `1.5px solid ${LIME}30`, zIndex: 1 }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: LIME }} />
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 my-1" style={{ background: `${LIME}15`, minHeight: 16 }} />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px]" style={{ color: `${LIME}55` }}>{step.n}</span>
                    <span className="font-black text-[13px]" style={{ color: "hsl(0 0% 86%)" }}>{step.title}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/app/positions" className="flex-shrink-0 mt-3">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            font-black text-[13px] transition-all"
            style={{ background: LIME, color: "hsl(0 0% 4%)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${LIME}28`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            <Zap className="w-4 h-4" /> Open a Vault & Mint USDAX
          </button>
        </Link>
      </div>
    </div>
  );
}

/* Collateral Matrix — table style */
function CollateralMatrix({ live }: { live: any[] }) {
  const liveMap: Record<string, { amount: number; valueUsd: number }> = {};
  live?.forEach((c) => { liveMap[c.symbol] = { amount: c.amountLocked, valueUsd: c.valueUsd }; });

  const typeColor: Record<string, string> = { crypto: INDIGO, yield: EMERALD, rwa: LIME, stock: ROSE };
  const typeLabel: Record<string, string> = { crypto: "Crypto", yield: "Yield", rwa: "RWA", stock: "Stock" };

  return (
    <div className="relative rounded-xl overflow-hidden h-full flex flex-col"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${EMERALD}40, ${LIME}20, transparent)` }} />
      <LBracket color={`${LIME}18`} />

      {/* Fixed header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: EMERALD }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            Collateral Matrix
          </span>
        </div>
        <h2 className="font-black text-lg uppercase tracking-tight" style={{ color: "hsl(0 0% 90%)" }}>
          Accepted Collateral
        </h2>
      </div>

      {/* Scrollable token list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
        {Object.entries(COLL).map(([sym, cfg]) => {
            const lv = liveMap[sym];
            const tc = typeColor[cfg.type];
            return (
              <div key={sym} className="relative rounded-xl overflow-hidden transition-all group"
                style={{ background: CARD2, border: `1px solid ${BORDER}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}25`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>

                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Token badge */}
                  <TokenBadge sym={sym} cfg={cfg} />

                  {/* Symbol + badge */}
                  <div className="min-w-[90px]">
                    <div className="font-black text-[13px] font-mono" style={{ color: "hsl(0 0% 88%)" }}>{sym}</div>
                    <Tag color={tc}>{typeLabel[cfg.type]}</Tag>
                  </div>

                  {/* LTV */}
                  <div className="min-w-[56px]">
                    <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "hsl(0 0% 28%)" }}>Max LTV</div>
                    <div className="font-black text-[14px] font-mono" style={{ color: LIME }}>{cfg.ltv}%</div>
                  </div>

                  {/* Liq threshold */}
                  <div className="min-w-[60px] hidden md:block">
                    <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "hsl(0 0% 28%)" }}>Liq. Thresh.</div>
                    <div className="font-black text-[13px] font-mono" style={{ color: AMBER }}>{cfg.liqThreshold}%</div>
                  </div>

                  {/* Live deposited */}
                  <div className="flex-1 min-w-0 hidden lg:block">
                    <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "hsl(0 0% 28%)" }}>
                      {lv ? "Deposited" : "Status"}
                    </div>
                    {lv ? (
                      <div className="font-black text-[13px] font-mono" style={{ color: "hsl(0 0% 75%)" }}>
                        {formatNumber(lv.amount, 3)} {sym}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER }} />
                        <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 30%)" }}>Onboarding Q3 2026</span>
                      </div>
                    )}
                  </div>

                  {/* Live value */}
                  <div className="min-w-[90px] text-right hidden sm:block">
                    {lv ? (
                      <>
                        <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "hsl(0 0% 28%)" }}>Value (USD)</div>
                        <div className="font-black text-[13px] font-mono" style={{ color: cfg.color }}>
                          {formatCurrency(lv.valueUsd)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "hsl(0 0% 28%)" }}>Debt Ceiling</div>
                        <div className="font-mono text-[11px]" style={{ color: "hsl(0 0% 35%)" }}>{cfg.ceil}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Hover: expand description */}
                <div className="px-3 pb-0 max-h-0 overflow-hidden transition-all group-hover:max-h-10 group-hover:pb-2">
                  <p className="font-mono text-[10px]" style={{ color: "hsl(0 0% 32%)" }}>{cfg.desc}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* Peg Mechanics */
function PegMechanics() {
  const mechanisms = [
    { title: "Redemption Floor",
      body: "Any holder can always redeem 1 USDAX for $1.00 of collateral at face value — creating a hard price floor." },
    { title: "Stability Fee Pressure",
      body: "Rising stability fees disincentivise excess minting, naturally contracting supply when demand softens." },
    { title: "DEX Arbitrage Bots",
      body: "Automated bots close any deviation by buying sub-$1 USDAX to redeem, or minting at $1 to sell above peg." },
  ];

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD, border: `1px solid ${EMERALD}18` }}>
      <div className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${EMERALD}55, transparent)` }} />
      <LBracket color={`${EMERALD}22`} />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: EMERALD }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            Peg Stability
          </span>
        </div>
        <h2 className="font-black text-lg uppercase tracking-tight mb-5" style={{ color: "hsl(0 0% 90%)" }}>
          How USDAX Stays at $1.00
        </h2>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Mechanisms */}
          <div className="space-y-4">
            {mechanisms.map((m) => (
              <div key={m.title} className="flex gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: `${LIME}14`, border: `1px solid ${LIME}28` }}>
                  <Check className="w-2.5 h-2.5" style={{ color: LIME }} />
                </div>
                <div>
                  <div className="font-black text-[13px] mb-0.5" style={{ color: "hsl(0 0% 84%)" }}>{m.title}</div>
                  <div className="text-[11.5px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{m.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live peg visual */}
          <div className="relative rounded-xl p-5 overflow-hidden"
            style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
            <LBracket size={7} color={`${EMERALD}28`} />
            <div className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "hsl(0 0% 28%)" }}>
              Live Peg Status
            </div>
            <div className="text-center py-4">
              <div className="font-black text-5xl font-mono mb-1" style={{ color: LIME }}>$1.0000</div>
              <div className="text-[11px] font-mono flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: EMERALD }} />
                <span style={{ color: EMERALD }}>USDAX perfectly pegged</span>
              </div>
            </div>

            {/* Peg band */}
            <div className="mb-4">
              <div className="flex justify-between font-mono text-[9px] mb-1" style={{ color: "hsl(0 0% 28%)" }}>
                <span>$0.990</span><span>$1.000</span><span>$1.010</span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 9%)" }}>
                <div className="absolute inset-y-0 left-[30%] right-[30%]" style={{ background: `${LIME}20` }} />
                <div className="absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ background: LIME, boxShadow: `0 0 8px ${LIME}80` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Redemption", val: "Instant", color: LIME },
                { label: "Mint Fee",   val: "0.50%",   color: EMERALD },
                { label: "Stability Fee", val: "0.50% / yr", color: LIME },
                { label: "Peg Target", val: "$1.0000", color: EMERALD },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg"
                  style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                  <div className="font-black text-sm font-mono" style={{ color: s.color }}>{s.val}</div>
                  <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 28%)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* RWA Deep Dive */
const RWA_PROVIDERS = [
  { icon: Landmark, color: LIME,   name: "Ondo Finance",
    product: "OUSG — Tokenized US T-Bills", apy: "5.1% base", ltv: "92%", scale: "$180M+",
    body: "Short-duration US Treasury exposure. Daily NAV by BigFour auditors. Earn T-Bill yield while unlocking USDAX liquidity via vaults." },
  { icon: Building2, color: VIOLET, name: "Centrifuge",
    product: "Real Estate Senior Debt",      apy: "7–9% base", ltv: "68%", scale: "$420M+",
    body: "First-lien commercial real estate mortgages by licensed lenders. Monthly cashflows verified on-chain. Conservative LTV vs crypto." },
  { icon: FileText,  color: BLUE,   name: "Maple Finance",
    product: "Corporate Credit Pool",        apy: "8–12% base", ltv: "78%", scale: "$2B+",
    body: "Investment-grade corporate borrowers, underwritten by Maple pool delegates. Quarterly price oracles. Institutional DeFi access." },
];

const RWA_FLOW = [
  "Real-World Asset", "Tokenization (Ondo / Centrifuge)",
  "Governance Whitelist", "USDAX Vault Deposit", "USDAX Minted", "DeFi Deployment",
];

function RWADeepDive() {
  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD, border: `1px solid ${LIME}15` }}>
      <div className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${LIME}55, ${LIME}15)` }} />
      <LBracket color={`${LIME}22`} />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            RWA Integration
          </span>
        </div>
        <h2 className="font-black text-lg uppercase tracking-tight mb-1" style={{ color: "hsl(0 0% 90%)" }}>
          Institutional Capital, DeFi Rails
        </h2>
        <p className="text-[12px] mb-5" style={{ color: "hsl(0 0% 38%)" }}>
          Real World Assets bring predictable off-chain yield into USDAX vaults. Each provider is governance-whitelisted, audited, and monitored by dedicated oracle feeds.
        </p>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {RWA_PROVIDERS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className="relative rounded-xl p-4 overflow-hidden"
                style={{ background: CARD2, border: `1px solid ${p.color}18` }}>
                <LBracket size={7} color={`${p.color}22`} />
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${p.color}12`, border: `1.5px solid ${p.color}28` }}>
                    <Icon className="w-4 h-4" style={{ color: p.color }} />
                  </div>
                  <div>
                    <div className="font-black text-[12px]" style={{ color: "hsl(0 0% 86%)" }}>{p.name}</div>
                    <div className="font-mono text-[10px]" style={{ color: p.color }}>{p.product}</div>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(0 0% 36%)" }}>{p.body}</p>
                <div className="grid grid-cols-3 gap-1">
                  {[{ l: "Yield", v: p.apy, c: p.color }, { l: "LTV", v: p.ltv, c: LIME }, { l: "Scale", v: p.scale, c: EMERALD }].map((s) => (
                    <div key={s.l} className="text-center p-1.5 rounded-lg"
                      style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                      <div className="font-black text-[10px] font-mono" style={{ color: s.c }}>{s.v}</div>
                      <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 28%)" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* RWA lifecycle flow */}
        <div className="relative rounded-xl p-4 overflow-hidden"
          style={{ background: CARD2, border: `1px solid ${LIME}15` }}>
          <LBracket size={7} color={`${LIME}22`} />
          <div className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: "hsl(0 0% 28%)" }}>
            RWA Lifecycle
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {RWA_FLOW.map((step, i, arr) => (
              <div key={step} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: i === arr.length - 1 ? `${LIME}12` : "hsl(0 0% 5%)",
                    border: `1px solid ${i === arr.length - 1 ? `${LIME}28` : BORDER}`,
                  }}>
                  <span className="font-mono text-[9px]" style={{ color: "hsl(0 0% 26%)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: i === arr.length - 1 ? LIME : "hsl(0 0% 65%)" }}>
                    {step}
                  </span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(0 0% 20%)" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Use Cases */
const USE_CASES = [
  { icon: TrendingUp, title: "DeFi Yield Strategies",
    body: "Deposit USDAX into USDAX/USDC liquidity pools, lending protocols, or yield aggregators. Earn trading fees on top of your collateral's base yield.",
    tags: ["AMM Liquidity", "Lending", "Yield Aggregation"] },
  { icon: Globe,      title: "Cross-Border Payments",
    body: "Send dollar-stable value across borders via Robinhood Chain's sub-second finality. USDAX settles in ~1s with <$0.001 gas fees.",
    tags: ["Remittances", "B2B Settlements", "Payroll"] },
  { icon: Shield,     title: "Leverage & Hedging",
    body: "Mint USDAX against ETH, buy more ETH, re-deposit — building leveraged longs. Or hold USDAX to hedge portfolio drawdowns without selling collateral.",
    tags: ["Long Leverage", "Portfolio Hedge", "CDP Loop"] },
  { icon: Landmark,   title: "RWA Capital Access",
    body: "Institutions tokenize T-Bills or real-estate debt, deposit as USDAX collateral, and access DeFi liquidity without liquidating underlying positions.",
    tags: ["T-Bill Liquidity", "RE Debt Capital", "Institutional"] },
  { icon: Package,    title: "Protocol Treasury",
    body: "DAOs and on-chain treasuries use USDAX as a stable store of value and operational currency — backed by protocol-owned collateral vaults.",
    tags: ["DAO Treasury", "Protocol Owned", "On-chain Ops"] },
  { icon: BarChart3,  title: "Stablecoin Arbitrage",
    body: "Automated bots maintain the $1.00 peg by arbitraging USDAX across DEX pools — earning profit while contributing to price stability.",
    tags: ["Peg Maintenance", "MEV", "Arbitrage Bots"] },
];

function UseCases() {
  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <LBracket color={`${LIME}18`} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            USDAX In Use
          </span>
        </div>
        <h2 className="font-black text-lg uppercase tracking-tight mb-4" style={{ color: "hsl(0 0% 90%)" }}>
          What People Build with USDAX
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div key={uc.title} className="relative rounded-xl p-4 overflow-hidden transition-all group"
                style={{ background: CARD2, border: `1px solid ${BORDER}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${LIME}22`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
                <LBracket size={7} color={`${LIME}15`} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${LIME}10`, border: `1px solid ${LIME}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: LIME }} />
                  </div>
                  <div className="font-black text-[12px]" style={{ color: "hsl(0 0% 86%)" }}>{uc.title}</div>
                </div>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(0 0% 36%)" }}>{uc.body}</p>
                <div className="flex flex-wrap gap-1">
                  {uc.tags.map((t) => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${LIME}08`, color: `${LIME}99`, border: `1px solid ${LIME}15` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Risk Params Table — values match LIQ_THRESHOLDS in api-server/src/lib/prices.ts */
const RISK_ROWS = [
  // ── Crypto ──
  { asset: "WETH",   type: "Crypto", ltv: "75%", liq: "80%", bonus: "10%", ceil: "$20M", oracle: "Chainlink + Pyth"     },
  { asset: "WBTC",   type: "Crypto", ltv: "65%", liq: "75%", bonus: "10%", ceil: "$15M", oracle: "Chainlink + Pyth"     },
  { asset: "stETH",  type: "Yield",  ltv: "63%", liq: "68%", bonus: "10%", ceil: "$10M", oracle: "Chainlink + Lido"     },
  // ── RWA ──
  { asset: "RWA-TB", type: "RWA",    ltv: "92%", liq: "95%", bonus: "5%",  ceil: "$50M", oracle: "Ondo Daily NAV"      },
  { asset: "RWA-RE", type: "RWA",    ltv: "68%", liq: "73%", bonus: "8%",  ceil: "$25M", oracle: "Centrifuge Feed"     },
  { asset: "RWA-CB", type: "RWA",    ltv: "78%", liq: "83%", bonus: "7%",  ceil: "$30M", oracle: "Maple Monthly"       },
  // ── Robinhood Chain Stock Tokens ──
  { asset: "TSLA",   type: "Stock",  ltv: "65%", liq: "67%", bonus: "10%", ceil: "$5M",  oracle: "Robinhood Price Feed" },
  { asset: "AMZN",   type: "Stock",  ltv: "70%", liq: "72%", bonus: "10%", ceil: "$5M",  oracle: "Robinhood Price Feed" },
  { asset: "PLTR",   type: "Stock",  ltv: "60%", liq: "63%", bonus: "10%", ceil: "$3M",  oracle: "Robinhood Price Feed" },
  { asset: "NFLX",   type: "Stock",  ltv: "67%", liq: "70%", bonus: "10%", ceil: "$5M",  oracle: "Robinhood Price Feed" },
  { asset: "AMD",    type: "Stock",  ltv: "65%", liq: "68%", bonus: "10%", ceil: "$5M",  oracle: "Robinhood Price Feed" },
  { asset: "NVDA",   type: "Stock",  ltv: "70%", liq: "72%", bonus: "10%", ceil: "$5M",  oracle: "Robinhood Price Feed" },
  { asset: "AAPL",   type: "Stock",  ltv: "72%", liq: "75%", bonus: "10%", ceil: "$5M",  oracle: "Robinhood Price Feed" },
];

function RiskParams() {
  const typeColor: Record<string, string> = { Crypto: INDIGO, Yield: EMERALD, RWA: LIME, Stock: ROSE };
  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <LBracket color={`${AMBER}18`} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER }} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            Risk Framework
          </span>
        </div>
        <h2 className="font-black text-lg uppercase tracking-tight mb-4" style={{ color: "hsl(0 0% 90%)" }}>
          Protocol Safety Parameters
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Asset", "Type", "Max LTV", "Liq. Threshold", "Liq. Bonus", "Debt Ceiling", "Oracle"].map((h) => (
                  <th key={h} className="text-left pb-3 pr-4 font-mono text-[10px] tracking-widest uppercase"
                    style={{ color: "hsl(0 0% 28%)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_ROWS.map((row) => {
                const tc = typeColor[row.type] ?? LIME;
                return (
                  <tr key={row.asset} style={{ borderBottom: `1px solid ${BORDER}` }}
                    className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-2.5 pr-4 font-black font-mono" style={{ color: "hsl(0 0% 84%)" }}>{row.asset}</td>
                    <td className="py-2.5 pr-4">
                      <Tag color={tc}>{row.type}</Tag>
                    </td>
                    <td className="py-2.5 pr-4 font-mono font-black" style={{ color: LIME }}>{row.ltv}</td>
                    <td className="py-2.5 pr-4 font-mono font-bold" style={{ color: AMBER }}>{row.liq}</td>
                    <td className="py-2.5 pr-4 font-mono" style={{ color: EMERALD }}>{row.bonus}</td>
                    <td className="py-2.5 pr-4 font-mono" style={{ color: "hsl(0 0% 50%)" }}>{row.ceil}</td>
                    <td className="py-2.5 font-mono text-[10px]" style={{ color: "hsl(0 0% 34%)" }}>{row.oracle}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: CARD2, border: `1px solid ${LIME}15` }}>
          <div>
            <div className="font-black text-[13px]" style={{ color: "hsl(0 0% 84%)" }}>Ready to open a vault?</div>
            <div className="font-mono text-[11px]" style={{ color: "hsl(0 0% 32%)" }}>
              Deposit collateral and mint USDAX in seconds.
            </div>
          </div>
          <Link href="/app/positions">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[12px] transition-all"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${LIME}25`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              Go to Vaults <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ROOT */
export default function Nexus() {
  const { data: stats }      = useGetProtocolStats();
  const { data: collateral } = useGetCollateralBreakdown();

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-4">
      <Hero stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-[600px]">
        <div className="lg:col-span-2 h-full"><MintFlow /></div>
        <div className="lg:col-span-3 h-full"><CollateralMatrix live={collateral ?? []} /></div>
      </div>

      <PegMechanics />
      <RWADeepDive />
      <UseCases />
      <RiskParams />
    </div>
  );
}
