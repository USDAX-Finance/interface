import { Link } from "wouter";
import {
  ArrowRight, Zap, Layers, Lock, TrendingUp,
  ChevronRight, RefreshCw, Shield, BarChart2,
  Clock, Coins, ArrowLeft, Percent, Users,
} from "lucide-react";

/* ─── tokens ─── */
const LIME        = "hsl(79 100% 57%)";
const LIME_DIM    = "hsl(79 100% 57% / 0.07)";
const LIME_BORDER = "hsl(79 100% 57% / 0.18)";
const EMERALD     = "hsl(152 70% 48%)";
const BORDER      = "hsl(0 0% 10%)";
const CARD_BG     = "hsl(0 0% 6%)";
const BG          = "hsl(0 0% 4%)";

/* ─── shared atoms ─── */
function LBracket({ size = 14, color = LIME }: { size?: number; color?: string }) {
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
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
      {children}
    </span>
  );
}

function TopBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-8 gap-4"
      style={{ background: "hsl(0 0% 3% / 0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}` }}>
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <img src="/favicon.png" alt="USDAX Finance" className="w-7 h-7 rounded" />
          <span className="font-bold text-base tracking-tight" style={{ color: "hsl(0 0% 80%)" }}>
            USDAX <span style={{ color: "hsl(0 0% 35%)" }}>finance</span>
          </span>
        </div>
      </Link>
      <div className="flex-1" />
      <Link href="/governance">
        <button className="text-[12px] px-4 py-2 rounded transition-colors"
          style={{ color: "hsl(0 0% 38%)", border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)"; }}>
          Governance
        </button>
      </Link>
      <Link href="/docs">
        <button className="text-[12px] px-4 py-2 rounded transition-colors"
          style={{ color: "hsl(0 0% 38%)", border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)"; }}>
          Docs
        </button>
      </Link>
      <Link href="/app/staking">
        <button className="text-[12px] font-semibold px-4 py-2 rounded"
          style={{ background: LIME, color: "hsl(0 0% 4%)" }}>
          Stake Now
        </button>
      </Link>
    </header>
  );
}

/* ─── HERO ─── */
function Hero() {
  const stats = [
    { label: "Reward Rate",      val: "2,740", sub: "APX per day · 1M APX/year emission" },
    { label: "Total APX Staked", val: "N/A",   sub: "Live on Robinhood Mainnet" },
    { label: "Rewards Pool",     val: "10M",   sub: "APX funded · ~10 years runway" },
    { label: "Stakers",          val: "N/A",   sub: "Active wallets on mainnet" },
  ];

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-end px-10 pb-16 pt-28 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, hsl(79 100% 57% / 0.07) 0%, transparent 70%), ${BG}`,
      }}>

      {/* Grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.02) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      {/* Big decorative APY */}
      <div className="pointer-events-none absolute right-10 top-20 font-black select-none leading-none"
        style={{ fontSize: "clamp(6rem, 18vw, 18rem)", color: LIME, opacity: 0.04, fontVariantNumeric: "tabular-nums" }}>
        ~15%
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <Tag>APX Staking · USDAX Finance</Tag>
        <h1 className="font-black uppercase leading-none tracking-tight mb-5"
          style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "hsl(0 0% 97%)" }}>
          STAKE APX.<br />
          <span style={{ color: LIME }}>EARN REAL YIELD.</span>
        </h1>
        <p className="text-[15px] leading-relaxed mb-8 max-w-xl" style={{ color: "hsl(0 0% 44%)" }}>
          Stake APX and earn APX rewards from a 10,000,000 APX reward pool.
          Powered by the Synthetix rewardPerToken model. Rewards accrue every block, claim anytime.
        </p>

        {/* Live badge */}
        <div className="mb-10 rounded-xl px-5 py-4 flex items-start gap-3 max-w-xl"
          style={{ background: "hsl(79 100% 57% / 0.05)", border: "1px solid hsl(79 100% 57% / 0.2)" }}>
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: LIME }} />
          <div>
            <p className="font-black text-[13px] mb-1" style={{ color: LIME }}>Live on Robinhood Chain Mainnet</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 48%)" }}>
              APXStaking contract is deployed and funded with 10M APX rewards on Robinhood Chain Mainnet (Chain ID 4663).
              Connect your wallet and start earning today.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="relative rounded-xl p-5 overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <LBracket size={10} color={`${LIME}40`} />
              <div className="font-black text-2xl mb-1" style={{ color: LIME }}>{s.val}</div>
              <div className="font-semibold text-[12px] mb-0.5" style={{ color: "hsl(0 0% 72%)" }}>{s.label}</div>
              <div className="text-[11px]" style={{ color: "hsl(0 0% 30%)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 flex-wrap">
          <Link href="/app/staking">
            <button className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded text-sm"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px hsl(79 100% 57% / 0.35)`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              <Zap className="w-4 h-4" /> Stake APX Now
            </button>
          </Link>
          <Link href="/docs#stake-apx">
            <button className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded text-sm"
              style={{ border: `1px solid ${BORDER}`, color: "hsl(0 0% 45%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsl(0 0% 20%)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 45%)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
              How It Works <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const steps = [
    {
      n: "01", icon: Coins,
      title: "Acquire APX",
      body: "Buy APX tokens on supported Robinhood Chain DEXes or earn them via community programs. APX has a fixed supply of 100 million, no new tokens will ever be minted.",
    },
    {
      n: "02", icon: Lock,
      title: "Stake on App",
      body: "Connect your wallet to the USDAX Finance app and navigate to Staking. Approve the APX token and deposit any amount, there is no minimum stake and no lock period.",
    },
    {
      n: "03", icon: TrendingUp,
      title: "Accrue USDAX Rewards",
      body: "Rewards begin accruing the moment you stake, every block. Your share of the reward pool is proportional to your APX staked vs. total APX staked globally.",
    },
    {
      n: "04", icon: RefreshCw,
      title: "Claim Anytime",
      body: "Claim your accrued APX rewards at any time, no vesting, no waiting. Unstaking initiates a 7-day cooldown period, after which your APX is fully returned to your wallet.",
    },
  ];

  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <Tag>How Staking Works</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-5" style={{ color: "hsl(0 0% 94%)" }}>
              Four Steps to<br /><span style={{ color: LIME }}>Passive Income</span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>
              APX staking is designed to be as simple as possible. No lockups, no complex mechanics.
              Just stake, earn, and claim whenever you want.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="relative rounded-xl p-5 flex gap-5 items-start overflow-hidden"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  {/* Step indicator */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: i === 0 ? LIME : LIME_DIM, border: `1px solid ${i === 0 ? LIME : LIME_BORDER}` }}>
                    <Icon className="w-4 h-4" style={{ color: i === 0 ? "hsl(0 0% 4%)" : LIME }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] tracking-widest" style={{ color: `${LIME}70` }}>{step.n}</span>
                      <span className="font-black text-[14px]" style={{ color: "hsl(0 0% 86%)" }}>{step.title}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>{step.body}</p>
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

/* ─── REWARD MECHANICS ─── */
function RewardMechanics() {
  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <Tag>Reward Mechanics</Tag>
          <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
            Real Yield, Not<br /><span style={{ color: LIME }}>Printed Tokens</span>
          </h2>
          <p className="text-[14px] max-w-xl" style={{ color: "hsl(0 0% 40%)" }}>
            Every dollar of APY comes from real protocol activity, not inflationary APX emissions.
            As USDAX supply grows, so does your reward.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Percent,
              title: "Stability Fee",
              rate: "0.5% / yr",
              desc: "Charged continuously on all outstanding USDAX debt. With $42M+ USDAX in circulation, this generates $210,000+ annually, all flowing to APX stakers.",
              color: LIME,
            },
            {
              icon: Zap,
              title: "Mint Fee",
              rate: "0.1% one-time",
              desc: "Collected every time a user opens a Vault and mints USDAX. Protocol growth and new minting events create recurring fee bursts for stakers.",
              color: LIME,
            },
            {
              icon: RefreshCw,
              title: "Redemption Fee",
              rate: "0.5% one-time",
              desc: "Charged when USDAX is redeemed for collateral at face value. Arbitrageurs who stabilise the peg also contribute directly to staker revenue.",
              color: LIME,
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="relative rounded-xl overflow-hidden"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="h-0.5" style={{ background: `${m.color}60` }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: LIME_DIM, border: `1px solid ${LIME_BORDER}` }}>
                      <Icon className="w-4 h-4" style={{ color: LIME }} />
                    </div>
                    <div>
                      <div className="font-black text-[13px]" style={{ color: "hsl(0 0% 85%)" }}>{m.title}</div>
                      <div className="font-mono text-[11px]" style={{ color: LIME }}>{m.rate}</div>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* APY formula card */}
        <div className="relative rounded-2xl p-8 overflow-hidden"
          style={{ background: CARD_BG, border: `1px solid ${LIME}20` }}>
          <LBracket size={14} color={`${LIME}30`} />
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: "hsl(0 0% 30%)" }}>APY Formula</div>
              <div className="font-mono text-[15px] mb-4 p-4 rounded-lg" style={{ background: "hsl(0 0% 5%)", color: LIME, border: `1px solid ${BORDER}` }}>
                APY = Annual Protocol Revenue<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;÷ (APX Staked × APX Price)
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 42%)" }}>
                As protocol revenue grows and APX supply stays fixed, your effective yield increases.
                There is no ceiling, APY scales directly with USDAX adoption.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Annual Revenue (est.)", val: "$12.5M+" },
                { label: "APX in Staking",        val: "TBD" },
                { label: "APX Price",             val: "TBD" },
                { label: "Projected APY",         val: "~15%+" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 text-center"
                  style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                  <div className="font-black text-xl mb-1" style={{ color: LIME }}>{s.val}</div>
                  <div className="text-[11px]" style={{ color: "hsl(0 0% 30%)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] mt-6" style={{ color: "hsl(0 0% 22%)" }}>
            * Projections based on estimated protocol revenue at launch. APY is variable. Not financial advice.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── STAKING PARAMETERS ─── */
function Parameters() {
  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <Tag>Staking Parameters</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-5" style={{ color: "hsl(0 0% 94%)" }}>
              Simple Rules.<br /><span style={{ color: LIME }}>Maximum Flexibility.</span>
            </h2>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: "hsl(0 0% 40%)" }}>
              No hidden lockups, no complex tiers, no vesting schedules.
              APX staking is designed to be transparent and accessible to every wallet size.
            </p>
            <Link href="/app/staking">
              <button className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}>
                Open Staking App <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { icon: Coins,    label: "Minimum Stake",      val: "1 APX",         note: "Min. 1 APX per transaction" },
              { icon: Lock,     label: "Lock Period",         val: "None",          note: "Stake anytime, no lockup" },
              { icon: Clock,    label: "Cooldown Period",     val: "7 days",        note: "After initiating unstake" },
              { icon: RefreshCw,label: "Reward Frequency",   val: "Every block",   note: "Accrues in real time" },
              { icon: Zap,      label: "Claim Cooldown",     val: "None",          note: "Claim whenever you want" },
              { icon: Shield,   label: "Reward Token",       val: "APX",           note: "Governance token rewards" },
              { icon: TrendingUp,label: "Reward Source",     val: "10M APX pool",  note: "1M APX/year emission rate" },
              { icon: Users,    label: "Governance Access",  val: "1 APX = 1 vote",note: "Stake does not affect votes" },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.label} className="flex items-center gap-4 px-5 py-4 rounded-xl"
                  style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: LIME_DIM, border: `1px solid ${LIME_BORDER}` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: LIME }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px]" style={{ color: "hsl(0 0% 32%)" }}>{p.label}</div>
                    <div className="font-bold text-[13px]" style={{ color: "hsl(0 0% 85%)" }}>{p.val}</div>
                  </div>
                  <div className="text-[11px] text-right" style={{ color: "hsl(0 0% 28%)" }}>{p.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── RISK ─── */
function Risk() {
  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <Tag>Risk Disclosure</Tag>
        <h2 className="font-black text-4xl uppercase leading-tight mb-10" style={{ color: "hsl(0 0% 94%)" }}>
          Know the <span style={{ color: LIME }}>Risks</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "Smart Contract Risk",
              color: "hsl(0 80% 62%)",
              body: "All assets are held by smart contracts. Despite multiple independent audits, no contract can be guaranteed bug-free. Only stake what you can afford to lose.",
            },
            {
              title: "APX Price Volatility",
              color: "hsl(38 92% 58%)",
              body: "Your staked APX position is subject to market price movements. Rewards are paid in USDAX (stable), but the dollar value of your principal fluctuates with APX price.",
            },
            {
              title: "Variable APY",
              color: LIME,
              body: "APY is not fixed, it depends on protocol revenue and total APX staked. As more APX is staked or revenue changes, your effective yield adjusts accordingly.",
            },
          ].map((r) => (
            <div key={r.title} className="relative rounded-xl p-6 overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${r.color}25` }}>
              <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `${r.color}60` }} />
              <div className="font-black text-[14px] mb-3" style={{ color: r.color }}>{r.title}</div>
              <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    { q: "Is there a minimum amount to stake?", a: "No. You can stake any amount of APX, from 1 token to the full supply. There is no minimum." },
    { q: "When do rewards start accruing?", a: "Rewards begin accruing from the very next block after you stake. There is no waiting period." },
    { q: "Can I lose my staked APX?", a: "Your principal APX is not used as collateral or slashed. In the event of a smart contract exploit, staked tokens could theoretically be at risk, which is why we invest heavily in security audits." },
    { q: "How long is the unbonding period?", a: "After initiating an unstake, a 7-day unbonding period begins. Your APX is returned to your wallet automatically after the 7 days complete." },
    { q: "Are rewards compounded automatically?", a: "No, rewards must be claimed manually. Once claimed, you can restake them to compound your position." },
    { q: "Does staking affect my governance voting power?", a: "APX voting power is based on your total APX balance (staked + unstaked). Staking does not reduce your votes, your staked APX still counts." },
  ];

  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-16">
          <div>
            <Tag>FAQ</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
              Common<br /><span style={{ color: LIME }}>Questions</span>
            </h2>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="font-bold text-[14px] mb-2" style={{ color: "hsl(0 0% 84%)" }}>{f.q}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 42%)" }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="py-20 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden p-12 lg:p-16"
          style={{ background: LIME }}>
          <LBracket size={20} color="hsl(0 0% 4%)" />
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(hsl(0 0% 0% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0% / 0.05) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.25em] uppercase mb-3" style={{ color: "hsl(0 0% 15%)" }}>
                Ready to earn?
              </div>
              <h2 className="font-black text-3xl lg:text-4xl uppercase leading-tight mb-2" style={{ color: "hsl(0 0% 4%)" }}>
                Start Earning USDAX<br />on Your APX Today.
              </h2>
              <p className="text-[13px]" style={{ color: "hsl(0 0% 22%)" }}>
                Connect your wallet and stake in under 60 seconds.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Link href="/app/staking">
                <button className="inline-flex items-center gap-2 font-black px-8 py-3.5 rounded text-sm"
                  style={{ background: "hsl(0 0% 4%)", color: LIME }}>
                  <Zap className="w-4 h-4" /> Stake APX Now
                </button>
              </Link>
              <Link href="/governance">
                <button className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded text-sm"
                  style={{ background: "hsl(0 0% 4% / 0.12)", color: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 4% / 0.2)" }}>
                  View Governance <ArrowRight className="w-4 h-4" />
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
    <footer className="py-8 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/favicon.png" alt="USDAX Finance" className="w-6 h-6 rounded" />
            <span className="font-bold text-sm" style={{ color: "hsl(0 0% 35%)" }}>USDAX finance</span>
          </div>
        </Link>
        <div className="flex gap-6">
          {[{ l: "Home", h: "/" }, { l: "Protocol", h: "/protocol" }, { l: "Governance", h: "/governance" }, { l: "Docs", h: "/docs" }].map((x) => (
            <Link key={x.l} href={x.h}>
              <span className="text-[12px] cursor-pointer transition-colors" style={{ color: "hsl(0 0% 28%)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 60%)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 28%)")}>{x.l}</span>
            </Link>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: "hsl(0 0% 22%)" }}>© 2026 USDAX Finance</p>
      </div>
    </footer>
  );
}

export default function StakingPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: BG }}>
      <TopBar />
      <Hero />
      <HowItWorks />
      <RewardMechanics />
      <Parameters />
      <Risk />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
