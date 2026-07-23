import { Link } from "wouter";
import {
  ArrowRight, Lock, BarChart2, Zap,
  Building2, Code2, Vault, ChevronRight,
  Twitter, Github, MessageSquare, FileText,
  Droplets, HandMetal, Leaf,
} from "lucide-react";

/* ─────────────────────── Constants ─────────────────────── */

const LIME = "hsl(79 100% 57%)";      // #BAFF29
const LIME_DIM = "hsl(79 100% 57% / 0.08)";
const LIME_BORDER = "hsl(79 100% 57% / 0.2)";
const EMERALD = "hsl(152 70% 48%)";
const WARNING = "hsl(38 92% 58%)";
const DANGER = "hsl(0 80% 58%)";

const BORDER = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG_RAISED = "hsl(0 0% 8%)";

/* ─────────────────────── Shared helpers ─────────────────────── */

function LimeBtn({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href}>
      <button
        className={`inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded text-sm transition-all ${className}`}
        style={{
          background: LIME,
          color: "hsl(0 0% 4%)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 28px hsl(79 100% 57% / 0.4)`;
          (e.currentTarget as HTMLButtonElement).style.background = "hsl(79 100% 64%)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
          (e.currentTarget as HTMLButtonElement).style.background = LIME;
        }}
      >
        {children}
      </button>
    </Link>
  );
}

function OutlineBtn({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded text-sm transition-all text-muted-foreground hover:text-foreground"
      style={{ border: `1px solid ${BORDER}` }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "hsl(0 0% 20%)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = BORDER)}
    >
      {children}
    </a>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-widest mb-4"
      style={{
        background: LIME_DIM,
        color: LIME,
        border: `1px solid ${LIME_BORDER}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: LIME }}
      />
      {children}
    </span>
  );
}

/* ─────────────────────── NAV ─────────────────────── */

function Nav() {
  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: "hsl(0 0% 3% / 0.9)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img src="/favicon.png" alt="APEX" className="w-7 h-7 rounded" />
            <span className="text-foreground font-bold text-base tracking-tight">
              USDAX <span style={{ color: "hsl(0 0% 40%)" }}>finance</span>
            </span>
          </div>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
          {[
            { label: "Product", href: "#product" },
            { label: "Features", href: "#features" },
            { label: "Use Cases", href: "#use-cases" },
            { label: "Staking", href: "#staking" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

      </div>
    </nav>
  );
}

/* ─────────────────────── MOCK DASHBOARD ─────────────────────── */

function Chip({ label }: { label: string }) {
  return (
    <div
      className="text-[11px] font-semibold px-3 py-1.5 rounded-md text-center"
      style={{
        background: "hsl(0 0% 8%)",
        border: "1px solid hsl(0 0% 12%)",
        color: "hsl(0 0% 52%)",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </div>
  );
}

function MockDashboard() {
  const leftChips  = ["Minting", "USDAX", "Yield"];
  const rightChips = ["Staking", "Governance", "APX"];

  return (
    <div className="w-full max-w-[460px] mx-auto lg:mx-0">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "hsl(0 0% 5%)",
          border: "1px solid hsl(0 0% 11%)",
          boxShadow: "0 32px 72px hsl(0 0% 0% / 0.75)",
        }}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid hsl(0 0% 9%)" }}
        >
          <span
            className="text-[11px] font-bold tracking-[0.18em] uppercase"
            style={{ color: LIME }}
          >
            ◈ APEX
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-mono rounded-full px-2.5 py-0.5"
            style={{
              background: `${EMERALD}12`,
              color: EMERALD,
              border: `1px solid ${EMERALD}28`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
            LIVE
          </span>
        </div>

        {/* ── Title with brackets ── */}
        <div className="px-5 pt-5 pb-4 text-center">
          <p
            className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "hsl(0 0% 30%)" }}
          >
            Yield-bearing stablecoin
          </p>
          <div className="flex items-center justify-center">
            {/* Left brackets — wave travels outer→inner (delay increases inward) */}
            <div className="flex items-center">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="font-black select-none"
                  style={{
                    color: LIME,
                    fontSize: 48,
                    lineHeight: 1,
                    letterSpacing: "-4px",
                    animation: `bracket-scan 2.4s ease-in-out ${i * 0.18}s infinite alternate`,
                  }}
                >
                  (
                </span>
              ))}
            </div>

            <h3
              className="text-[17px] font-black uppercase leading-[1.2] tracking-wide mx-4"
              style={{ color: "hsl(0 0% 92%)" }}
            >
              USDAX{" "}
              <span style={{ color: LIME }}>PROTOCOL</span>
              <br />
              <span style={{ color: "hsl(0 0% 48%)", fontSize: 13, fontWeight: 600 }}>
                ON ROBINHOOD CHAIN
              </span>
            </h3>

            {/* Right brackets — wave mirrors left: inner→outer (delay decreases outward) */}
            <div className="flex items-center">
              {[3, 2, 1, 0].map((i) => (
                <span
                  key={i}
                  className="font-black select-none"
                  style={{
                    color: LIME,
                    fontSize: 48,
                    lineHeight: 1,
                    letterSpacing: "-4px",
                    animation: `bracket-scan 2.4s ease-in-out ${i * 0.18}s infinite alternate`,
                  }}
                >
                  )
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Node grid ── */}
        <div
          className="mx-5 mb-5 rounded-xl p-4"
          style={{ background: "hsl(0 0% 4%)", border: "1px solid hsl(0 0% 8%)" }}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">

            {/* Left chips */}
            <div className="flex flex-col gap-2">
              {leftChips.map((l) => <Chip key={l} label={l} />)}
            </div>

            {/* Center logo icon */}
            <div className="flex flex-col items-center gap-2 px-2">
              <img
                src="/apex-logo-circle.png"
                alt="APEX"
                className="w-12 h-12 rounded-full"
              />
              {/* Liquidation chip below center icon */}
              <div
                className="text-[10px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
                style={{
                  background: "hsl(0 0% 8%)",
                  border: "1px solid hsl(0 0% 12%)",
                  color: "hsl(0 0% 52%)",
                }}
              >
                Liquidation
              </div>
            </div>

            {/* Right chips */}
            <div className="flex flex-col gap-2">
              {rightChips.map((r) => <Chip key={r} label={r} />)}
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div
          className="grid grid-cols-3"
          style={{ borderTop: "1px solid hsl(0 0% 9%)" }}
        >
          {[
            { value: "$1.00", label: "USDAX Pegged", color: "hsl(0 0% 88%)" },
            { value: "15%",   label: "Base APY",     color: LIME },
            { value: "150%",  label: "Collateral",   color: EMERALD },
          ].map((s, i) => (
            <div
              key={s.label}
              className="py-4 text-center"
              style={{
                borderRight: i < 2 ? "1px solid hsl(0 0% 9%)" : undefined,
              }}
            >
              <div
                className="text-[11px] font-semibold mb-1.5"
                style={{ color: "hsl(0 0% 25%)" }}
              >
                +
              </div>
              <div
                className="text-lg font-black font-mono"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div
                className="text-[9px] uppercase tracking-widest mt-1"
                style={{ color: "hsl(0 0% 28%)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────── TICKER ─────────────────────── */

function Ticker() {
  const items = [
    "USDAX pegged at $1.00",
    "APX staking APY: 15%",
    "TVL: $56,333",
    "Robinhood Chain · ID 46630",
    "Collateral ratio: 150%",
    "USDAX minted: 26,700",
    "Active vaults: 8",
    "APX supply: 100M max",
  ];
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden py-3"
      style={{
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        background: "hsl(0 0% 4%)",
      }}
    >
      <div className="flex animate-ticker whitespace-nowrap" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 text-[11px] font-mono tracking-wide px-8"
            style={{ color: "hsl(0 0% 35%)" }}
          >
            <span style={{ color: LIME }}>◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── HERO ─────────────────────── */

function Hero() {
  return (
    <>
      <section className="relative pt-28 pb-20 px-8 overflow-hidden grid-bg">
        {/* Radial lime glow top-right */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[55%] h-[65%]"
          style={{
            background: `radial-gradient(ellipse at 80% 10%, ${LIME}0D 0%, transparent 65%)`,
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-20 items-center">
            {/* Left */}
            <div>
              {/* Live badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono mb-7"
                style={{
                  background: "hsl(0 0% 7%)",
                  border: `1px solid ${BORDER}`,
                  color: "hsl(0 0% 45%)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-ping-slow"
                  style={{ background: EMERALD }}
                />
                Live · Robinhood Chain 46630
              </div>

              <h1
                className="text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-[1.0] tracking-tight text-foreground"
              >
                Where
                <br />
                Money{" "}
                <span className="gradient-text">Grows</span>
              </h1>

              <p className="text-[15px] text-muted-foreground mt-6 max-w-md leading-relaxed">
                A programmable, yield-bearing stablecoin for native value accrual and seamless
                DeFi integration on Robinhood Chain.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <LimeBtn href="/app">
                  <Zap className="h-3.5 w-3.5" /> Try it now
                </LimeBtn>
                <OutlineBtn href="#product">
                  Explore Protocol <ArrowRight className="h-3.5 w-3.5" />
                </OutlineBtn>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {[LIME, EMERALD, "hsl(38 92% 58%)", "hsl(0 0% 45%)"].map((bg, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: bg,
                        color: "hsl(0 0% 4%)",
                        border: "2px solid hsl(0 0% 3%)",
                      }}
                    >
                      {["A", "B", "C", "+"][i]}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-muted-foreground">
                  <span className="text-foreground font-semibold">2,000+</span> early adopters
                </span>
              </div>

              {/* Quick stat pills */}
              <div className="flex gap-6 mt-10 pt-10" style={{ borderTop: `1px solid ${BORDER}` }}>
                {[
                  { value: "1400+", label: "Active users" },
                  { value: "28+", label: "Vault types" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-extrabold font-mono" style={{ color: LIME }}>
                      {s.value}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <MockDashboard />
          </div>
        </div>
      </section>

      <Ticker />
    </>
  );
}

/* ─────────────────────── TRUSTED BY ─────────────────────── */

function TrustedBy() {
  const logos = [
    "CHAINLINK", "Robinhood", "OpenAI", "Perplexity",
    "KUKUIN", "MGC", "NxGen", "Matter Labs",
    "DEXTools", "NGRAVE", "emergent", "Lovalib",
  ];

  return (
    <section className="py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <p
          className="text-center text-[10px] uppercase tracking-[0.2em] font-semibold mb-10"
          style={{ color: "hsl(0 0% 28%)" }}
        >
          Backed by the best companies &amp; visionary angels
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
          {logos.map((name) => (
            <span
              key={name}
              className="text-[13px] font-semibold tracking-wider cursor-default transition-colors duration-200"
              style={{ color: "hsl(0 0% 20%)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "hsl(0 0% 55%)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "hsl(0 0% 20%)")}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── WHAT IS USDAX ─────────────────────── */

function BracketCard({ title, desc, color, offset = false }: {
  title: string;
  desc: string;
  color: string;
  offset?: boolean;
}) {
  const BW = 18;

  return (
    <div
      className="relative p-7 overflow-hidden transition-all duration-300 cursor-default"
      style={{
        marginLeft: offset ? "2.5rem" : "0",
        background: "hsl(0 0% 7%)",
        border: `1px solid hsl(0 0% 12%)`,
        borderTop: `1px solid ${color}30`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${color}40`;
        el.style.borderTopColor = `${color}70`;
        el.style.background = "hsl(0 0% 8%)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "hsl(0 0% 12%)";
        el.style.borderTopColor = `${color}30`;
        el.style.background = "hsl(0 0% 7%)";
      }}
    >
      {/* Top-left color bloom */}
      <div className="pointer-events-none absolute -top-6 -left-6 w-32 h-32 rounded-full" style={{
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        filter: "blur(16px)",
      }} />

      {/* Corner brackets */}
      <span className="absolute top-0 left-0" style={{
        display: "block", width: BW, height: BW,
        borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`,
      }} />
      <span className="absolute top-0 right-0" style={{
        display: "block", width: BW, height: BW,
        borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`,
      }} />
      <span className="absolute bottom-0 left-0" style={{
        display: "block", width: BW, height: BW,
        borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`,
      }} />
      <span className="absolute bottom-0 right-0" style={{
        display: "block", width: BW, height: BW,
        borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`,
      }} />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-[11px] font-black tracking-[0.22em] uppercase mb-5"
          style={{ color }}>
          {title}
        </p>
        <p className="text-[26px] font-extralight text-center leading-none select-none my-4"
          style={{ color: `${color}50` }}>
          +
        </p>
        <p className="text-[12px] leading-relaxed mt-5" style={{ color: "hsl(0 0% 40%)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function WhatIsUSDax() {
  return (
    <section
      id="product"
      className="py-24 px-8 overflow-hidden"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── LEFT: headline + giant stat ── */}
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.28em] uppercase mb-8"
              style={{ color: "hsl(0 0% 28%)" }}
            >
              ◈ APEX PROTOCOL
            </p>

            <h2
              className="text-4xl md:text-[2.85rem] font-extrabold leading-[1.1] tracking-tight uppercase mb-14"
              style={{ color: "hsl(0 0% 94%)" }}
            >
              YOUR STABLECOIN<br />
              EARNS YIELD<br />
              <span style={{ color: LIME }}>BY DEFAULT</span>
            </h2>

            {/* Giant stat with lime glow */}
            <div className="relative inline-block">
              {/* Background bloom behind the number */}
              <div className="pointer-events-none absolute inset-0 -z-10" style={{
                background: `radial-gradient(ellipse 90% 60% at 20% 80%, ${LIME}35 0%, transparent 65%)`,
                filter: "blur(28px)",
                transform: "translateY(20px)",
              }} />

              <span
                className="font-extrabold font-mono leading-none select-none"
                style={{
                  fontSize: "clamp(100px, 16vw, 160px)",
                  color: "hsl(0 0% 94%)",
                  display: "block",
                  lineHeight: 1,
                  textShadow: `0 0 80px ${LIME}40, 0 40px 80px ${LIME}30`,
                }}
              >
                15
              </span>
              <span
                className="absolute font-extrabold font-mono leading-none"
                style={{
                  fontSize: "clamp(52px, 8vw, 80px)",
                  color: LIME,
                  bottom: "8px",
                  right: "-0.55em",
                  lineHeight: 1,
                  textShadow: `0 0 40px ${LIME}80`,
                }}
              >
                %
              </span>

              {/* Floor glow */}
              <div className="pointer-events-none absolute -bottom-8 left-0 w-48 h-20" style={{
                background: `radial-gradient(ellipse 100% 100% at 20% 0%, ${LIME}45 0%, transparent 70%)`,
                filter: "blur(20px)",
              }} />
            </div>

            <p className="text-[13px] mt-10 max-w-[280px] leading-relaxed"
              style={{ color: "hsl(0 0% 34%)" }}>
              base APY earned by USDAX holders on Robinhood Chain — compounding automatically, no action required.
            </p>
            <p className="text-[10px] mt-4 font-mono" style={{ color: "hsl(0 0% 20%)" }}>
              Source: APEX Protocol on-chain data · usdax.finance
            </p>
          </div>

          {/* ── RIGHT: staggered bracket cards ── */}
          <div className="flex flex-col gap-4">
            <BracketCard
              title="Stable at $1.00"
              desc="Overcollateralized at 150% minimum — your USDAX is always redeemable at face value, no algorithmic tricks."
              color={LIME}
              offset={false}
            />
            <BracketCard
              title="Yield-Bearing"
              desc="USDAX earns 15% base APY automatically. Hold it in your wallet and watch the balance grow."
              color={EMERALD}
              offset={true}
            />
            <BracketCard
              title="Fully On-Chain"
              desc="Every mint is backed by verifiable on-chain collateral. No black boxes, no custodians, no counterparty risk."
              color={WARNING}
              offset={false}
            />
          </div>

        </div>

        {/* Metrics strip */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px mt-20"
          style={{ background: BORDER }}
        >
          {[
            { value: "150%", label: "Collateral Ratio", color: LIME },
            { value: "15%",  label: "Base APY",         color: EMERALD },
            { value: "7d",   label: "Unstake Cooldown", color: WARNING },
            { value: "100M", label: "APX Max Supply",   color: "hsl(0 0% 55%)" },
          ].map((m) => (
            <div key={m.label} className="py-8 text-center" style={{ background: CARD_BG }}>
              <div className="text-3xl font-extrabold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
              <div className="text-[10px] mt-2 uppercase tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FEATURES ─────────────────────── */

function Features() {
  const bullets = [
    {
      icon: Lock,
      title: "Smart Liquidation Protection",
      desc: "Real-time health factor monitoring keeps positions safe above 1.0x threshold.",
    },
    {
      icon: BarChart2,
      title: "Yield Optimization Engine",
      desc: "APX rewards auto-compound. Base 15% APY, higher for long-term stakers.",
    },
    {
      icon: Zap,
      title: "Cross-Chain Ready",
      desc: "Native on Robinhood Chain (Arbitrum Orbit) with future Ethereum bridges.",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 px-8"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Left */}
          <div>
            <Tag>APEX Engine</Tag>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Improve Outcomes &amp;{" "}
              <span className="gradient-text">Automate Workflows</span>
            </h2>
            <p
              className="mt-4 text-[15px] leading-relaxed"
              style={{ color: "hsl(0 0% 42%)" }}
            >
              APEX centralizes financial data, automates repetitive DeFi workflows, and
              enhances decision-making with real-time on-chain intelligence.
            </p>

            <div className="mt-10 space-y-6">
              {bullets.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5"
                      style={{ background: "hsl(0 0% 8%)", border: `1px solid ${BORDER}` }}
                    >
                      <Icon
                        className="h-3.5 w-3.5"
                        style={{ color: i === 0 ? LIME : i === 1 ? EMERALD : "hsl(0 0% 55%)" }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">{b.title}</h4>
                      <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>
                        {b.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10">
              <LimeBtn href="/app">
                Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </LimeBtn>
            </div>
          </div>

          {/* Right — protocol panel */}
          <div
            className="rounded-xl p-6"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2 text-[13px]" style={{ color: "hsl(0 0% 45%)" }}>
                <BarChart2 className="h-4 w-4" style={{ color: LIME }} />
                Protocol Dashboard
              </div>
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full font-mono"
                style={{
                  background: `${EMERALD}14`,
                  color: EMERALD,
                  border: `1px solid ${EMERALD}25`,
                }}
              >
                ● LIVE
              </span>
            </div>

            {/* Progress bars */}
            <div className="space-y-6">
              {[
                {
                  label: "Total Value Locked",
                  value: "$56,333.75",
                  pct: 68,
                  bar: LIME,
                },
                {
                  label: "USDAX Minted",
                  value: "26,700 USDAX",
                  pct: 47,
                  bar: EMERALD,
                },
                {
                  label: "APX Staked",
                  value: "700,000 APX",
                  pct: 42,
                  bar: "hsl(0 0% 35%)",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[13px] mb-2.5">
                    <span style={{ color: "hsl(0 0% 42%)" }}>{row.label}</span>
                    <span className="font-mono font-semibold text-foreground">{row.value}</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "hsl(0 0% 10%)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${row.pct}%`,
                        background: row.bar,
                        boxShadow: row.bar === LIME ? `0 0 8px ${LIME_BORDER}` : undefined,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom stats */}
            <div
              className="mt-7 pt-6 grid grid-cols-3"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              {[
                { label: "Active Vaults", value: "8" },
                { label: "Stakers", value: "5" },
                { label: "At-Risk", value: "1" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-extrabold font-mono text-foreground">{s.value}</div>
                  <div
                    className="text-[10px] mt-1 uppercase tracking-widest"
                    style={{ color: "hsl(0 0% 32%)" }}
                  >
                    {s.label}
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

/* ─────────────────────── USE CASES ─────────────────────── */

function UseCases() {
  const cases = [
    {
      icon: Building2,
      title: "Business",
      desc: "Offer USDAX as a yield-bearing product on your platform. Boost user engagement with passive income on idle capital.",
      color: LIME,
    },
    {
      icon: Code2,
      title: "Developers",
      desc: "Integrate via simple ERC-20 interfaces. Leverage open-source contracts for collateral management and staking.",
      color: "hsl(0 0% 60%)",
    },
    {
      icon: Vault,
      title: "Treasuries",
      desc: "Diversify treasury with a stable, yield-bearing asset. Earn on idle capital while maintaining full dollar parity.",
      color: EMERALD,
    },
  ];

  return (
    <section
      id="use-cases"
      className="py-24 px-8"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Tag>Use Cases</Tag>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Built for{" "}
            <span className="gradient-text">Everyone</span>
          </h2>
          <p
            className="max-w-xl mx-auto mt-4 text-[15px] leading-relaxed"
            style={{ color: "hsl(0 0% 40%)" }}
          >
            APEX offers use cases for developers, businesses, and treasuries seeking secure,
            profitable stablecoin integrations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="rounded-xl p-8 card-hover"
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div
                  className="w-11 h-11 rounded flex items-center justify-center mb-6"
                  style={{ background: `${c.color}10`, border: `1px solid ${c.color}18` }}
                >
                  <Icon className="h-5 w-5" style={{ color: c.color }} />
                </div>
                <h3 className="text-lg font-bold mb-3">{c.title}</h3>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "hsl(0 0% 40%)" }}
                >
                  {c.desc}
                </p>
                <Link href="/app">
                  <span
                    className="inline-flex items-center gap-1.5 mt-6 text-[13px] font-semibold transition-all hover:gap-2.5"
                    style={{ color: c.color }}
                  >
                    Launch App <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── STAKING CTA ─────────────────────── */

function StakingCTA() {
  return (
    <section
      id="staking"
      className="py-24 px-8"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* Lime glow bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${LIME}08 0%, transparent 70%)`,
            }}
          />
          {/* Top lime line */}
          <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${LIME}40, transparent)` }} />

          <div className="relative z-10 p-12 md:p-16 text-center">
            <Tag>Staking</Tag>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
              Stake <span className="gradient-text">APX</span> &amp; Earn Up to{" "}
              <span style={{ color: LIME }}>15% APY</span>
            </h2>
            <p
              className="max-w-lg mx-auto mt-4 text-[15px] leading-relaxed"
              style={{ color: "hsl(0 0% 42%)" }}
            >
              Lock APX tokens, earn passive rewards, and participate in protocol governance.
              7-day cooldown ensures long-term alignment.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <LimeBtn href="/app/staking">
                <Lock className="h-3.5 w-3.5" /> Stake Now
              </LimeBtn>
              <OutlineBtn href="/app">View Dashboard</OutlineBtn>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-0 mt-12 pt-10"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              {[
                { value: "15%", label: "Base APY", color: LIME },
                { value: "7d", label: "Cooldown Period", color: WARNING },
                { value: "100M", label: "APX Max Supply", color: EMERALD },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="text-3xl font-extrabold font-mono"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-[10px] mt-2 uppercase tracking-widest"
                    style={{ color: "hsl(0 0% 32%)" }}
                  >
                    {s.label}
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

/* ─────────────────────── FOOTER ─────────────────────── */

function Footer() {
  const cols = [
    {
      title: "Protocol",
      links: ["USDAX", "APX Token", "Staking", "Governance"],
    },
    {
      title: "Developers",
      links: ["Documentation", "GitHub", "Audit Report", "Bug Bounty"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Contact"],
    },
  ];

  return (
    <footer
      className="py-14 px-8"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-7 h-7 rounded flex items-center justify-center font-black text-[11px]"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              >
                AP
              </div>
              <span className="font-bold text-base">APEX</span>
            </div>
            <p
              className="text-[13px] leading-relaxed max-w-[180px]"
              style={{ color: "hsl(0 0% 35%)" }}
            >
              Programmable stablecoin infrastructure for the next generation of DeFi.
            </p>
            <div className="flex gap-4 mt-6">
              {[Twitter, Github, MessageSquare, FileText].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="transition-colors"
                  style={{ color: "hsl(0 0% 22%)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 55%)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 22%)")}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4
                className="text-[11px] font-semibold uppercase tracking-widest mb-5"
                style={{ color: "hsl(0 0% 30%)" }}
              >
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[13px] transition-colors"
                      style={{ color: "hsl(0 0% 35%)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 35%)")}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]"
          style={{
            borderTop: `1px solid ${BORDER}`,
            color: "hsl(0 0% 25%)",
          }}
        >
          <span>© 2026 APEX Protocol · <a href="https://usdax.finance" style={{ color: "inherit" }}>usdax.finance</a> · All rights reserved.</span>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
              <a
                key={l}
                href="#"
                className="transition-colors hover:text-muted-foreground"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── ROOT ─────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <TrustedBy />
      <WhatIsUSDax />
      <Features />
      <UseCases />
      <StakingCTA />
      <Footer />
    </div>
  );
}
