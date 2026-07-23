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
      <section className="relative pt-16 pb-0 px-8 overflow-hidden">

        <div className="max-w-6xl mx-auto relative z-10">

          {/* Brand label */}
          <div className="flex items-center justify-between mb-10">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase"
              style={{ color: "hsl(0 0% 28%)" }}>
              ◈ USDAX.FINANCE
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono"
              style={{ color: "hsl(0 0% 32%)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
              Live · Robinhood Chain 46630
            </div>
          </div>

          {/* Giant brackets + headline */}
          <div className="flex items-stretch">
            {/* Left brackets — animated wave */}
            <div className="flex items-center pr-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="font-black select-none"
                  style={{
                    color: LIME,
                    fontSize: "clamp(60px, 10vw, 110px)",
                    lineHeight: 1,
                    letterSpacing: "-6px",
                    animation: `bracket-scan 2.4s ease-in-out ${i * 0.18}s infinite alternate`,
                  }}>
                  (
                </span>
              ))}
            </div>

            {/* Center headline */}
            <div className="flex-1 text-center py-4">
              <h1
                className="font-extrabold uppercase tracking-tight leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4.8vw, 4.2rem)", color: "hsl(0 0% 94%)" }}
              >
                APEX PROTOCOL<br />
                <span style={{ color: LIME }}>USDAX STABLECOIN</span><br />
                ON ROBINHOOD CHAIN
              </h1>
              <p className="text-[14px] mt-6 leading-relaxed max-w-xl mx-auto"
                style={{ color: "hsl(0 0% 38%)" }}>
                Mint yield-bearing USDAX, stake APX tokens, and earn passive income
                on Robinhood Chain — the programmable stablecoin built for DeFi.
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <LimeBtn href="/app">
                  <Zap className="h-3.5 w-3.5" /> Launch App
                </LimeBtn>
                <OutlineBtn href="#product">
                  Explore Protocol <ArrowRight className="h-3.5 w-3.5" />
                </OutlineBtn>
              </div>
            </div>

            {/* Right brackets — mirrored wave */}
            <div className="flex items-center pl-4">
              {[2, 1, 0].map((i) => (
                <span key={i} className="font-black select-none"
                  style={{
                    color: LIME,
                    fontSize: "clamp(60px, 10vw, 110px)",
                    lineHeight: 1,
                    letterSpacing: "-6px",
                    animation: `bracket-scan 2.4s ease-in-out ${i * 0.18}s infinite alternate`,
                  }}>
                  )
                </span>
              ))}
            </div>
          </div>

          {/* Chip node grid — full width, centered */}
          <div className="relative mt-8">
            {/* Center glow bloom */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div style={{
                width: 280, height: 180,
                background: `radial-gradient(ellipse at 50% 60%, ${LIME}28 0%, transparent 70%)`,
                filter: "blur(30px)",
              }} />
            </div>

            <div
              className="rounded-xl p-6 relative z-10"
              style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Left chips */}
                <div className="flex flex-col gap-2.5">
                  {["Minting", "USDAX", "Yield"].map((l) => <Chip key={l} label={l} />)}
                </div>

                {/* Center icon + Liquidation */}
                <div className="flex flex-col items-center gap-3 px-4">
                  <div className="relative">
                    <img src="/apex-logo-circle.png" alt="APEX"
                      className="w-14 h-14 rounded-full" />
                    <div className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ boxShadow: `0 0 24px ${LIME}40` }} />
                  </div>
                  <Chip label="Liquidation" />
                </div>

                {/* Right chips */}
                <div className="flex flex-col gap-2.5">
                  {["Staking", "Governance", "APX"].map((r) => <Chip key={r} label={r} />)}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                {[
                  { value: "$1.00", label: "USDAX Pegged", color: "hsl(0 0% 88%)" },
                  { value: "15%",   label: "Base APY",     color: LIME },
                  { value: "150%",  label: "Collateral",   color: EMERALD },
                ].map((s, i) => (
                  <div key={s.label} className="text-center py-3"
                    style={{ borderRight: i < 2 ? `1px solid ${BORDER}` : undefined }}>
                    <div className="text-[10px] mb-1 select-none" style={{ color: "hsl(0 0% 22%)" }}>+</div>
                    <div className="text-lg font-black font-mono" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[9px] uppercase tracking-widest mt-1" style={{ color: "hsl(0 0% 28%)" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <Ticker />
    </>
  );
}

/* ─────────────────────── TRUSTED BY ─────────────────────── */


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
  const items = [
    {
      title: "Mint USDAX",
      desc: "deposit collateral, instantly mint dollar-pegged USDAX at up to 66% LTV — no intermediaries",
    },
    {
      title: "Earn Yield",
      desc: "15% base APY compounds automatically into your balance, no manual action required",
    },
    {
      title: "Stake APX",
      desc: "lock governance tokens, earn higher APY, and vote on protocol upgrades on-chain",
    },
    {
      title: "Stay Protected",
      desc: "real-time health factor monitoring and automated liquidations keep the protocol solvent",
    },
  ];

  const bars = [28, 40, 52, 60, 72, 85, 100];

  return (
    <section
      id="features"
      className="py-24 px-8"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Section headline */}
        <h2
          className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-tight mb-16"
          style={{ color: "hsl(0 0% 94%)" }}
        >
          WE ACCELERATE YOUR<br />
          <span style={{ color: LIME }}>CAPITAL GROWTH</span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-20 items-start">

          {/* LEFT — big stat + ascending bar chart */}
          <div>
            {/* Giant stat */}
            <div className="relative inline-block mb-4">
              <div className="pointer-events-none absolute inset-0 -z-10" style={{
                background: `radial-gradient(ellipse 90% 60% at 15% 80%, ${LIME}32 0%, transparent 60%)`,
                filter: "blur(24px)",
                transform: "translateY(12px)",
              }} />
              <span
                className="font-extrabold font-mono leading-none select-none"
                style={{
                  fontSize: "clamp(90px, 14vw, 140px)",
                  color: "hsl(0 0% 93%)",
                  display: "block",
                  lineHeight: 1,
                  textShadow: `0 0 60px ${LIME}35`,
                }}
              >
                40
              </span>
              <span
                className="absolute font-extrabold font-mono"
                style={{
                  fontSize: "clamp(44px, 7vw, 68px)",
                  color: LIME,
                  bottom: "6px",
                  right: "-0.55em",
                  lineHeight: 1,
                  textShadow: `0 0 30px ${LIME}80`,
                }}
              >
                %
              </span>
            </div>

            <p className="text-[13px] mt-8 max-w-[200px] leading-relaxed"
              style={{ color: "hsl(0 0% 34%)" }}>
              average yield increase for USDAX holders
            </p>

            {/* Ascending bar chart */}
            <div className="flex items-end gap-1.5 mt-8" style={{ height: 80 }}>
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === bars.length - 1
                      ? LIME
                      : `hsl(79 100% 57% / ${0.1 + i * 0.08})`,
                    boxShadow: i === bars.length - 1 ? `0 0 12px ${LIME}60` : undefined,
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] mt-3 font-mono" style={{ color: "hsl(0 0% 20%)" }}>
              Growing protocol TVL · usdax.finance
            </p>

            <div className="mt-10">
              <LimeBtn href="/app">
                Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </LimeBtn>
            </div>
          </div>

          {/* RIGHT — "+" list, DarkPixel style */}
          <div style={{ borderTop: `1px solid ${BORDER}` }}>
            {items.map((item) => (
              <div
                key={item.title}
                className="grid gap-6 py-7"
                style={{
                  gridTemplateColumns: "auto 1fr 1.6fr",
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                {/* "+" icon */}
                <span
                  className="font-extralight select-none mt-0.5"
                  style={{ fontSize: 22, color: LIME, lineHeight: 1 }}
                >
                  +
                </span>
                {/* Title */}
                <p
                  className="font-bold text-[14px] leading-snug"
                  style={{ color: "hsl(0 0% 88%)" }}
                >
                  {item.title}
                </p>
                {/* Description */}
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ color: "hsl(0 0% 38%)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
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
      <WhatIsUSDax />
      <Features />
      <UseCases />
      <StakingCTA />
      <Footer />
    </div>
  );
}
