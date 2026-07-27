import { Link } from "wouter";
import {
  ArrowRight, Zap, Shield, Layers, BarChart2,
  Lock, RefreshCw, Globe, Cpu, ArrowLeft,
  ChevronRight, AlertTriangle, TrendingUp,
  Coins, Building2, Network, FlaskConical,
} from "lucide-react";

/* ─── design tokens (match landing) ─── */
const LIME        = "hsl(79 100% 57%)";
const LIME_DIM    = "hsl(79 100% 57% / 0.07)";
const LIME_BORDER = "hsl(79 100% 57% / 0.18)";
const EMERALD     = "hsl(152 70% 48%)";
const BORDER      = "hsl(0 0% 10%)";
const CARD_BG     = "hsl(0 0% 6%)";
const BG          = "hsl(0 0% 4%)";

/* ─── shared atoms ─── */
function LBracket({ size = 16, color = LIME }: { size?: number; color?: string }) {
  const s = { display: "block" as const, width: size, height: size };
  return (
    <>
      <span className="absolute top-0 left-0 pointer-events-none" style={{ ...s, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className="absolute top-0 right-0 pointer-events-none" style={{ ...s, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <span className="absolute bottom-0 left-0 pointer-events-none" style={{ ...s, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className="absolute bottom-0 right-0 pointer-events-none" style={{ ...s, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] mb-5"
      style={{ background: LIME_DIM, color: LIME, border: `1px solid ${LIME_BORDER}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
      {children}
    </span>
  );
}

function SectionRule() {
  return <div className="w-12 h-px mb-6" style={{ background: LIME }} />;
}

/* ─── top bar ─── */
function TopBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-8 gap-4"
      style={{ background: "hsl(0 0% 3% / 0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}` }}>
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <img src="/favicon.png" alt="USDAX" className="w-7 h-7 rounded" />
          <span className="font-bold text-base tracking-tight" style={{ color: "hsl(0 0% 80%)" }}>
            USDAX <span style={{ color: "hsl(0 0% 35%)" }}>finance</span>
          </span>
        </div>
      </Link>
      <div className="flex-1" />
      <Link href="/docs">
        <button className="text-[12px] transition-colors px-4 py-2 rounded"
          style={{ color: "hsl(0 0% 38%)", border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)"; }}>
          Docs
        </button>
      </Link>
      <Link href="/app">
        <button className="text-[12px] font-semibold px-4 py-2 rounded"
          style={{ background: LIME, color: "hsl(0 0% 4%)" }}>
          Launch App
        </button>
      </Link>
    </header>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-end px-10 pb-16 pt-28 overflow-hidden"
      style={{ background: `radial-gradient(ellipse 80% 60% at 60% 20%, hsl(79 100% 57% / 0.06) 0%, transparent 70%), ${BG}` }}>

      {/* Grid lines */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.025) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.025) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }} />

      {/* Testnet badge */}
      <div className="pointer-events-none absolute top-20 right-10 flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] px-3 py-1.5 rounded-full"
        style={{ border: `1px solid hsl(38 92% 58% / 0.4)`, color: "hsl(38 92% 58%)", background: "hsl(38 92% 58% / 0.06)" }}>
        <FlaskConical className="w-3 h-3" /> TESTNET / NOT MAINNET
      </div>

      {/* Scattered data numbers */}
      {[
        { t: "8%", x: "72%", y: "28%" },
        { t: "150%", x: "82%", y: "55%" },
        { t: "$1.00", x: "64%", y: "65%" },
        { t: "46630", x: "78%", y: "72%" },
      ].map((n) => (
        <div key={n.t} className="pointer-events-none absolute font-mono text-[11px] select-none"
          style={{ left: n.x, top: n.y, color: "hsl(0 0% 18%)" }}>
          {n.t}
        </div>
      ))}

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="max-w-3xl">
          <Tag>USDAX Finance · The Stablecoin Layer</Tag>
          <h1 className="font-black uppercase leading-none tracking-tight mb-6"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", color: "hsl(0 0% 97%)" }}>
            THE FUTURE OF<br />
            <span style={{ color: LIME }}>STABLE VALUE</span><br />
            IS PROGRAMMABLE.
          </h1>
          <p className="text-[15px] leading-relaxed mb-8 max-w-xl" style={{ color: "hsl(0 0% 46%)" }}>
            USDAX Finance is the decentralised stablecoin and yield infrastructure
            powering USDAX, an overcollateralised, on-chain dollar built natively on Robinhood Chain.
            We are currently live on testnet and inviting the community to explore,
            stress-test, and shape the protocol before mainnet.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/app">
              <button className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded text-sm"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px hsl(79 100% 57% / 0.35)`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                <Zap className="w-4 h-4" /> Join Testnet
              </button>
            </Link>
            <Link href="/docs">
              <button className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded text-sm transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: "hsl(0 0% 45%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsl(0 0% 20%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 45%)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
                Read Docs <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom chain info */}
      <div className="absolute bottom-6 right-10 text-right">
        <p className="text-[10px] font-mono tracking-[0.2em]" style={{ color: "hsl(0 0% 22%)" }}>
          ROBINHOOD CHAIN · EVM 46630
        </p>
        <p className="text-[10px] font-mono mt-1" style={{ color: "hsl(0 0% 16%)" }}>
          usdax.finance
        </p>
      </div>
    </section>
  );
}

/* ─── VISION & MISSION ─── */
function Vision() {
  return (
    <section className="py-28 px-8 overflow-hidden" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-start">

          {/* Left */}
          <div>
            <Tag>Vision & Mission</Tag>
            <h2 className="font-black text-4xl lg:text-5xl uppercase leading-tight mb-6"
              style={{ color: "hsl(0 0% 94%)" }}>
              Money that<br />
              <span style={{ color: LIME }}>nobody owns,</span><br />
              everyone trusts.
            </h2>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: "hsl(0 0% 44%)" }}>
              Traditional stablecoins are only as trustworthy as the institutions behind them.
              Bank accounts freeze. Regulators intervene. Issuers go bankrupt. USDAX is designed
              from the ground up to be <strong style={{ color: "hsl(0 0% 72%)" }}>censorship-resistant,
              non-custodial, and transparent</strong>, backed entirely by on-chain collateral
              that anyone can inspect in real time.
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: "hsl(0 0% 44%)" }}>
              Our mission is to bring dollar-denominated financial infrastructure to every wallet
              on Robinhood Chain, without intermediaries, custodians, or trust assumptions.
            </p>
          </div>

          {/* Right, pillars */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield,      title: "Trustless",       desc: "No team multisig. No admin keys. Smart contracts enforce every rule." },
              { icon: Globe,       title: "Permissionless",  desc: "Any wallet, any geography. USDAX is open infrastructure." },
              { icon: BarChart2,   title: "Transparent",     desc: "Every collateral position is on-chain. Fully auditable, 24/7." },
              { icon: RefreshCw,   title: "Composable",      desc: "USDAX works natively with DeFi, lending, trading, yield vaults." },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="relative p-5 rounded-xl overflow-hidden"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <LBracket size={10} />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: LIME_DIM, border: `1px solid ${LIME_BORDER}` }}>
                    <Icon className="w-4 h-4" style={{ color: LIME }} />
                  </div>
                  <div className="font-bold text-[13px] mb-1.5" style={{ color: "hsl(0 0% 82%)" }}>{p.title}</div>
                  <div className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{p.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW USDAX WORKS, step by step ─── */
const STEPS = [
  {
    n: "01",
    icon: Coins,
    title: "Deposit Collateral",
    subtitle: "Lock real assets on-chain",
    body: "Users deposit supported collateral assets, WETH, WBTC, USDC, RHOOD, or stETH, into a protocol Vault. The collateral is held in a non-custodial smart contract. No third party can touch it; only you can withdraw by repaying your USDAX debt.",
    detail: "Minimum collateral ratio: 150% · Collateral oracle: Chainlink + Pyth",
  },
  {
    n: "02",
    icon: Zap,
    title: "Mint USDAX",
    subtitle: "Borrow the stablecoin",
    body: "Once collateral is locked, you mint USDAX, an ERC-20 token pegged to $1.00, up to your borrowing limit (dictated by collateral ratio). Minting charges a one-time 0.1% mint fee. The USDAX is yours to use freely: trade, lend, pay, or bridge.",
    detail: "Mint fee: 0.10% · Stability fee: 0.5% / yr",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Earn & Deploy",
    subtitle: "Put your USDAX to work",
    body: "USDAX integrates with DeFi natively. Deposit into lending protocols to earn interest, provide liquidity in AMM pools, or deposit into the USDAX Savings Rate module to earn 4.20% APY. Meanwhile your collateral continues to appreciate.",
    detail: "Savings APY: 4.20% · LP opportunities: native AMMs",
  },
  {
    n: "04",
    icon: Layers,
    title: "Stake APX",
    subtitle: "Capture protocol revenue",
    body: "Stake APX governance tokens to receive a pro-rata share of all stability fees and mint fees collected across the protocol. Rewards are paid in USDAX, real yield from real protocol activity, not inflationary token emissions.",
    detail: "Projected APY: ~15%+ at APX launch · Unbonding period: 7 days",
  },
  {
    n: "05",
    icon: RefreshCw,
    title: "Repay & Withdraw",
    subtitle: "Reclaim your collateral anytime",
    body: "Repay your USDAX debt (principal + accrued stability fee) at any time. The protocol burns the repaid USDAX and releases your collateral. There is no lock-up, no maturity date, full liquidity is preserved at all times.",
    detail: "No lock-up period · Partial repayments supported",
  },
];

function HowItWorks() {
  return (
    <section className="py-28 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <Tag>Protocol Workflow</Tag>
          <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
            Step-by-Step:<br />
            <span style={{ color: LIME }}>How USDAX Works</span>
          </h2>
          <p className="text-[14px] max-w-xl" style={{ color: "hsl(0 0% 42%)" }}>
            Five stages, from depositing collateral to earning real yield. Every step
            is on-chain, non-custodial, and permissionless.
          </p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[28px] top-6 bottom-6 w-px hidden lg:block"
            style={{ background: `linear-gradient(to bottom, ${LIME}60, transparent)` }} />

          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.n}
                  className="relative grid lg:grid-cols-[60px_1fr_1fr] gap-6 lg:gap-10 items-start p-0 lg:p-0">

                  {/* Step number bubble */}
                  <div className="hidden lg:flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 relative z-10 font-black text-[13px] font-mono"
                    style={{
                      background: i === 0 ? LIME : CARD_BG,
                      border: `1px solid ${i === 0 ? LIME : BORDER}`,
                      color: i === 0 ? "hsl(0 0% 4%)" : "hsl(0 0% 35%)",
                    }}>
                    {step.n}
                  </div>

                  {/* Content card */}
                  <div className="lg:col-span-2 rounded-xl p-6 relative overflow-hidden"
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                    <LBracket size={10} color={`${LIME}40`} />
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center lg:hidden"
                        style={{ background: LIME_DIM, border: `1px solid ${LIME_BORDER}` }}>
                        <Icon className="w-4 h-4" style={{ color: LIME }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black font-mono text-[10px] tracking-widest" style={{ color: LIME }}>{step.n}</span>
                          <span className="text-[11px] tracking-widest" style={{ color: "hsl(0 0% 28%)" }}>·</span>
                          <span className="text-[11px] tracking-widest uppercase font-semibold" style={{ color: "hsl(0 0% 30%)" }}>{step.subtitle}</span>
                        </div>
                        <h3 className="font-black text-xl mb-3" style={{ color: "hsl(0 0% 90%)" }}>{step.title}</h3>
                        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "hsl(0 0% 44%)" }}>{step.body}</p>
                        <div className="inline-flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-full"
                          style={{ background: LIME_DIM, color: LIME, border: `1px solid ${LIME_BORDER}` }}>
                          <ChevronRight className="w-3 h-3" />
                          {step.detail}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── MECHANISMS ─── */
function Mechanisms() {
  const mechs = [
    {
      icon: Lock,
      title: "Overcollateralisation",
      color: LIME,
      body: `Every USDAX in circulation is backed by at least $1.50 of on-chain collateral. This 150% minimum collateral ratio (CR) creates a hard financial buffer that absorbs price volatility without threatening the $1 peg. The protocol continuously monitors all Vault CRs using decentralised oracles (Chainlink + Pyth). If a Vault's CR falls below 150%, the owner can be partially liquidated to restore system health.`,
      stats: [
        { label: "Min Collateral Ratio", val: "150%" },
        { label: "Liquidation Trigger",  val: "130%" },
        { label: "Oracle Sources",       val: "Chainlink + Pyth" },
      ],
    },
    {
      icon: RefreshCw,
      title: "Peg Stability Engine",
      color: LIME,
      body: `The $1.00 peg is maintained through three interlocking mechanisms. First, arbitrage: when USDAX trades below $1, rational actors buy it cheaply and redeem collateral at face value, profiting while pushing the price back up. Second, the Stability Pool: USDAX depositors absorb liquidated collateral at a discount, creating structural demand. Third, Stability Fee Adjustment: governance can raise or lower the ongoing debt cost to incentivise or discourage new minting.`,
      stats: [
        { label: "Redemption Value", val: "$1.00 always" },
        { label: "Stability Fee",    val: "0.5% / year" },
        { label: "Redemption Fee",   val: "0.5% one-time" },
      ],
    },
    {
      icon: AlertTriangle,
      title: "Liquidation System",
      color: "hsl(38 92% 58%)",
      body: `When a Vault CR drops below 130%, anyone can trigger a liquidation. The liquidator repays up to 50% of the outstanding USDAX debt and receives that collateral value plus a 10% bonus, an instant profit incentive. If no liquidator acts within one block, the Stability Pool absorbs the debt using pooled USDAX, distributing the discounted collateral to pool depositors. As a last resort, remaining bad debt is redistributed across all active Vaults proportionally.`,
      stats: [
        { label: "Liquidation CR",   val: "130%" },
        { label: "Liquidator Bonus", val: "10%" },
        { label: "Max Repay",        val: "50% of debt" },
      ],
    },
    {
      icon: TrendingUp,
      title: "Revenue Distribution",
      color: LIME,
      body: `100% of all protocol-generated fees, stability fees, mint fees, and redemption fees, flow directly to APX stakers. There is no protocol treasury cut on user fees. The APX staking contract receives fees in real time, and stakers can claim their share of USDAX rewards at any point. This design ensures APX is a pure yield token, not a governance token that requires secondary markets to monetise.`,
      stats: [
        { label: "Fee to Stakers",   val: "100%" },
        { label: "Reward Token",     val: "USDAX" },
        { label: "Claim Frequency",  val: "Any time" },
      ],
    },
  ];

  return (
    <section className="py-28 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <Tag>Core Mechanisms</Tag>
          <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
            Engineering <span style={{ color: LIME }}>Stability</span><br />at Every Layer
          </h2>
          <p className="text-[14px] max-w-xl" style={{ color: "hsl(0 0% 42%)" }}>
            Four interlocking systems ensure USDAX holds its $1.00 peg under any market condition,
            while distributing all protocol value back to participants.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {mechs.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="relative rounded-xl p-7 overflow-hidden"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <LBracket size={12} color={`${m.color}35`} />

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${m.color}12`, border: `1px solid ${m.color}30` }}>
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <h3 className="font-black text-[16px]" style={{ color: "hsl(0 0% 88%)" }}>{m.title}</h3>
                </div>

                <p className="text-[13px] leading-relaxed mb-6" style={{ color: "hsl(0 0% 42%)" }}>{m.body}</p>

                <div className="grid grid-cols-3 gap-3">
                  {m.stats.map((s) => (
                    <div key={s.label} className="rounded-lg px-3 py-2.5 text-center"
                      style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                      <div className="font-black text-[13px] mb-0.5" style={{ color: m.color }}>{s.val}</div>
                      <div className="text-[10px] leading-tight" style={{ color: "hsl(0 0% 28%)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── RWA ─── */
function RWA() {
  return (
    <section className="py-28 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Left, big visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden p-10"
              style={{ background: LIME, minHeight: 340 }}>
              <LBracket size={18} color="hsl(0 0% 4%)" />

              {/* Floating label blocks */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: "T-Bills",          sub: "US Treasury" },
                  { label: "Real Estate",      sub: "Tokenised Deed" },
                  { label: "Corporate Bonds",  sub: "IG Rated" },
                  { label: "Commodities",      sub: "Gold · Oil" },
                  { label: "Trade Finance",    sub: "Invoice Tokens" },
                  { label: "Private Credit",   sub: "On-chain CLO" },
                ].map((r) => (
                  <div key={r.label} className="rounded-lg px-3 py-2.5"
                    style={{ background: "hsl(0 0% 4%)", border: "1px solid hsl(0 0% 8%)" }}>
                    <div className="font-black text-[12px]" style={{ color: LIME }}>{r.label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "hsl(0 0% 35%)" }}>{r.sub}</div>
                  </div>
                ))}
              </div>

              {/* Bottom label */}
              <div className="absolute bottom-5 left-0 right-0 text-center">
                <span className="font-black text-[11px] tracking-widest text-black opacity-30">
                  REAL WORLD ASSETS → USDAX COLLATERAL
                </span>
              </div>
            </div>
          </div>

          {/* Right, copy */}
          <div>
            <Tag>RWA Integration Roadmap</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-5" style={{ color: "hsl(0 0% 94%)" }}>
              Real-World Assets<br />
              as <span style={{ color: LIME }}>Collateral</span>
            </h2>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 44%)" }}>
              Phase one of USDAX Finance uses on-chain crypto assets (ETH, BTC, stablecoins) as
              collateral: assets that are liquid, auditable, and natively on-chain. This launches
              on testnet and transitions to mainnet in H2 2026.
            </p>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 44%)" }}>
              Phase two introduces tokenised Real World Assets as collateral. Regulated RWA tokens
              (representing US Treasury bills, investment-grade corporate bonds, tokenised real estate
              deeds, and trade finance instruments) will be onboarded after governance approval and
              third-party legal verification of each asset's token structure and redemption rights.
            </p>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "hsl(0 0% 44%)" }}>
              RWA collateral carries different risk parameters (lower LTV, longer oracle windows) and
              benefits from yield passthrough, the yield on the underlying assets flows back to Vault
              owners, creating <strong style={{ color: "hsl(0 0% 75%)" }}>native yield-bearing collateral</strong> that
              lowers the effective cost of minting USDAX.
            </p>
            <div className="space-y-3">
              {[
                { phase: "Phase 1 · Now",    text: "Crypto collateral: WETH, WBTC, USDC, stETH, RHOOD" },
                { phase: "Phase 2 · 2027",   text: "T-Bills + IG Bonds via regulated RWA token issuers" },
                { phase: "Phase 3 · 2027",   text: "Real estate, private credit, trade finance instruments" },
              ].map((r) => (
                <div key={r.phase} className="flex items-start gap-3">
                  <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: LIME }} />
                  <div>
                    <span className="font-black text-[11px] tracking-widest uppercase mr-2" style={{ color: LIME }}>{r.phase}</span>
                    <span className="text-[13px]" style={{ color: "hsl(0 0% 42%)" }}>{r.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTNET STATUS ─── */
function TestnetStatus() {
  return (
    <section className="py-20 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl p-10 overflow-hidden"
          style={{ background: "hsl(38 92% 58% / 0.05)", border: "1px solid hsl(38 92% 58% / 0.2)" }}>
          <LBracket size={18} color="hsl(38 92% 58% / 0.4)" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(38 92% 58% / 0.12)", border: "1px solid hsl(38 92% 58% / 0.3)" }}>
              <FlaskConical className="w-6 h-6" style={{ color: "hsl(38 92% 58%)" }} />
            </div>

            <div className="flex-1">
              <div className="font-black text-[11px] tracking-[0.25em] uppercase mb-2"
                style={{ color: "hsl(38 92% 58%)" }}>
                Testnet Phase: Not Mainnet
              </div>
              <h3 className="font-black text-xl mb-3" style={{ color: "hsl(0 0% 88%)" }}>
                We Are Live on Robinhood Chain Testnet
              </h3>
              <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "hsl(0 0% 44%)" }}>
                USDAX Finance is currently deployed on Robinhood Chain testnet (Chain ID 46630).
                All tokens, USDAX, APX, and testnet collateral assets, are valueless test tokens.
                This phase exists to battle-test the contracts, gather community feedback, identify
                edge cases, and complete third-party security audits before mainnet deployment.
                <strong style={{ color: "hsl(0 0% 72%)" }}> Do not send real funds to testnet contracts.</strong>
              </p>
            </div>

            <Link href="/app">
              <button className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded text-sm flex-shrink-0"
                style={{ background: "hsl(38 92% 58%)", color: "hsl(0 0% 4%)" }}>
                <FlaskConical className="w-4 h-4" /> Try Testnet
              </button>
            </Link>
          </div>

          {/* Status grid */}
          <div className="grid sm:grid-cols-4 gap-4 mt-10">
            {[
              { label: "Contracts Deployed",    val: "7 / 7",    done: true },
              { label: "Audit 1 (Trail of Bits)", val: "In Progress", done: false },
              { label: "Audit 2 (OpenZeppelin)", val: "Pre-Mainnet",  done: false },
              { label: "Mainnet Launch",         val: "Q3 2026",  done: false },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-4 py-3.5"
                style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.done ? EMERALD : "hsl(38 92% 58%)" }} />
                  <span className="font-black text-[13px]" style={{ color: s.done ? EMERALD : "hsl(38 92% 58%)" }}>
                    {s.val}
                  </span>
                </div>
                <div className="text-[11px]" style={{ color: "hsl(0 0% 30%)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── ROADMAP ─── */
const ROADMAP = [
  {
    q: "Q2 2026",
    label: "Testnet",
    status: "complete",
    color: EMERALD,
    items: [
      "Core contracts deployed on Robinhood Chain testnet",
      "Public testnet with faucet, WETH, USDC, RHOOD test tokens",
      "Vault creation, USDAX minting, and repayment flows live",
      "Liquidation engine deployed and stress-tested",
      "Security Audit #1 (Trail of Bits), in progress",
      "SDK v0.1 published, REST API live",
      "Community testnet campaign launched",
    ],
  },
  {
    q: "Q3 2026",
    label: "Mainnet Alpha",
    status: "upcoming",
    color: LIME,
    items: [
      "Mainnet deployment with WETH + USDC collateral",
      "Security Audit #2 (OpenZeppelin)",
      "Formal verification (Certora Prover), complete",
      "APX Token Generation Event (TGE)",
      "APX staking module live, real yield distribution begins",
      "Governance module activated, APX holders vote on parameters",
      "Stability Pool opened to USDAX depositors",
    ],
  },
  {
    q: "Q4 2026",
    label: "Expansion",
    status: "planned",
    color: "hsl(0 0% 30%)",
    items: [
      "WBTC and stETH collateral onboarding via governance vote",
      "Cross-chain USDAX bridge: Ethereum + Arbitrum + Base",
      "Advanced analytics dashboard, real-time protocol health",
      "RWA Phase 1: US Treasury bill tokens as collateral (pilot)",
      "USDAX lending market integration (partner protocol)",
      "Mobile wallet optimisations for Robinhood Chain",
    ],
  },
  {
    q: "Q1–Q2 2027",
    label: "Ecosystem",
    status: "planned",
    color: "hsl(0 0% 22%)",
    items: [
      "RWA Phase 2: IG corporate bonds + real estate tokens",
      "Yield-bearing collateral passthrough for RWA Vaults",
      "Decentralised oracle network transition (away from Chainlink dependency)",
      "v2 Governance: quadratic voting + delegation marketplace",
      "USDAX as native settlement asset on Robinhood Chain DEX",
      "Private credit and trade finance collateral onboarding",
    ],
  },
];

function Roadmap() {
  return (
    <section className="py-28 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <Tag>Roadmap</Tag>
          <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
            From Testnet<br />
            <span style={{ color: LIME }}>to Ecosystem</span>
          </h2>
          <p className="text-[14px] max-w-xl" style={{ color: "hsl(0 0% 42%)" }}>
            A deliberate, security-first rollout, testnet first, audited mainnet, then
            progressive decentralisation and RWA expansion.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {ROADMAP.map((phase) => (
            <div key={phase.q} className="relative rounded-xl overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${phase.status === "complete" ? `${EMERALD}30` : phase.status === "upcoming" ? `${LIME}30` : BORDER}` }}>

              {phase.status === "complete" && (
                <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: EMERALD }} />
              )}
              {phase.status === "upcoming" && (
                <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: LIME }} />
              )}

              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black font-mono text-[11px] tracking-widest" style={{ color: phase.color }}>{phase.q}</span>
                  {phase.status === "complete" && (
                    <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: `${EMERALD}15`, color: EMERALD, border: `1px solid ${EMERALD}30` }}>
                      DONE
                    </span>
                  )}
                  {phase.status === "upcoming" && (
                    <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: LIME_DIM, color: LIME, border: `1px solid ${LIME_BORDER}` }}>
                      NEXT
                    </span>
                  )}
                </div>
                <div className="font-black text-[15px] mb-5" style={{ color: "hsl(0 0% 78%)" }}>{phase.label}</div>

                <ul className="space-y-2.5">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12px] leading-relaxed"
                      style={{ color: "hsl(0 0% 38%)" }}>
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: phase.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── APX TOKEN SECTION ─── */
function APXSection() {
  return (
    <section className="py-28 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-start">

          <div>
            <Tag>APX Token</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-5" style={{ color: "hsl(0 0% 94%)" }}>
              Ownership.<br />
              Revenue.<br />
              <span style={{ color: LIME }}>Governance.</span>
            </h2>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 44%)" }}>
              APX is the value accrual and coordination layer of USDAX Finance. Unlike governance
              tokens that exist solely for voting, APX captures real economic value, 100% of all
              protocol fees are distributed to APX stakers in USDAX.
            </p>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "hsl(0 0% 44%)" }}>
              APX has a hard cap of 100 million tokens. There is no inflation. Staking rewards
              during bootstrap come from a pre-allocated rewards pool, transitioning to full
              fee-only rewards as protocol volume scales.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Supply",     val: "100M APX" },
                { label: "Inflation",        val: "Zero" },
                { label: "Reward Token",     val: "USDAX" },
                { label: "Voting",           val: "1 APX = 1 vote" },
                { label: "Unbonding",        val: "7 days" },
                { label: "Min Proposal",     val: "10,000 APX" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg px-4 py-3"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <div className="font-black text-[13px] mb-0.5" style={{ color: LIME }}>{s.val}</div>
                  <div className="text-[11px]" style={{ color: "hsl(0 0% 30%)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution chart, bar visual */}
          <div>
            <div className="rounded-xl p-7 relative overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <LBracket size={12} />
              <div className="text-[11px] font-black tracking-widest uppercase mb-6"
                style={{ color: "hsl(0 0% 30%)" }}>
                Token Distribution
              </div>

              {[
                { label: "Community & Ecosystem", pct: 40, color: LIME },
                { label: "Staking Rewards Pool",  pct: 25, color: "hsl(79 100% 57% / 0.65)" },
                { label: "Team & Contributors",   pct: 18, color: "hsl(79 100% 57% / 0.40)" },
                { label: "Investors",             pct: 12, color: "hsl(79 100% 57% / 0.25)" },
                { label: "Treasury",             pct: 5,  color: "hsl(0 0% 14%)" },
              ].map((row) => (
                <div key={row.label} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px]" style={{ color: "hsl(0 0% 50%)" }}>{row.label}</span>
                    <span className="font-black text-[12px]" style={{ color: LIME }}>{row.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 8%)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                </div>
              ))}

              <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                <div className="text-[11px] leading-relaxed" style={{ color: "hsl(0 0% 28%)" }}>
                  Team tokens: 4-year vesting, 1-year cliff.<br />
                  Investor tokens: 2-year vesting, 6-month cliff.<br />
                  Community allocation: grants, liquidity, hackathons.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function CTA() {
  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden p-12 lg:p-16 text-center"
          style={{ background: LIME }}>
          <LBracket size={22} color="hsl(0 0% 4%)" />

          {/* Background pattern */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(hsl(0 0% 0% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0% / 0.06) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }} />

          <div className="relative z-10">
            <div className="text-[11px] font-black tracking-[0.25em] uppercase mb-4"
              style={{ color: "hsl(0 0% 15%)" }}>
              Testnet is live · Join today
            </div>
            <h2 className="font-black text-4xl lg:text-5xl uppercase leading-tight mb-5"
              style={{ color: "hsl(0 0% 4%)" }}>
              Build With USDAX.<br />Earn With APX.
            </h2>
            <p className="text-[14px] leading-relaxed max-w-xl mx-auto mb-8"
              style={{ color: "hsl(0 0% 22%)" }}>
              Mint testnet USDAX, explore the staking interface, and help us shape the
              protocol before mainnet launches in Q3 2026.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/app">
                <button className="inline-flex items-center gap-2 font-black px-8 py-3.5 rounded text-sm"
                  style={{ background: "hsl(0 0% 4%)", color: LIME }}>
                  <Zap className="w-4 h-4" /> Enter Protocol
                </button>
              </Link>
              <Link href="/docs">
                <button className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded text-sm"
                  style={{ background: "hsl(0 0% 4% / 0.12)", color: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 4% / 0.2)" }}>
                  Read Documentation <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="py-10 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/favicon.png" alt="USDAX" className="w-6 h-6 rounded" />
            <span className="font-bold text-sm" style={{ color: "hsl(0 0% 35%)" }}>USDAX finance</span>
          </div>
        </Link>
        <div className="flex gap-6">
          {[
            { label: "Home",     href: "/" },
            { label: "Docs",     href: "/docs" },
            { label: "App",      href: "/app" },
          ].map((l) => (
            <Link key={l.label} href={l.href}>
              <span className="text-[12px] transition-colors cursor-pointer"
                style={{ color: "hsl(0 0% 28%)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 60%)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 28%)")}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: "hsl(0 0% 22%)" }}>
          © 2026 USDAX Finance · usdax.finance
        </p>
      </div>
    </footer>
  );
}

/* ─── PAGE ROOT ─── */
export default function Protocol() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: BG }}>
      <TopBar />
      <Hero />
      <Vision />
      <HowItWorks />
      <Mechanisms />
      <RWA />
      <TestnetStatus />
      <APXSection />
      <Roadmap />
      <CTA />
      <Footer />
    </div>
  );
}
