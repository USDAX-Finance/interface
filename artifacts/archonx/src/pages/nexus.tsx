import { Link } from "wouter";
import { useGetCollateralBreakdown, useGetProtocolStats } from "@workspace/api-client-react";
import {
  Zap, Lock, RefreshCw, TrendingUp, Coins,
  Globe, Shield, Landmark, Building2, FileText,
  BarChart3, ArrowRight, Check, Package, ChevronRight,
} from "lucide-react";
import { formatCurrency, formatNumber, formatCompact } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─── Design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const INDIGO  = "hsl(231 92% 72%)";
const VIOLET  = "hsl(280 70% 65%)";
const BLUE    = "hsl(200 80% 55%)";
const ROSE    = "hsl(346 84% 61%)";
const BORDER  = "hsl(0 0% 11%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 8%)";
const MUTED   = "hsl(0 0% 40%)";
const DIM     = "hsl(0 0% 28%)";

/* ─── Atoms ─── */
function SectionLabel({ children, color = LIME }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: DIM }}>
        {children}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-black text-2xl md:text-3xl uppercase tracking-tight mb-2"
      style={{ color: "hsl(0 0% 92%)" }}>
      {children}
    </h2>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: `${color}14`, color, border: `1px solid ${color}25` }}>
      {children}
    </span>
  );
}

/* ─── Collateral config ─── */
type CollCfg = {
  symbol?: string;
  icon?: LucideIcon;
  logoUrl?: string;
  ltv: number;
  liqThreshold: number;
  type: "crypto" | "yield" | "rwa" | "stock";
  color: string;
  badge: string;
  desc: string;
  oracle: string;
  ceil: string;
  live?: boolean;
};

const COLL: Record<string, CollCfg> = {
  WETH:     { logoUrl: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
               ltv: 75, liqThreshold: 80, type: "crypto", color: INDIGO, badge: "Core Crypto",
               desc: "Wrapped Ether. Most liquid EVM asset with deep Chainlink + Pyth oracle coverage.",
               oracle: "Chainlink + Pyth", ceil: "$20M", live: true },
  WBTC:     { logoUrl: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
               ltv: 65, liqThreshold: 70, type: "crypto", color: AMBER, badge: "Core Crypto",
               desc: "Wrapped Bitcoin. Highest market-cap crypto, accepted at conservative LTV.",
               oracle: "Chainlink + Pyth", ceil: "$15M", live: true },
  stETH:    { logoUrl: "https://assets.coingecko.com/coins/images/13442/small/steth_logo.png",
               ltv: 63, liqThreshold: 68, type: "yield", color: EMERALD, badge: "Yield-bearing",
               desc: "Lido staked ETH. Yield-bearing collateral, accrued rewards reduce effective borrow cost.",
               oracle: "Chainlink + Lido", ceil: "$10M", live: true },
  "RWA-TB": { icon: Landmark,  ltv: 92, liqThreshold: 95, type: "rwa", color: LIME, badge: "T-Bills",
               desc: "Tokenized US Treasury Bills via Ondo Finance. Daily NAV by BigFour auditors.",
               oracle: "Ondo Daily NAV", ceil: "$50M" },
  "RWA-RE": { icon: Building2, ltv: 68, liqThreshold: 73, type: "rwa", color: VIOLET, badge: "Real Estate",
               desc: "Tokenized first-lien commercial real estate senior debt via Centrifuge.",
               oracle: "Centrifuge Feed", ceil: "$25M" },
  "RWA-CB": { icon: FileText,  ltv: 78, liqThreshold: 83, type: "rwa", color: BLUE, badge: "Corp. Bonds",
               desc: "Tokenized investment-grade corporate bonds via Maple Finance.",
               oracle: "Maple Monthly", ceil: "$30M" },
  TSLA:     { logoUrl: "https://logo.clearbit.com/tesla.com",
               ltv: 60, liqThreshold: 67, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "Tesla Inc. tokenized equity on Robinhood Chain.", oracle: "Robinhood Oracle", ceil: "$10M" },
  AMZN:     { logoUrl: "https://logo.clearbit.com/amazon.com",
               ltv: 65, liqThreshold: 72, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "Amazon.com Inc. tokenized equity.", oracle: "Robinhood Oracle", ceil: "$10M" },
  PLTR:     { logoUrl: "https://logo.clearbit.com/palantir.com",
               ltv: 55, liqThreshold: 63, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "Palantir Technologies. Conservative LTV reflects higher volatility.", oracle: "Robinhood Oracle", ceil: "$5M" },
  NFLX:     { logoUrl: "https://logo.clearbit.com/netflix.com",
               ltv: 63, liqThreshold: 70, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "Netflix Inc. tokenized equity.", oracle: "Robinhood Oracle", ceil: "$8M" },
  AMD:      { logoUrl: "https://logo.clearbit.com/amd.com",
               ltv: 62, liqThreshold: 68, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "Advanced Micro Devices. Semiconductor leader in CPU & GPU.", oracle: "Robinhood Oracle", ceil: "$8M" },
  NVDA:     { logoUrl: "https://logo.clearbit.com/nvidia.com",
               ltv: 65, liqThreshold: 72, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "NVIDIA Corp. Dominant AI/GPU chipmaker.", oracle: "Robinhood Oracle", ceil: "$10M" },
  AAPL:     { logoUrl: "https://logo.clearbit.com/apple.com",
               ltv: 68, liqThreshold: 75, type: "stock", color: ROSE, badge: "Stock Token",
               desc: "Apple Inc. Highest market-cap stock, most stable token, highest LTV.", oracle: "Robinhood Oracle", ceil: "$12M" },
};

function TokenIcon({ sym, cfg }: { sym: string; cfg: CollCfg }) {
  const Icon = cfg.icon;
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ background: `${cfg.color}14`, border: `1.5px solid ${cfg.color}28` }}>
      {cfg.logoUrl
        ? <img src={cfg.logoUrl} alt={sym} className="w-5 h-5 object-contain rounded-full"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        : Icon
          ? <Icon style={{ color: cfg.color, width: 16, height: 16 }} />
          : <span className="font-black text-sm font-mono" style={{ color: cfg.color }}>{sym[0]}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 1 — HERO
══════════════════════════════════════════════════════════════ */
function Hero({ stats }: { stats: any }) {
  const tvl    = stats ? formatCompact(stats.tvlUsd)                       : "-";
  const supply = stats ? formatCompact(stats.usdaxSupply)                   : "-";
  const ratio  = stats ? `${formatNumber(stats.collateralRatio * 100, 0)}%` : "-";
  const cr     = stats?.collateralRatio ?? 0;
  const crColor = cr >= 2 ? LIME : cr >= 1.5 ? EMERALD : AMBER;

  return (
    <div className="pt-2 pb-6">
      <SectionLabel>USDAX Finance · Protocol</SectionLabel>
      <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight mb-3">
        USDAX <span style={{ color: LIME }}>Protocol</span>
      </h1>
      <p className="text-base leading-relaxed mb-8 max-w-2xl" style={{ color: MUTED }}>
        The CDP engine powering USDAX, a dollar-pegged stablecoin overcollateralized by
        battle-tested crypto assets and real-world assets on Robinhood Chain.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Collateral Locked", val: tvl,    color: LIME,    sub: "Across all active vaults" },
          { label: "USDAX in Circulation",    val: supply, color: EMERALD, sub: "Active minted supply"      },
          { label: "Collateral Ratio",        val: ratio,  color: crColor, sub: "Protocol-wide average"    },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl px-6 py-5"
            style={{ background: CARD, border: `1px solid ${s.color}18` }}>
            <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: DIM }}>
              {s.label}
            </div>
            <div className="font-black text-3xl font-mono mb-1" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[12px]" style={{ color: DIM }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 2 — HOW IT WORKS (Mint Flow)
══════════════════════════════════════════════════════════════ */
const FLOW_STEPS = [
  { n: "01", icon: Coins,      title: "Deposit Collateral",
    body: "Lock WETH, WBTC, stETH, RWA tokens, or Robinhood Chain Stock Tokens into a USDAX Vault on Robinhood Chain (EVM 46630)." },
  { n: "02", icon: Lock,       title: "Open CDP Vault",
    body: "The Vault Manager creates a Collateralized Debt Position (CDP) tracking your deposit and outstanding USDAX debt." },
  { n: "03", icon: Zap,        title: "Mint USDAX",
    body: "Borrow USDAX up to your LTV ceiling. A 0.5% one-time mint fee applies." },
  { n: "04", icon: TrendingUp, title: "Deploy Capital",
    body: "Use USDAX in DeFi pools, yield strategies, cross-chain payments, or hold a dollar-stable position." },
  { n: "05", icon: RefreshCw,  title: "Repay & Reclaim",
    body: "Return USDAX plus accrued fees at any time to unlock and withdraw collateral. No lock periods." },
];

function HowItWorks() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${LIME}18` }}>
      {/* Top accent */}
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${LIME}60, transparent)` }} />

      <div className="p-6 md:p-8">
        <SectionLabel color={LIME}>Minting Flow</SectionLabel>
        <SectionTitle>How USDAX is Created</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-8" style={{ color: MUTED }}>
          Five deterministic steps from collateral deposit to USDAX in your wallet. No custodians, no intermediaries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 relative">
          {/* Connector line on desktop */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${LIME}25, transparent)` }} />

          {FLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="flex md:flex-col gap-4 md:gap-3 md:items-center md:text-center p-4 md:p-3 relative">
                {/* Icon */}
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center relative z-10"
                  style={{ background: `${LIME}12`, border: `1.5px solid ${LIME}30` }}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: LIME }} />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center
                    font-mono text-[9px] font-black"
                    style={{ background: "hsl(0 0% 4%)", color: `${LIME}90`, border: `1px solid ${LIME}30` }}>
                    {step.n}
                  </span>
                </div>
                {/* Text */}
                <div>
                  <div className="font-black text-[14px] mb-1" style={{ color: "hsl(0 0% 88%)" }}>{step.title}</div>
                  <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          <Link href="/app/positions">
            <button className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-[14px] transition-all"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${LIME}30`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              <Zap className="w-4 h-4" /> Open a Vault and Mint USDAX
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 3 — COLLATERAL MATRIX
══════════════════════════════════════════════════════════════ */
function CollateralMatrix({ live }: { live: any[] }) {
  const liveMap: Record<string, { amount: number; valueUsd: number }> = {};
  live?.forEach((c) => { liveMap[c.symbol] = { amount: c.amountLocked, valueUsd: c.valueUsd }; });

  const typeColor: Record<string, string> = { crypto: INDIGO, yield: EMERALD, rwa: LIME, stock: ROSE };
  const typeLabel: Record<string, string> = { crypto: "Crypto", yield: "Yield-bearing", rwa: "RWA", stock: "Stock Token" };

  // Group by type
  const groups: Record<string, [string, CollCfg][]> = { crypto: [], yield: [], rwa: [], stock: [] };
  Object.entries(COLL).forEach(([sym, cfg]) => { groups[cfg.type].push([sym, cfg]); });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${EMERALD}50, ${LIME}20, transparent)` }} />

      <div className="p-6 md:p-8">
        <SectionLabel color={EMERALD}>Accepted Collateral</SectionLabel>
        <SectionTitle>Collateral Matrix</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-8" style={{ color: MUTED }}>
          13 asset types across crypto, yield-bearing, real-world assets, and Robinhood Chain stock tokens.
          Each asset has independent LTV, liquidation threshold, and debt ceiling parameters.
        </p>

        <div className="space-y-6">
          {Object.entries(groups).map(([type, entries]) => {
            if (!entries.length) return null;
            const tc = typeColor[type];
            const tl = typeLabel[type];
            return (
              <div key={type}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-3">
                  <Badge color={tc}>{tl}</Badge>
                  <div className="flex-1 h-px" style={{ background: BORDER }} />
                </div>

                {/* Token rows */}
                <div className="space-y-2">
                  {entries.map(([sym, cfg]) => {
                    const lv = liveMap[sym];
                    return (
                      <div key={sym}
                        className="rounded-xl transition-all group"
                        style={{ background: CARD2, border: `1px solid ${BORDER}` }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}28`; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>

                        <div className="grid items-center px-4 py-3 gap-4"
                          style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}>

                          {/* Icon + Symbol */}
                          <TokenIcon sym={sym} cfg={cfg} />

                          <div>
                            <div className="font-black text-[14px] font-mono" style={{ color: "hsl(0 0% 90%)" }}>
                              {sym}
                              {cfg.live && (
                                <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase"
                                  style={{ background: `${EMERALD}14`, color: EMERALD, border: `1px solid ${EMERALD}25` }}>
                                  Live
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: DIM }}>{cfg.oracle}</div>
                          </div>

                          {/* LTV */}
                          <div className="text-right hidden sm:block">
                            <div className="font-mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: DIM }}>Max LTV</div>
                            <div className="font-black text-[15px] font-mono" style={{ color: LIME }}>{cfg.ltv}%</div>
                          </div>

                          {/* Liq Threshold */}
                          <div className="text-right hidden md:block">
                            <div className="font-mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: DIM }}>Liq. Thresh.</div>
                            <div className="font-bold text-[14px] font-mono" style={{ color: AMBER }}>{cfg.liqThreshold}%</div>
                          </div>

                          {/* Live value or ceiling */}
                          <div className="text-right hidden lg:block min-w-[100px]">
                            {lv ? (
                              <>
                                <div className="font-mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: DIM }}>Deposited</div>
                                <div className="font-black text-[13px] font-mono" style={{ color: cfg.color }}>
                                  {formatCurrency(lv.valueUsd)}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-mono text-[10px] uppercase tracking-wider mb-0.5" style={{ color: DIM }}>Debt Ceiling</div>
                                <div className="font-mono text-[13px]" style={{ color: "hsl(0 0% 42%)" }}>{cfg.ceil}</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Hover desc */}
                        <div className="overflow-hidden max-h-0 group-hover:max-h-10 transition-all px-4">
                          <p className="text-[11px] pb-3" style={{ color: DIM }}>{cfg.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 4 — PEG MECHANICS
══════════════════════════════════════════════════════════════ */
function PegMechanics() {
  const mechanisms = [
    { icon: Check, title: "Redemption Floor",
      body: "Any holder can always redeem 1 USDAX for $1.00 of collateral at face value, creating a hard price floor that arbitrageurs enforce continuously." },
    { icon: Check, title: "Stability Fee Adjustment",
      body: "Rising stability fees disincentivize excess minting, naturally contracting USDAX supply when demand softens and peg drifts above $1." },
    { icon: Check, title: "DEX Arbitrage Bots",
      body: "Automated bots close any deviation by buying sub-$1 USDAX to redeem collateral at face value, earning instant profit while restoring peg." },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${EMERALD}18` }}>
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${EMERALD}55, transparent)` }} />

      <div className="p-6 md:p-8">
        <SectionLabel color={EMERALD}>Peg Stability</SectionLabel>
        <SectionTitle>How USDAX Stays at $1.00</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-8" style={{ color: MUTED }}>
          Three independent mechanisms maintain the dollar peg. No single point of failure; all three
          operate simultaneously and reinforce each other.
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Mechanism list */}
          <div className="space-y-5">
            {mechanisms.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: `${LIME}12`, border: `1.5px solid ${LIME}28` }}>
                    <Icon className="w-4 h-4" style={{ color: LIME }} />
                  </div>
                  <div>
                    <div className="font-black text-[15px] mb-1" style={{ color: "hsl(0 0% 88%)" }}>{m.title}</div>
                    <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live peg visual */}
          <div className="rounded-2xl p-6" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
            <div className="font-mono text-[11px] uppercase tracking-widest mb-5" style={{ color: DIM }}>
              Live Peg Status
            </div>
            <div className="text-center py-4">
              <div className="font-black font-mono mb-2" style={{ fontSize: 52, color: LIME, lineHeight: 1 }}>
                $1.0000
              </div>
              <div className="flex items-center justify-center gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: EMERALD }} />
                <span style={{ color: EMERALD }}>USDAX perfectly pegged</span>
              </div>
            </div>

            {/* Peg band */}
            <div className="mt-6 mb-5">
              <div className="flex justify-between font-mono text-[11px] mb-2" style={{ color: DIM }}>
                <span>$0.990</span><span>$1.000</span><span>$1.010</span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
                <div className="absolute inset-y-0 left-[30%] right-[30%]" style={{ background: `${LIME}20` }} />
                <div className="absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ background: LIME, boxShadow: `0 0 8px ${LIME}70` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Redemption", val: "Instant",     color: LIME    },
                { label: "Mint Fee",   val: "0.50%",       color: EMERALD },
                { label: "Stability",  val: "0.50% / yr",  color: LIME    },
                { label: "Peg Target", val: "$1.0000",     color: EMERALD },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl"
                  style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                  <div className="font-black text-[14px] font-mono mb-0.5" style={{ color: s.color }}>{s.val}</div>
                  <div className="font-mono text-[11px]" style={{ color: DIM }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 5 — RWA DEEP DIVE
══════════════════════════════════════════════════════════════ */
const RWA_PROVIDERS = [
  { icon: Landmark,  color: LIME,   name: "Ondo Finance",
    product: "OUSG: Tokenized US T-Bills", apy: "5.1%", ltv: "92%", scale: "$180M+",
    body: "Short-duration US Treasury exposure. Daily NAV attestation by BigFour auditors. Earn T-Bill yield while unlocking USDAX liquidity." },
  { icon: Building2, color: VIOLET, name: "Centrifuge",
    product: "Real Estate Senior Debt",     apy: "7–9%", ltv: "68%", scale: "$420M+",
    body: "First-lien commercial real estate mortgages by licensed lenders. Monthly cashflows verified on-chain. Conservative LTV vs crypto assets." },
  { icon: FileText,  color: BLUE,   name: "Maple Finance",
    product: "Corporate Credit Pool",       apy: "8–12%", ltv: "78%", scale: "$2B+",
    body: "Investment-grade corporate borrowers underwritten by Maple pool delegates. Quarterly price oracles. Institutional DeFi access." },
];

const RWA_FLOW = [
  "Real-World Asset",
  "Tokenization",
  "Governance Whitelist",
  "USDAX Vault Deposit",
  "USDAX Minted",
  "DeFi Deployment",
];

function RWADeepDive() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${LIME}15` }}>
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${LIME}55, ${LIME}15)` }} />

      <div className="p-6 md:p-8">
        <SectionLabel color={LIME}>RWA Integration</SectionLabel>
        <SectionTitle>Institutional Capital, DeFi Rails</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-8" style={{ color: MUTED }}>
          Real World Assets bring predictable off-chain yield into USDAX vaults. Each provider is
          governance-whitelisted, audited, and monitored by dedicated oracle feeds.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {RWA_PROVIDERS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className="rounded-xl p-5"
                style={{ background: CARD2, border: `1px solid ${p.color}18` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${p.color}12`, border: `1.5px solid ${p.color}28` }}>
                    <Icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <div>
                    <div className="font-black text-[14px]" style={{ color: "hsl(0 0% 90%)" }}>{p.name}</div>
                    <div className="text-[11px] font-mono" style={{ color: p.color }}>{p.product}</div>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed mb-4" style={{ color: MUTED }}>{p.body}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: "Yield", v: p.apy, c: p.color }, { l: "LTV", v: p.ltv, c: LIME }, { l: "Provider AUM", v: p.scale, c: EMERALD }].map((s) => (
                    <div key={s.l} className="text-center p-2.5 rounded-lg"
                      style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                      <div className="font-black text-[12px] font-mono" style={{ color: s.c }}>{s.v}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: DIM }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* RWA lifecycle */}
        <div className="rounded-xl p-5" style={{ background: CARD2, border: `1px solid ${LIME}15` }}>
          <div className="font-mono text-[11px] uppercase tracking-widest mb-4" style={{ color: DIM }}>
            RWA Lifecycle
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {RWA_FLOW.map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    background: i === arr.length - 1 ? `${LIME}12` : "hsl(0 0% 5%)",
                    border: `1px solid ${i === arr.length - 1 ? `${LIME}30` : BORDER}`,
                  }}>
                  <span className="font-mono text-[10px]" style={{ color: DIM }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium text-[12px]"
                    style={{ color: i === arr.length - 1 ? LIME : "hsl(0 0% 68%)" }}>
                    {step}
                  </span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(0 0% 22%)" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 6 — USE CASES
══════════════════════════════════════════════════════════════ */
const USE_CASES = [
  { icon: TrendingUp, title: "DeFi Yield Strategies",
    body: "Deposit USDAX into USDAX/USDC liquidity pools, lending protocols, or yield aggregators to earn trading fees on top of base collateral yield.",
    tags: ["AMM Liquidity", "Lending", "Yield Aggregation"] },
  { icon: Globe,      title: "Cross-Border Payments",
    body: "Send dollar-stable value globally via Robinhood Chain's sub-second finality. USDAX settles in ~1s with under $0.001 gas fees.",
    tags: ["Remittances", "B2B Settlements", "Payroll"] },
  { icon: Shield,     title: "Leverage and Hedging",
    body: "Mint USDAX against ETH, buy more ETH, re-deposit to build leveraged longs. Or hold USDAX to hedge drawdowns without selling collateral.",
    tags: ["Long Leverage", "Portfolio Hedge", "CDP Loop"] },
  { icon: Landmark,   title: "RWA Capital Access",
    body: "Institutions tokenize T-Bills or real estate debt, deposit as USDAX collateral, and access DeFi liquidity without liquidating underlying positions.",
    tags: ["T-Bill Liquidity", "RE Debt Capital", "Institutional"] },
  { icon: Package,    title: "Protocol Treasury",
    body: "DAOs and on-chain treasuries use USDAX as stable operational currency, backed by protocol-owned collateral vaults.",
    tags: ["DAO Treasury", "Protocol Owned", "On-chain Ops"] },
  { icon: BarChart3,  title: "Stablecoin Arbitrage",
    body: "Automated bots maintain the $1.00 peg by arbitraging USDAX across DEX pools, earning profit while contributing to price stability.",
    tags: ["Peg Maintenance", "MEV", "Arbitrage Bots"] },
];

function UseCases() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel color={LIME}>USDAX In Use</SectionLabel>
        <SectionTitle>What People Build with USDAX</SectionTitle>
        <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>
          From DeFi strategies to institutional capital access. USDAX is programmable money.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          return (
            <div key={uc.title}
              className="rounded-2xl p-5 transition-all group"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${LIME}22`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${LIME}10`, border: `1px solid ${LIME}20` }}>
                  <Icon className="w-4 h-4" style={{ color: LIME }} />
                </div>
                <div className="font-black text-[14px]" style={{ color: "hsl(0 0% 90%)" }}>{uc.title}</div>
              </div>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: MUTED }}>{uc.body}</p>
              <div className="flex flex-wrap gap-1.5">
                {uc.tags.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: `${LIME}08`, color: `${LIME}88`, border: `1px solid ${LIME}14` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 7 — RISK PARAMETERS
══════════════════════════════════════════════════════════════ */
const RISK_ROWS = [
  { asset: "WETH",   type: "Crypto", ltv: "75%", liq: "80%", bonus: "5%",  ceil: "$20M", oracle: "Chainlink + Pyth",      live: true },
  { asset: "WBTC",   type: "Crypto", ltv: "65%", liq: "75%", bonus: "5%",  ceil: "$15M", oracle: "Chainlink + Pyth",      live: true },
  { asset: "stETH",  type: "Yield",  ltv: "63%", liq: "68%", bonus: "5%",  ceil: "$10M", oracle: "Chainlink + Lido",      live: true },
  { asset: "RWA-TB", type: "RWA",    ltv: "92%", liq: "95%", bonus: "3%",  ceil: "$50M", oracle: "Ondo Daily NAV",        live: false },
  { asset: "RWA-RE", type: "RWA",    ltv: "68%", liq: "73%", bonus: "5%",  ceil: "$25M", oracle: "Centrifuge Feed",       live: false },
  { asset: "RWA-CB", type: "RWA",    ltv: "78%", liq: "83%", bonus: "5%",  ceil: "$30M", oracle: "Maple Monthly",         live: false },
  { asset: "TSLA",   type: "Stock",  ltv: "60%", liq: "67%", bonus: "8%",  ceil: "$10M", oracle: "Robinhood Price Feed",  live: false },
  { asset: "AMZN",   type: "Stock",  ltv: "65%", liq: "72%", bonus: "8%",  ceil: "$10M", oracle: "Robinhood Price Feed",  live: false },
  { asset: "PLTR",   type: "Stock",  ltv: "55%", liq: "63%", bonus: "8%",  ceil: "$5M",  oracle: "Robinhood Price Feed",  live: false },
  { asset: "NFLX",   type: "Stock",  ltv: "63%", liq: "70%", bonus: "8%",  ceil: "$8M",  oracle: "Robinhood Price Feed",  live: false },
  { asset: "AMD",    type: "Stock",  ltv: "62%", liq: "68%", bonus: "8%",  ceil: "$8M",  oracle: "Robinhood Price Feed",  live: false },
  { asset: "NVDA",   type: "Stock",  ltv: "65%", liq: "72%", bonus: "8%",  ceil: "$10M", oracle: "Robinhood Price Feed",  live: false },
  { asset: "AAPL",   type: "Stock",  ltv: "68%", liq: "75%", bonus: "8%",  ceil: "$12M", oracle: "Robinhood Price Feed",  live: false },
];

function RiskParams() {
  const typeColor: Record<string, string> = {
    Crypto: INDIGO, Yield: EMERALD, RWA: LIME, Stock: ROSE,
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="h-px" style={{ background: `linear-gradient(90deg, ${AMBER}45, transparent)` }} />

      <div className="p-6 md:p-8">
        <SectionLabel color={AMBER}>Risk Framework</SectionLabel>
        <SectionTitle>Protocol Safety Parameters</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-8" style={{ color: MUTED }}>
          Independent risk parameters per collateral type. LTV caps prevent over-leverage,
          liquidation thresholds protect protocol solvency, and debt ceilings limit concentration risk.
        </p>

        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: CARD2, borderBottom: `1px solid ${BORDER}` }}>
                {["Asset", "Type", "Max LTV", "Liq. Threshold", "Liq. Bonus", "Debt Ceiling", "Oracle"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[11px] tracking-wider uppercase"
                    style={{ color: DIM }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_ROWS.map((row, i) => {
                const tc = typeColor[row.type] ?? LIME;
                return (
                  <tr key={row.asset}
                    className="transition-colors hover:bg-white/[0.015]"
                    style={{ borderBottom: i < RISK_ROWS.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black font-mono text-[13px]" style={{ color: "hsl(0 0% 88%)" }}>
                          {row.asset}
                        </span>
                        {row.live && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase"
                            style={{ background: `${EMERALD}12`, color: EMERALD, border: `1px solid ${EMERALD}22` }}>
                            Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge color={tc}>{row.type}</Badge></td>
                    <td className="px-4 py-3 font-mono font-black text-[14px]" style={{ color: LIME }}>{row.ltv}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[13px]" style={{ color: AMBER }}>{row.liq}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: EMERALD }}>{row.bonus}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: MUTED }}>{row.ceil}</td>
                    <td className="px-4 py-3 font-mono text-[11px]" style={{ color: DIM }}>{row.oracle}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
          rounded-xl px-5 py-4" style={{ background: CARD2, border: `1px solid ${LIME}15` }}>
          <div>
            <div className="font-black text-[15px] mb-1" style={{ color: "hsl(0 0% 88%)" }}>
              Ready to open a vault?
            </div>
            <div className="text-[13px]" style={{ color: MUTED }}>
              Deposit collateral and mint USDAX in seconds on Robinhood Chain.
            </div>
          </div>
          <Link href="/app/positions">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[13px] transition-all flex-shrink-0"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${LIME}28`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              Go to Vaults <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
export default function Nexus() {
  const { data: stats }      = useGetProtocolStats();
  const { data: collateral } = useGetCollateralBreakdown();

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-8">
      <Hero stats={stats} />
      <HowItWorks />
      <CollateralMatrix live={collateral ?? []} />
      <PegMechanics />
      <RWADeepDive />
      <UseCases />
      <RiskParams />
    </div>
  );
}
