import { Link } from "wouter";
import {
  ArrowRight, Zap, Shield, ChevronRight,
  Users, Vote, Clock, Check, AlertTriangle,
  FileText, BarChart2, Lock, Globe,
  TrendingUp, Layers, CheckCircle, Circle,
} from "lucide-react";

/* ─── tokens ─── */
const LIME        = "hsl(79 100% 57%)";
const LIME_DIM    = "hsl(79 100% 57% / 0.07)";
const LIME_BORDER = "hsl(79 100% 57% / 0.18)";
const EMERALD     = "hsl(152 70% 48%)";
const BORDER      = "hsl(0 0% 10%)";
const CARD_BG     = "hsl(0 0% 6%)";
const BG          = "hsl(0 0% 4%)";

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
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
      {children}
    </span>
  );
}

/* ─── TOP BAR ─── */
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
      <Link href="/staking">
        <button className="text-[12px] px-4 py-2 rounded transition-colors"
          style={{ color: "hsl(0 0% 38%)", border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)"; }}>
          Staking
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
  const stats = [
    { label: "Governance Token",    val: "APX",    sub: "intended: 1 token = 1 vote" },
    { label: "Proposals Passed",    val: "0",      sub: "governance not yet deployed" },
    { label: "Avg. Participation",  val: "0%",     sub: "governance not yet deployed" },
    { label: "Timelock Delay",      val: "48 hrs", sub: "planned, contract not live" },
  ];

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-end px-10 pb-16 pt-28 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 70% 50% at 30% 0%, hsl(79 100% 57% / 0.06) 0%, transparent 70%), ${BG}`,
      }}>
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.02) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      {/* Decorative text */}
      <div className="pointer-events-none absolute right-10 top-20 font-black select-none leading-none text-right"
        style={{ fontSize: "clamp(5rem, 15vw, 15rem)", color: LIME, opacity: 0.035 }}>
        GOV
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <Tag>On-Chain Governance · USDAX Finance</Tag>
        <h1 className="font-black uppercase leading-none tracking-tight mb-5"
          style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "hsl(0 0% 97%)" }}>
          THE PROTOCOL<br />
          <span style={{ color: LIME }}>BELONGS TO</span><br />
          ITS HOLDERS.
        </h1>
        <p className="text-[15px] leading-relaxed mb-8 max-w-xl" style={{ color: "hsl(0 0% 44%)" }}>
          Every parameter in USDAX Finance (collateral ratios, stability fees, collateral types)
          is designed to be controlled by APX holders through binding on-chain governance.
          The governance contract is not yet deployed. This is the intended architecture for when it launches.
        </p>

        {/* Governance status */}
        <div className="mb-10 rounded-xl px-5 py-4 flex items-start gap-3 max-w-xl"
          style={{ background: "hsl(35 92% 60% / 0.06)", border: "1px solid hsl(35 92% 60% / 0.25)" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(35 92% 60%)" }} />
          <div>
            <p className="font-black text-[13px] mb-1" style={{ color: "hsl(35 92% 60%)" }}>Governance Contract Not Yet Deployed</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 48%)" }}>
              APX Token and APXStaking are live on Robinhood Chain Mainnet (chainId 4663). Staking is active.
              The on-chain governance contract (voting + timelock) is not yet deployed.
              This page describes the intended governance design. No proposals can be submitted or voted on until the governance contract is live.
            </p>
          </div>
        </div>

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
          <button className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded text-sm cursor-not-allowed"
            style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 32%)", border: `1px solid ${BORDER}` }}
            disabled>
            <Vote className="w-4 h-4" /> Proposals (Coming Soon)
          </button>
          <Link href="/docs#governance">
            <button className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded text-sm"
              style={{ border: `1px solid ${BORDER}`, color: "hsl(0 0% 45%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsl(0 0% 20%)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 45%)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
              Read Governance Docs <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW GOVERNANCE WORKS ─── */
function HowItWorks() {
  const steps = [
    {
      n: "01", icon: FileText, status: "active",
      title: "Discussion",
      duration: "≥ 3 days (planned)",
      body: "Community members would discuss proposals in a public forum before any formal vote. The rationale, risks, and parameters are debated openly. No forum is operational yet.",
    },
    {
      n: "02", icon: Users, status: "default",
      title: "Formal Proposal",
      duration: "Planned",
      body: "To submit a proposal, a wallet would need ≥ 10,000 APX. The proposal enters a 3-day voting delay after submission. This requires the governance contract, which is not yet deployed.",
    },
    {
      n: "03", icon: Vote, status: "default",
      title: "Voting Period",
      duration: "5 days (planned)",
      body: "APX holders would cast FOR, AGAINST, or ABSTAIN votes. Each APX = one vote. Delegated APX votes via the delegate's wallet. This is the intended design, not yet operational.",
    },
    {
      n: "04", icon: BarChart2, status: "default",
      title: "Quorum & Threshold",
      duration: "Planned",
      body: "Intended: ≥ 4% quorum (4M APX) and >50% FOR to pass. Supermajority proposals (e.g. emergency shutdown) would require ≥ 66.7%. These thresholds are design targets, not deployed parameters.",
    },
    {
      n: "05", icon: Clock, status: "default",
      title: "Timelock Queue",
      duration: "48 hours (planned)",
      body: "Approved proposals would queue in a 48-hour timelock before execution. This gives the community time to react. The timelock contract does not exist yet.",
    },
    {
      n: "06", icon: CheckCircle, status: "default",
      title: "Execution",
      duration: "Planned",
      body: "After the timelock, any wallet would trigger execution. The governance contract would call the target protocol contracts directly. None of this is deployed. This is the intended end state.",
    },
  ];

  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <Tag>Planned Proposal Lifecycle</Tag>
          <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
            Intended Design<br /><span style={{ color: LIME }}>— Not Yet Live</span>
          </h2>
          <div className="rounded-xl px-5 py-4 flex items-start gap-3 max-w-xl mb-4"
            style={{ background: "hsl(35 92% 60% / 0.06)", border: "1px solid hsl(35 92% 60% / 0.25)" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(35 92% 60%)" }} />
            <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 48%)" }}>
              The governance contract is not deployed. None of the steps below are operational.
              This describes the intended design once the contract is live and audited.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="relative rounded-xl p-6 overflow-hidden"
                style={{ background: CARD_BG, border: `1px solid ${i === 0 ? `${LIME}40` : BORDER}` }}>
                {i === 0 && <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: LIME }} />}
                <LBracket size={10} color={i === 0 ? `${LIME}50` : `${LIME}15`} />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: `${LIME}70` }}>{step.n}</span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: i === 0 ? LIME : LIME_DIM, border: `1px solid ${i === 0 ? LIME : LIME_BORDER}` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: i === 0 ? "hsl(0 0% 4%)" : LIME }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-full"
                    style={{ background: "hsl(0 0% 5%)", color: "hsl(0 0% 32%)", border: `1px solid ${BORDER}` }}>
                    {step.duration}
                  </span>
                </div>

                <h3 className="font-black text-[16px] mb-2" style={{ color: "hsl(0 0% 88%)" }}>{step.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── WHAT CAN BE GOVERNED ─── */
function Governable() {
  const categories = [
    {
      icon: Shield,
      title: "Risk Parameters",
      items: ["Min collateral ratio (testnet: 150%)", "Liquidation threshold (testnet: 130%)", "Liquidation bonus (testnet: 10%)", "Max debt per vault", "Debt ceiling per collateral type"],
    },
    {
      icon: TrendingUp,
      title: "Fee Parameters",
      items: ["Stability fee rate (testnet: 0.5% / yr)", "Mint fee (testnet: 0.1%)", "Redemption fee (testnet: 0.5%)", "APX staking reward rate", "Fee revenue allocation"],
    },
    {
      icon: Layers,
      title: "Collateral Onboarding",
      items: ["Approve new collateral asset types", "Set LTV ratios per collateral", "Configure oracle sources per asset", "Set debt ceilings per collateral", "Suspend or delist collateral"],
    },
    {
      icon: Globe,
      title: "Protocol Upgrades",
      items: ["Deploy new contract versions via timelock", "Add new protocol modules", "Integrate external protocols", "Transition from mock to live oracle", "Emergency shutdown (planned: 2/3 supermajority)"],
    },
  ];

  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <Tag>Planned Governable Parameters</Tag>
          <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
            Designed for<br /><span style={{ color: LIME }}>APX Holder Control</span>
          </h2>
          <p className="text-[14px] max-w-xl" style={{ color: "hsl(0 0% 40%)" }}>
            These parameters are intended to be governed by APX holders once the governance contract is deployed.
            Today all protocol parameters are set by the deployer wallet. Governance is the goal, not the current state.
            Testnet values are shown for reference.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className="relative rounded-xl p-6 overflow-hidden"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <LBracket size={11} color={`${LIME}25`} />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: LIME_DIM, border: `1px solid ${LIME_BORDER}` }}>
                    <Icon className="w-4 h-4" style={{ color: LIME }} />
                  </div>
                  <h3 className="font-black text-[16px]" style={{ color: "hsl(0 0% 88%)" }}>{cat.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: "hsl(0 0% 42%)" }}>
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: `${LIME}70` }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Proposals() {
  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-14">
          <div>
            <Tag>Proposals</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight" style={{ color: "hsl(0 0% 94%)" }}>
              No Proposals<br /><span style={{ color: LIME }}>Yet</span>
            </h2>
          </div>
        </div>

        {/* Empty state, no proposals yet */}
        <div className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center py-24 px-8 text-center"
          style={{ background: "hsl(0 0% 6%)", border: `1px solid ${BORDER}` }}>
          <LBracket size={18} color={`${LIME}18`} />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: `${LIME}10`, border: `1px solid ${LIME}20` }}>
            <Vote className="w-6 h-6" style={{ color: LIME }} />
          </div>
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase mb-3" style={{ color: "hsl(0 0% 28%)" }}>
            No proposals yet
          </div>
          <h3 className="font-black text-xl uppercase tracking-tight mb-3" style={{ color: "hsl(0 0% 80%)" }}>
            Governance is Coming
          </h3>
          <p className="text-[13px] leading-relaxed max-w-md" style={{ color: "hsl(0 0% 36%)" }}>
            On-chain proposals will appear here once governance is live. APX holders will vote on protocol
            parameters, collateral types, risk settings, and treasury allocations.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── VOTING POWER ─── */
function VotingPower() {
  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Tag>Intended Voting Design</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-5" style={{ color: "hsl(0 0% 94%)" }}>
              Your APX.<br /><span style={{ color: LIME }}>Future Voice.</span>
            </h2>
            <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 mb-5"
              style={{ background: "hsl(35 92% 60% / 0.06)", border: "1px solid hsl(35 92% 60% / 0.25)" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(35 92% 60%)" }} />
              <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 48%)" }}>
                Voting, delegation, and proposals are not available yet. The governance contract is not deployed.
                The items below describe the intended design.
              </p>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 44%)" }}>
              The design intent: every APX token grants one vote, with no multipliers or time-weighted bonuses.
              One token, one vote, simple and transparent.
            </p>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: "hsl(0 0% 44%)" }}>
              Holders who prefer not to vote would be able to delegate their voting power to a trusted address.
              Delegation would be revocable at any time on-chain.
            </p>
            <div className="space-y-3">
              {[
                "Planned: vote with staked or unstaked APX equally",
                "Planned: delegate to any wallet with a single transaction",
                "Planned: revoke delegation at any time",
                "Planned: propose with ≥ 10,000 APX or sufficient delegation",
                "Planned: all votes recorded on-chain and publicly auditable",
              ].map((text) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "hsl(0 0% 8%)", border: `1px solid hsl(0 0% 15%)` }}>
                    <Clock className="w-2.5 h-2.5" style={{ color: "hsl(0 0% 38%)" }} />
                  </div>
                  <span className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Voting thresholds card */}
          <div className="relative rounded-2xl p-8 overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${LIME}18` }}>
            <LBracket size={14} color={`${LIME}25`} />
            <div className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>
              Planned Governance Thresholds
            </div>
            <div className="text-[10px] mb-6" style={{ color: "hsl(35 92% 60%)" }}>Design spec, contract not deployed</div>

            <div className="space-y-5">
              {[
                { label: "Proposal Threshold",      val: "10,000 APX",    sub: "Min. to submit a proposal", color: LIME },
                { label: "Quorum",                  val: "4% of supply",  sub: "4M APX must participate", color: LIME },
                { label: "Standard Approval",       val: "> 50% FOR",     sub: "Simple majority to pass", color: LIME },
                { label: "Supermajority",           val: "≥ 66.7% FOR",   sub: "Required for emergency shutdown", color: "hsl(0 80% 62%)" },
                { label: "Voting Period",           val: "5 days",        sub: "Window to cast votes", color: "hsl(0 0% 52%)" },
                { label: "Timelock",                val: "48 hours",      sub: "Delay before execution", color: "hsl(0 0% 52%)" },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between pb-5"
                  style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div className="text-[11px]" style={{ color: "hsl(0 0% 32%)" }}>{t.label}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "hsl(0 0% 24%)" }}>{t.sub}</div>
                  </div>
                  <div className="font-black text-[14px]" style={{ color: t.color }}>{t.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    {
      q: "Do I need to hold APX to participate in governance?",
      a: "Governance is not yet live. There is nothing to vote on today. When the governance contract is deployed, yes: voting and proposing will require APX tokens. APX is live on Mainnet (4663) for staking right now.",
    },
    {
      q: "Does staking APX affect my future voting power?",
      a: "The intended design is that both staked and unstaked APX count equally for voting. This has not been implemented. It is a design goal for when governance launches.",
    },
    {
      q: "Can the team override protocol parameters right now?",
      a: "Yes. Currently the deployer wallet is the owner of all testnet contracts and can change parameters directly. There is no on-chain governance or timelock protecting against this. Decentralising control via APX governance is the stated goal, not the current reality.",
    },
    {
      q: "What is delegation? (planned feature)",
      a: "In the intended design, delegation lets you assign your voting power to a trusted wallet without moving your APX. The delegate votes on your behalf; you keep full ownership of your tokens and can revoke delegation at any time. This feature requires the governance contract, which is not yet deployed.",
    },
    {
      q: "What protects against a bad governance proposal? (planned)",
      a: "The intended design includes a 48-hour timelock between a proposal passing and its execution. This gives the community a window to react. The timelock contract does not exist yet. This protection is not live.",
    },
    {
      q: "When will governance launch?",
      a: "No timeline is set. Governance requires: (1) a completed independent audit, (2) deployment of the governance contract, (3) community testing. None of these are done. This page describes the intended design only.",
    },
  ];

  return (
    <section className="py-24 px-8" style={{ borderTop: `1px solid ${BORDER}`, background: "hsl(0 0% 5%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-16">
          <div>
            <Tag>FAQ</Tag>
            <h2 className="font-black text-4xl uppercase leading-tight mb-4" style={{ color: "hsl(0 0% 94%)" }}>
              Governance<br /><span style={{ color: LIME }}>Questions</span>
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
                Governance is coming. Staking is live now.
              </div>
              <h2 className="font-black text-3xl lg:text-4xl uppercase leading-tight mb-2" style={{ color: "hsl(0 0% 4%)" }}>
                Stake APX.<br />Prepare to govern.
              </h2>
              <p className="text-[13px]" style={{ color: "hsl(0 0% 22%)" }}>
                APX staking is live on Mainnet (4663). When governance launches, your APX will be your vote.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button className="inline-flex items-center gap-2 font-black px-8 py-3.5 rounded text-sm cursor-not-allowed"
                style={{ background: "hsl(0 0% 4% / 0.4)", color: "hsl(0 0% 25%)" }}
                disabled>
                <Vote className="w-4 h-4" /> Vote Now (Coming Soon)
              </button>
              <Link href="/staking">
                <button className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded text-sm"
                  style={{ background: "hsl(0 0% 4% / 0.12)", color: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 4% / 0.2)" }}>
                  Stake APX <ArrowRight className="w-4 h-4" />
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
          {[{ l: "Home", h: "/" }, { l: "Protocol", h: "/protocol" }, { l: "Staking", h: "/staking" }, { l: "Docs", h: "/docs" }].map((x) => (
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

export default function GovernancePage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: BG }}>
      <TopBar />
      <Hero />
      <HowItWorks />
      <Governable />
      <Proposals />
      <VotingPower />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
