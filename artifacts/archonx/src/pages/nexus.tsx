import { Link } from "wouter";
import { useGetCollateralBreakdown, useGetProtocolStats } from "@workspace/api-client-react";
import {
  ArrowRight, ChevronRight, Zap, Shield, Globe, Coins,
  TrendingUp, Lock, RefreshCw, Building2, FileText,
  Landmark, Package, BarChart3, ArrowDown, Layers,
  Check, AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

/* ─── tokens ─── */
const LIME     = "hsl(79 100% 57%)";
const LIME_DIM = "hsl(79 100% 57% / 0.08)";
const LIME_BDR = "hsl(79 100% 57% / 0.18)";
const EMERALD  = "hsl(152 70% 48%)";
const AMBER    = "hsl(35 92% 60%)";
const RED      = "hsl(0 84% 60%)";
const BORDER   = "hsl(0 0% 10%)";
const CARD_BG  = "hsl(0 0% 6%)";
const CARD_BG2 = "hsl(0 0% 8%)";
const BG       = "hsl(0 0% 4%)";

/* ─── atoms ─── */
function LBracket({ size = 10, color = `${LIME}25` }: { size?: number; color?: string }) {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
        {children}
      </span>
    </div>
  );
}

function Panel({ children, className = "", accent }: {
  children: React.ReactNode; className?: string; accent?: string;
}) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ background: CARD_BG, border: `1px solid ${accent ? `${accent}22` : BORDER}` }}>
      {accent && <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `${accent}55` }} />}
      {children}
    </div>
  );
}

/* ─── Collateral tile data ─── */
const COLLATERAL_CONFIG: Record<string, {
  icon: string; ltv: number; type: "crypto" | "rwa";
  desc: string; color: string; badge: string;
}> = {
  WETH: {
    icon: "Ξ", ltv: 75, type: "crypto",
    desc: "Wrapped Ether — the most liquid EVM asset. Deep oracle coverage on Robinhood Chain.",
    color: "hsl(231 92% 72%)", badge: "Core",
  },
  WBTC: {
    icon: "₿", ltv: 65, type: "crypto",
    desc: "Wrapped Bitcoin. Highest market-cap crypto, accepted at conservative LTV for safety.",
    color: AMBER, badge: "Core",
  },
  stETH: {
    icon: "⟠", ltv: 63, type: "crypto",
    desc: "Lido staked ETH. Yield-bearing collateral — accrued staking rewards reduce effective borrow cost.",
    color: EMERALD, badge: "Yield-bearing",
  },
  "RWA-TB": {
    icon: "🏛", ltv: 92, type: "rwa",
    desc: "Tokenized US Treasury Bills via Ondo Finance. Near-risk-free, highest LTV in the protocol.",
    color: LIME, badge: "RWA · T-Bills",
  },
  "RWA-RE": {
    icon: "🏢", ltv: 68, type: "rwa",
    desc: "Tokenized real-estate senior debt via Centrifuge. Backed by first-lien commercial mortgages.",
    color: "hsl(280 70% 65%)", badge: "RWA · Real Estate",
  },
  "RWA-CB": {
    icon: "📄", ltv: 78, type: "rwa",
    desc: "Tokenized investment-grade corporate bonds via Maple Finance. Monthly oracle price feeds.",
    color: "hsl(200 80% 55%)", badge: "RWA · Corp. Bonds",
  },
};

/* ─────────────────── SECTIONS ─────────────────── */

function Hero({ stats }: { stats: any }) {
  const tvl = stats ? formatCurrency(stats.tvlUsd) : "—";
  const supply = stats ? formatNumber(stats.usdaxSupply, 0) : "—";
  const ratio = stats ? `${formatNumber(stats.collateralRatio * 100, 0)}%` : "—";

  return (
    <div className="relative pb-6 overflow-hidden">
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.018) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.018) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <SectionLabel>USDEX Finance · Protocol Nexus</SectionLabel>
      <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight mb-2">
        USDAX <span style={{ color: LIME }}>Nexus</span>
      </h1>
      <p className="text-sm mb-6 max-w-xl" style={{ color: "hsl(0 0% 40%)" }}>
        The engine behind USDAX — a dollar-pegged stablecoin overcollateralised by crypto assets
        and real-world assets (RWA). Deposit collateral, mint USDAX, deploy capital.
      </p>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Collateral Locked", val: tvl,    accent: LIME    },
          { label: "USDAX in Circulation",    val: supply, accent: EMERALD },
          { label: "Avg. Collateral Ratio",   val: ratio,  accent: AMBER   },
        ].map((s) => (
          <div key={s.label} className="relative rounded-xl px-4 py-3 overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <LBracket size={8} color={`${s.accent}25`} />
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>{s.label}</div>
            <div className="font-black text-xl font-mono" style={{ color: s.accent }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Mint Flow ─── */
const FLOW_STEPS = [
  {
    n: "01", icon: Coins,     color: LIME,
    title: "Deposit Collateral",
    body:  "Lock WETH, WBTC, stETH or RWA tokens into a USDAX Vault smart contract on Robinhood Chain (EVM 46630).",
  },
  {
    n: "02", icon: Lock,      color: LIME,
    title: "Open CDP Vault",
    body:  "The Vault Manager creates a Collateralised Debt Position (CDP) tracking your deposit and outstanding USDAX debt.",
  },
  {
    n: "03", icon: Zap,       color: LIME,
    title: "Mint USDAX",
    body:  "Borrow USDAX up to your collateral's LTV ceiling. A 0.1% mint fee and 0.5%/yr stability fee apply.",
  },
  {
    n: "04", icon: TrendingUp, color: LIME,
    title: "Deploy Capital",
    body:  "Use USDAX in DeFi — liquidity pools, yield strategies, cross-chain payments, or simply hold a dollar-stable position.",
  },
  {
    n: "05", icon: RefreshCw,  color: LIME,
    title: "Repay & Reclaim",
    body:  "Return USDAX + accrued stability fees at any time to unlock and withdraw your original collateral, with no lock periods.",
  },
];

function MintFlow() {
  return (
    <Panel className="p-5">
      <LBracket color={`${LIME}22`} />
      <SectionLabel>Minting Flow</SectionLabel>
      <h2 className="font-black text-xl uppercase tracking-tight mb-5" style={{ color: "hsl(0 0% 90%)" }}>
        How USDAX is Created
      </h2>

      <div className="space-y-0">
        {FLOW_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === FLOW_STEPS.length - 1;
          return (
            <div key={step.n} className="flex gap-4">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center z-10"
                  style={{ background: `${LIME}14`, border: `1.5px solid ${LIME}35` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: LIME }} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 my-1" style={{ background: `${LIME}18`, minHeight: 20 }} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isLast ? "" : ""}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: `${LIME}60` }}>{step.n}</span>
                  <span className="font-black text-[13px]" style={{ color: "hsl(0 0% 86%)" }}>{step.title}</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{step.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/app/positions">
        <button className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-sm transition-all"
          style={{ background: LIME, color: "hsl(0 0% 4%)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${LIME}30`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
          <Zap className="w-4 h-4" /> Open a Vault & Mint USDAX
        </button>
      </Link>
    </Panel>
  );
}

/* ─── Collateral Matrix ─── */
function CollateralMatrix({ live }: { live: any[] }) {
  const liveBySymbol: Record<string, { amount: number; valueUsd: number }> = {};
  live?.forEach((c) => { liveBySymbol[c.symbol] = { amount: c.amount, valueUsd: c.valueUsd }; });

  const cryptoAssets = Object.entries(COLLATERAL_CONFIG).filter(([, v]) => v.type === "crypto");
  const rwaAssets    = Object.entries(COLLATERAL_CONFIG).filter(([, v]) => v.type === "rwa");

  function AssetCard([sym, cfg]: [string, typeof COLLATERAL_CONFIG[string]]) {
    const liveData = liveBySymbol[sym];
    return (
      <div key={sym} className="relative rounded-xl p-4 overflow-hidden"
        style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}>
        <LBracket size={8} color={`${cfg.color}25`} />

        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0"
              style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}25`, color: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <div className="font-black text-[14px]" style={{ color: "hsl(0 0% 86%)" }}>{sym}</div>
              <div className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}22` }}>
                {cfg.badge}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-sm" style={{ color: cfg.color }}>{cfg.ltv}%</div>
            <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>Max LTV</div>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(0 0% 38%)" }}>{cfg.desc}</p>

        {/* Live stats if available */}
        {liveData && (
          <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div>
              <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>Deposited</div>
              <div className="font-black text-[12px] font-mono" style={{ color: "hsl(0 0% 72%)" }}>
                {formatNumber(liveData.amount, 2)} {sym}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>Value (USD)</div>
              <div className="font-black text-[12px] font-mono" style={{ color: cfg.color }}>
                {formatCurrency(liveData.valueUsd)}
              </div>
            </div>
          </div>
        )}
        {!liveData && (
          <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER }} />
            <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 30%)" }}>Onboarding Q3 2026</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Crypto collateral */}
      <Panel className="p-5">
        <LBracket color={`${EMERALD}22`} />
        <SectionLabel>Crypto-Native Collateral</SectionLabel>
        <h2 className="font-black text-lg uppercase tracking-tight mb-4" style={{ color: "hsl(0 0% 90%)" }}>
          Battle-Tested Assets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cryptoAssets.map(AssetCard)}
        </div>
      </Panel>

      {/* RWA collateral */}
      <Panel className="p-5" accent={LIME}>
        <LBracket color={`${LIME}25`} />
        <SectionLabel>Real World Assets · RWA</SectionLabel>
        <h2 className="font-black text-lg uppercase tracking-tight mb-2" style={{ color: "hsl(0 0% 90%)" }}>
          Off-Chain Yield, On-Chain Trust
        </h2>
        <p className="text-[12px] leading-relaxed mb-4 max-w-2xl" style={{ color: "hsl(0 0% 38%)" }}>
          USDAX accepts tokenized real-world assets as collateral — allowing institutional-grade capital
          to flow into DeFi while maintaining strict on-chain overcollateralisation. Each RWA type
          uses a dedicated oracle aggregator with daily price attestations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rwaAssets.map(AssetCard)}
        </div>
      </Panel>
    </div>
  );
}

/* ─── Use Cases ─── */
const USE_CASES = [
  {
    icon: TrendingUp, color: LIME,
    title: "DeFi Yield Strategies",
    body:  "Deposit USDAX into USDAX/USDC liquidity pools, lending protocols, or yield aggregators on Robinhood Chain. Earn trading fees on top of your collateral's yield.",
    tags: ["AMM Liquidity", "Lending", "Yield Aggregation"],
  },
  {
    icon: Globe, color: EMERALD,
    title: "Cross-Border Payments",
    body:  "Send dollar-stable value across borders instantly via Robinhood Chain's sub-second finality. USDAX settles in ~1 sec with <$0.001 gas fees.",
    tags: ["Remittances", "B2B Settlements", "Payroll"],
  },
  {
    icon: Shield, color: LIME,
    title: "Leverage & Hedging",
    body:  "Mint USDAX against ETH, buy more ETH, re-deposit — building leveraged long positions. Or hold USDAX to hedge portfolio drawdowns without selling collateral.",
    tags: ["Long Leverage", "Portfolio Hedge", "CDP Loop"],
  },
  {
    icon: Landmark, color: EMERALD,
    title: "RWA Capital Access",
    body:  "Institutions tokenize T-Bills or real-estate debt, deposit them as USDAX collateral, and access DeFi liquidity without liquidating underlying positions.",
    tags: ["T-Bill Liquidity", "RE Debt Capital", "Institutional"],
  },
  {
    icon: Package, color: LIME,
    title: "Protocol Treasury",
    body:  "DAOs and on-chain treasuries use USDAX as a stable store of value and operational currency — backed by protocol-owned collateral vaults.",
    tags: ["DAO Treasury", "Protocol Owned", "On-chain Ops"],
  },
  {
    icon: BarChart3, color: EMERALD,
    title: "Stablecoin Arbitrage",
    body:  "Automated bots maintain the $1.00 peg by arbitraging USDAX across DEX pools — earning profit while contributing to price stability.",
    tags: ["Peg Maintenance", "MEV", "Arbitrage Bots"],
  },
];

function UseCases() {
  return (
    <Panel className="p-5">
      <LBracket color={`${LIME}22`} />
      <SectionLabel>USDAX In Use</SectionLabel>
      <h2 className="font-black text-xl uppercase tracking-tight mb-5" style={{ color: "hsl(0 0% 90%)" }}>
        What People Build with USDAX
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          return (
            <div key={uc.title} className="relative rounded-xl p-4 overflow-hidden"
              style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}>
              <LBracket size={7} color={`${uc.color}20`} />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${uc.color}12`, border: `1px solid ${uc.color}22` }}>
                  <Icon className="w-3 h-3" style={{ color: uc.color }} />
                </div>
                <div className="font-black text-[12px]" style={{ color: "hsl(0 0% 84%)" }}>{uc.title}</div>
              </div>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(0 0% 38%)" }}>{uc.body}</p>
              <div className="flex flex-wrap gap-1.5">
                {uc.tags.map((t) => (
                  <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${uc.color}10`, color: `${uc.color}cc`, border: `1px solid ${uc.color}18` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ─── Peg Mechanics ─── */
function PegMechanics() {
  return (
    <Panel className="p-5" accent={EMERALD}>
      <LBracket color={`${EMERALD}22`} />
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <SectionLabel>Peg Stability</SectionLabel>
          <h2 className="font-black text-xl uppercase tracking-tight mb-3" style={{ color: "hsl(0 0% 90%)" }}>
            How USDAX Stays at $1.00
          </h2>
          <p className="text-[12px] leading-relaxed mb-4" style={{ color: "hsl(0 0% 38%)" }}>
            Three independent mechanisms enforce the dollar peg. Together they create
            strong arbitrage incentives that pull USDAX back to $1.00 within minutes of any deviation.
          </p>
          <div className="space-y-3">
            {[
              { icon: Check, color: LIME, title: "Redemption Mechanism",
                body: "Any USDAX holder can redeem 1 USDAX for $1.00 of collateral at face value, always. This creates a hard floor." },
              { icon: Check, color: LIME, title: "Stability Fee Pressure",
                body: "Rising stability fees disincentivise excessive USDAX minting, naturally contracting supply when demand softens." },
              { icon: Check, color: LIME, title: "DEX Arbitrage Bots",
                body: "Automated bots buy USDAX below $1.00 to redeem for $1.00 of collateral — or mint at $1.00 and sell above — closing any deviation." },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: `${m.color}14`, border: `1px solid ${m.color}25` }}>
                    <Icon className="w-2.5 h-2.5" style={{ color: m.color }} />
                  </div>
                  <div>
                    <div className="font-black text-[12px] mb-0.5" style={{ color: "hsl(0 0% 82%)" }}>{m.title}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{m.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peg status visual */}
        <div className="relative rounded-xl p-5 overflow-hidden" style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}>
          <LBracket size={9} color={`${EMERALD}30`} />
          <div className="font-mono text-[10px] tracking-widest uppercase mb-4" style={{ color: "hsl(0 0% 28%)" }}>
            Live Peg Status
          </div>

          {/* Big peg price */}
          <div className="text-center py-6">
            <div className="font-black text-5xl font-mono mb-1" style={{ color: LIME }}>$1.0000</div>
            <div className="text-[11px] font-mono" style={{ color: EMERALD }}>● USDAX perfectly pegged</div>
          </div>

          {/* Peg band viz */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: "hsl(0 0% 30%)" }}>
              <span>$0.990 lower bound</span>
              <span>$1.010 upper bound</span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
              <div className="absolute inset-y-0 left-[30%] right-[30%] rounded-full" style={{ background: `${LIME}25` }} />
              {/* Current price marker */}
              <div className="absolute top-0 bottom-0 w-0.5 rounded-full left-[50%] -translate-x-1/2"
                style={{ background: LIME }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "24h Deviation", val: "< 0.01%",  color: EMERALD },
              { label: "Redemptions",   val: "Instant",  color: LIME    },
              { label: "Oracle Feeds",  val: "4 sources",color: LIME    },
              { label: "Peg Uptime",    val: "99.98%",   color: EMERALD },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: "hsl(0 0% 7%)", border: `1px solid ${BORDER}` }}>
                <div className="font-black text-sm font-mono" style={{ color: s.color }}>{s.val}</div>
                <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 28%)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ─── RWA Deep Dive ─── */
const RWA_PROVIDERS = [
  {
    icon: Landmark, color: LIME,
    name: "Ondo Finance",
    product: "OUSG — Tokenized US T-Bills",
    apy: "5.1% base",
    ltv: "92%",
    tvl: "$180M+ on mainnet",
    body: "Short-duration US Treasury exposure. Daily NAV attestation by BigFour auditors. OUSG holders earn T-Bill yield while also unlocking USDAX liquidity via vaults.",
  },
  {
    icon: Building2, color: "hsl(280 70% 65%)",
    name: "Centrifuge",
    product: "Real Estate Senior Debt",
    apy: "7–9% base",
    ltv: "68%",
    tvl: "$420M+ originated",
    body: "First-lien commercial real estate mortgages originated by licensed lenders. Monthly cashflows verified on-chain. Conservative LTV due to lower liquidity vs. crypto.",
  },
  {
    icon: FileText, color: "hsl(200 80% 55%)",
    name: "Maple Finance",
    product: "Corporate Credit Pool",
    apy: "8–12% base",
    ltv: "78%",
    tvl: "$2B+ loans originated",
    body: "Investment-grade corporate borrowers, underwritten by Maple's pool delegates. Quarterly price oracles. Access institutional credit markets through a DeFi primitive.",
  },
];

function RWADeepDive() {
  return (
    <Panel className="p-5" accent={LIME}>
      <LBracket color={`${LIME}22`} />
      <SectionLabel>RWA Integration · Deep Dive</SectionLabel>
      <h2 className="font-black text-xl uppercase tracking-tight mb-2" style={{ color: "hsl(0 0% 90%)" }}>
        Institutional Capital, DeFi Rails
      </h2>
      <p className="text-[12px] leading-relaxed mb-6 max-w-2xl" style={{ color: "hsl(0 0% 38%)" }}>
        Real World Assets bring predictable, off-chain yield into USDAX vaults.
        Each provider is whitelisted through governance, audited, and monitored by dedicated oracle feeds.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {RWA_PROVIDERS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="relative rounded-xl p-4 overflow-hidden"
              style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}>
              <LBracket size={8} color={`${p.color}22`} />
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${p.color}14`, border: `1px solid ${p.color}22` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                </div>
                <div>
                  <div className="font-black text-[12px]" style={{ color: "hsl(0 0% 84%)" }}>{p.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: p.color }}>{p.product}</div>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(0 0% 38%)" }}>{p.body}</p>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { l: "Yield", v: p.apy, c: p.color   },
                  { l: "LTV",   v: p.ltv, c: LIME      },
                  { l: "Scale", v: p.tvl, c: EMERALD   },
                ].map((stat) => (
                  <div key={stat.l} className="text-center p-1.5 rounded"
                    style={{ background: "hsl(0 0% 7%)", border: `1px solid ${BORDER}` }}>
                    <div className="font-black text-[10px] font-mono leading-tight" style={{ color: stat.c }}>{stat.v}</div>
                    <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 28%)" }}>{stat.l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* RWA flow */}
      <div className="relative rounded-xl p-4 overflow-hidden" style={{ background: CARD_BG2, border: `1px solid ${LIME}18` }}>
        <LBracket size={8} color={`${LIME}25`} />
        <div className="font-mono text-[10px] tracking-widest uppercase mb-4" style={{ color: "hsl(0 0% 28%)" }}>
          RWA Lifecycle
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            "Real-World Asset",
            "Tokenization (Ondo / Centrifuge)",
            "Governance Whitelist",
            "USDAX Vault Deposit",
            "USDAX Minted",
            "DeFi Deployment",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: i === arr.length - 1 ? `${LIME}14` : CARD_BG, border: `1px solid ${i === arr.length - 1 ? `${LIME}30` : BORDER}` }}>
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "hsl(0 0% 28%)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="font-bold text-[11px]" style={{ color: i === arr.length - 1 ? LIME : "hsl(0 0% 68%)" }}>{step}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(0 0% 22%)" }} />}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ─── Risk Params ─── */
function RiskParams() {
  return (
    <Panel className="p-5">
      <LBracket color={`${AMBER}22`} />
      <SectionLabel>Risk Framework</SectionLabel>
      <h2 className="font-black text-lg uppercase tracking-tight mb-4" style={{ color: "hsl(0 0% 90%)" }}>
        Protocol Safety Parameters
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Asset", "Type", "Max LTV", "Liq. Threshold", "Liq. Bonus", "Debt Ceiling", "Oracle"].map((h) => (
                <th key={h} className="text-left pb-3 pr-4 font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { asset: "WETH",   type: "Crypto", ltv: "75%", liq: "80%", bonus: "10%", ceil: "$20M",  oracle: "Chainlink + Pyth" },
              { asset: "WBTC",   type: "Crypto", ltv: "65%", liq: "70%", bonus: "10%", ceil: "$15M",  oracle: "Chainlink + Pyth" },
              { asset: "stETH",  type: "Yield",  ltv: "63%", liq: "68%", bonus: "10%", ceil: "$10M",  oracle: "Chainlink + Lido" },
              { asset: "RWA-TB", type: "RWA",    ltv: "92%", liq: "95%", bonus: "5%",  ceil: "$50M",  oracle: "Ondo Daily NAV"   },
              { asset: "RWA-RE", type: "RWA",    ltv: "68%", liq: "73%", bonus: "8%",  ceil: "$25M",  oracle: "Centrifuge Feed"  },
              { asset: "RWA-CB", type: "RWA",    ltv: "78%", liq: "83%", bonus: "7%",  ceil: "$30M",  oracle: "Maple Monthly"    },
            ].map((row, i) => {
              const isRwa = row.type === "RWA";
              const isYield = row.type === "Yield";
              const typeColor = isRwa ? LIME : isYield ? EMERALD : AMBER;
              return (
                <tr key={row.asset} style={{ borderBottom: `1px solid ${BORDER}` }}
                  className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-2.5 pr-4 font-black font-mono" style={{ color: "hsl(0 0% 82%)" }}>{row.asset}</td>
                  <td className="py-2.5 pr-4">
                    <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}22` }}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono font-bold" style={{ color: LIME }}>{row.ltv}</td>
                  <td className="py-2.5 pr-4 font-mono" style={{ color: AMBER }}>{row.liq}</td>
                  <td className="py-2.5 pr-4 font-mono" style={{ color: EMERALD }}>{row.bonus}</td>
                  <td className="py-2.5 pr-4 font-mono" style={{ color: "hsl(0 0% 55%)" }}>{row.ceil}</td>
                  <td className="py-2.5 font-mono text-[10px]" style={{ color: "hsl(0 0% 35%)" }}>{row.oracle}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ─── ROOT ─── */
export default function Nexus() {
  const { data: stats }      = useGetProtocolStats();
  const { data: collateral } = useGetCollateralBreakdown();

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">
      <Hero stats={stats} />

      {/* Flow + Collateral side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MintFlow />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <CollateralMatrix live={collateral ?? []} />
        </div>
      </div>

      <RWADeepDive />
      <UseCases />
      <PegMechanics />
      <RiskParams />
    </div>
  );
}
