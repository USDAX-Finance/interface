import { Link } from "wouter";
import {
  ArrowRight, Lock, BarChart2, Zap,
  Building2, Code2, Vault, ChevronRight,
  Twitter, Github, MessageSquare, FileText,
  Droplets, HandMetal, Leaf,
  Briefcase, Terminal, Landmark,
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
            { label: "Product",  href: "#product" },
            { label: "Features", href: "#features" },
            { label: "Use Cases",href: "#use-cases" },
            { label: "Staking",  href: "#staking" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
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
  const items: React.ReactNode[] = [
    "USDAX pegged at $1.00",
    "APX staking APY: 15%",
    "TVL: $56,333",
    <span key="rh" className="inline-flex items-center gap-1.5">
      <img src="/robinhood-logo.webp" alt="Robinhood" style={{ height: 11, filter: "grayscale(1) brightness(1.8)", opacity: 0.55 }} />
      Chain · ID 46630
    </span>,
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

const DATA_BITS = [
  { text: "11 99 28", x: "58%", y: "7%"  },
  { text: "22 74 06", x: "63%", y: "11%" },
  { text: "27 16 64", x: "68%", y: "7%"  },
  { text: "93 09 32", x: "73%", y: "11%" },
  { text: "41 23",    x: "78%", y: "7%"  },
  { text: "49 33",    x: "82%", y: "11%" },
];

function Hero() {
  return (
    <>
      <section
        className="relative overflow-hidden select-none"
        style={{ minHeight: "100vh", background: "hsl(0 0% 2%)" }}
      >

        {/* ── scattered data numbers top-right ── */}
        {DATA_BITS.map((d, i) => (
          <div key={i} className="pointer-events-none absolute font-mono text-[9px] leading-loose"
            style={{ left: d.x, top: d.y, color: LIME, opacity: 0.18 }}>
            {d.text}
          </div>
        ))}

        {/* ── + symbols ── */}
        {[
          { x: "84%", y: "18%", size: 18 },
          { x: "87%", y: "26%", size: 13 },
          { x: "82%", y: "32%", size: 10 },
          { x: "10%", y: "62%", size: 12 },
        ].map((p, i) => (
          <div key={i} className="pointer-events-none absolute font-thin"
            style={{ left: p.x, top: p.y, color: LIME, opacity: 0.3, fontSize: p.size, lineHeight: 1 }}>+</div>
        ))}

        {/* ── geometric L-brackets centered ── */}
        {/* top-left of center bracket */}
        <div className="pointer-events-none absolute"
          style={{ left: "44%", top: "14%", width: 44, height: 90,
            borderLeft: `3px solid ${LIME}`, borderTop: `3px solid ${LIME}`, opacity: 0.55 }} />
        {/* top-right of center bracket */}
        <div className="pointer-events-none absolute"
          style={{ right: "44%", top: "14%", width: 44, height: 90,
            borderRight: `3px solid ${LIME}`, borderTop: `3px solid ${LIME}`, opacity: 0.55 }} />
        {/* bottom-left of center bracket */}
        <div className="pointer-events-none absolute"
          style={{ left: "44%", top: "50%", width: 44, height: 90,
            borderLeft: `3px solid ${LIME}`, borderBottom: `3px solid ${LIME}`, opacity: 0.55 }} />
        {/* bottom-right of center bracket */}
        <div className="pointer-events-none absolute"
          style={{ right: "44%", top: "50%", width: 44, height: 90,
            borderRight: `3px solid ${LIME}`, borderBottom: `3px solid ${LIME}`, opacity: 0.55 }} />

        {/* ── USDAX CIRCLE — centered inside brackets ── */}
        <div
          className="pointer-events-none absolute flex flex-col items-center"
          style={{ left: "50%", top: "32%", transform: "translate(-50%, -50%)", zIndex: 5 }}
        >
          <img src="/apex-coin-logo.png" alt="APEX"
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
          />
          <div className="mt-2.5 text-center">
            <p className="font-black font-mono text-[11px] tracking-[0.22em]"
              style={{ color: LIME, lineHeight: 1 }}>
              USDAX
            </p>
            <p className="text-[8px] font-mono tracking-widest mt-0.5"
              style={{ color: "hsl(0 0% 45%)" }}>
              $1.00 · STABLE
            </p>
          </div>
        </div>

        {/* ── HANDS — single composited image ── */}
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
          <img
            src="/hands.png"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 30%",
              filter: [
                "drop-shadow(0 0 18px hsl(79 100% 57% / 0.65))",
                "drop-shadow(0 0 55px hsl(79 100% 57% / 0.30))",
                "drop-shadow(0 0 110px hsl(79 100% 57% / 0.13))",
              ].join(" "),
            }}
          />
        </div>

        {/* ── VIGNETTE OVERLAYS — above image, below UI ── */}
        {/* Left shadow — keeps headline readable */}
        <div className="pointer-events-none absolute inset-y-0 left-0" style={{
          zIndex: 3,
          width: "45%",
          background: "linear-gradient(to right, hsl(0 0% 2%) 0%, hsl(0 0% 2% / 0.85) 40%, transparent 100%)",
        }} />
        {/* Bottom shadow — keeps CTAs + tags readable */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
          zIndex: 3,
          height: "50%",
          background: "linear-gradient(to top, hsl(0 0% 2%) 0%, hsl(0 0% 2% / 0.75) 45%, transparent 100%)",
        }} />
        {/* Top shadow — softens top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0" style={{
          zIndex: 3,
          height: "18%",
          background: "linear-gradient(to bottom, hsl(0 0% 2%) 0%, transparent 100%)",
        }} />
        {/* Right shadow — softens right edge */}
        <div className="pointer-events-none absolute inset-y-0 right-0" style={{
          zIndex: 3,
          width: "12%",
          background: "linear-gradient(to left, hsl(0 0% 2%) 0%, transparent 100%)",
        }} />

        {/* ── BOTTOM CONTENT ── */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-10 pb-10">

          {/* Left: headline + barcode strip + CTAs */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-[10px] font-mono tracking-[0.22em] uppercase"
              style={{ color: "hsl(0 0% 28%)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
              BUILT ON ROBINHOOD CHAIN
            </div>

            <h1
              className="font-black uppercase leading-none tracking-tight"
              style={{ fontSize: "clamp(3rem, 6.5vw, 6rem)", color: "hsl(0 0% 97%)" }}
            >
              ENTER THE<br />
              <span style={{ color: LIME }}>PROTOCOL</span>
            </h1>

            <p className="mt-4 mb-2 max-w-sm text-[13px] leading-relaxed"
              style={{ color: "hsl(0 0% 48%)" }}>
              Mint yield-bearing USDAX, stake APX, and earn passive income on Robinhood Chain —
              the programmable stablecoin built for DeFi.
            </p>

            {/* Barcode-style strip */}
            <div className="flex items-center gap-3 mt-5 mb-6">
              <div className="flex items-end gap-px">
                {[3,1.5,2,1,3,1.5,1,2.5,1,2,3,1.5,1,2,1,3].map((w, i) => (
                  <div key={i} style={{ width: w, height: 18 + (i % 3) * 4,
                    background: LIME, opacity: 0.35 + (i % 2) * 0.2 }} />
                ))}
              </div>
              <span className="font-mono text-[10px]" style={{ color: LIME, opacity: 0.45 }}>⊞</span>
              <span className="font-mono text-[14px]" style={{ color: LIME, opacity: 0.45 }}>+</span>
            </div>

            <div className="flex gap-3">
              <LimeBtn href="/app"><Zap className="h-3.5 w-3.5" /> Launch App</LimeBtn>
              <Link href="/protocol">
                <button
                  className="inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded text-sm transition-all text-muted-foreground hover:text-foreground"
                  style={{ border: `1px solid ${BORDER}` }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(0 0% 20%)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = BORDER)}
                >
                  Explore Protocol <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right: service tags */}
          <div className="text-right pb-1">
            <p className="text-[12px] font-mono tracking-[0.2em] font-semibold" style={{ color: LIME }}>
              // MINT // STAKE // EARN
            </p>
            <p className="text-[10px] font-mono mt-1.5" style={{ color: "hsl(0 0% 62%)" }}>
              USDAX.FINANCE · ROBINHOOD CHAIN 46630
            </p>
          </div>
        </div>

      </section>

      <Ticker />
    </>
  );
}

/* ─────────────────────── TRUSTED BY ─────────────────────── */


/* ─────────────────────── WHAT IS USDAX ─────────────────────── */

function BracketCard({ title, desc, offset = false }: {
  title: string;
  desc: string;
  color?: string;
  offset?: boolean;
}) {
  const BW = 16;

  return (
    <div
      className="relative overflow-hidden rounded-xl transition-all duration-300 cursor-default"
      style={{
        marginLeft: offset ? "2.5rem" : "0",
        background: LIME,
      }}
    >
      {/* Corner L-brackets — black */}
      {[
        { top: 0, left: 0,   borderTop:    `2px solid hsl(0 0% 4%)`, borderLeft:  `2px solid hsl(0 0% 4%)` },
        { top: 0, right: 0,  borderTop:    `2px solid hsl(0 0% 4%)`, borderRight: `2px solid hsl(0 0% 4%)` },
        { bottom: 0, left: 0,  borderBottom: `2px solid hsl(0 0% 4%)`, borderLeft:  `2px solid hsl(0 0% 4%)` },
        { bottom: 0, right: 0, borderBottom: `2px solid hsl(0 0% 4%)`, borderRight: `2px solid hsl(0 0% 4%)` },
      ].map((s, i) => (
        <span key={i} className="absolute pointer-events-none"
          style={{ ...s, width: BW, height: BW, display: "block" }} />
      ))}

      {/* Subtle dark watermark "+" */}
      <div className="pointer-events-none absolute right-5 top-4 font-black select-none"
        style={{ fontSize: 64, color: "hsl(0 0% 4%)", opacity: 0.06, lineHeight: 1 }}>+</div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <p className="text-[10px] font-black tracking-[0.26em] uppercase mb-4"
          style={{ color: "hsl(0 0% 18%)" }}>
          {title}
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 16%)" }}>
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
  const BW = 14;
  const cases = [
    {
      icon: Briefcase,
      label: "01",
      title: "Business",
      headline: "Yield for your platform.",
      desc: "Integrate USDAX as a yield-bearing product directly on your platform. Offer passive income on idle user capital, boost engagement, and differentiate with native DeFi infrastructure — no custody required.",
      color: LIME,
      stat: { val: "0.5%", sub: "annual stability fee" },
    },
    {
      icon: Terminal,
      label: "02",
      title: "Developers",
      headline: "Build on open contracts.",
      desc: "Mint, redeem, and stake via clean ERC-20 interfaces and a typed TypeScript SDK. All contracts are open-source and audited. Deploy integrations on Robinhood Chain in hours, not weeks.",
      color: "hsl(0 0% 68%)",
      stat: { val: "SDK", sub: "TypeScript · v0.1" },
    },
    {
      icon: Landmark,
      label: "03",
      title: "Treasuries",
      headline: "Stable yield on idle capital.",
      desc: "Park treasury funds in USDAX and stake APX to earn real protocol revenue. Full dollar parity, on-chain transparency, and no lock-up periods — purpose-built for DAO and corporate treasury management.",
      color: EMERALD,
      stat: { val: "40%+", sub: "APX staking APY" },
    },
  ];

  return (
    <section
      id="use-cases"
      className="py-24 px-8"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-14">
          <Tag>Use Cases</Tag>
          <h2 className="font-black text-4xl md:text-5xl uppercase leading-tight mb-4"
            style={{ color: "hsl(0 0% 94%)" }}>
            Built for <span style={{ color: LIME }}>Every</span><br className="hidden md:block" />
            Participant.
          </h2>
          <p className="text-[14px] max-w-md" style={{ color: "hsl(0 0% 38%)" }}>
            Whether you're a business, a developer, or a treasury — APEX Protocol has
            a purpose-built integration for you.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="relative rounded-xl overflow-hidden flex flex-col"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                {/* Top accent line */}
                <div className="h-0.5 w-full" style={{ background: `${c.color}60` }} />

                {/* Icon block */}
                <div className="px-7 pt-8 pb-6"
                  style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {/* Corner brackets */}
                  <span className="absolute top-1 left-0" style={{ display:"block", width: BW, height: BW, borderTop:`2px solid ${c.color}40`, borderLeft:`2px solid ${c.color}40` }} />
                  <span className="absolute top-1 right-0" style={{ display:"block", width: BW, height: BW, borderTop:`2px solid ${c.color}40`, borderRight:`2px solid ${c.color}40` }} />

                  {/* Big icon */}
                  <div className="relative inline-flex items-center justify-center rounded-2xl mb-5"
                    style={{
                      width: 72, height: 72,
                      background: `${c.color}10`,
                      border: `1px solid ${c.color}25`,
                    }}>
                    <Icon style={{ width: 32, height: 32, color: c.color, strokeWidth: 1.5 }} />
                  </div>

                  {/* Number + title row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] tracking-widest"
                      style={{ color: `${c.color}70` }}>{c.label}</span>
                    <span className="w-4 h-px" style={{ background: `${c.color}30` }} />
                    <span className="font-black text-[11px] tracking-[0.2em] uppercase"
                      style={{ color: `${c.color}90` }}>{c.title}</span>
                  </div>
                  <h3 className="font-black text-[20px] leading-tight"
                    style={{ color: "hsl(0 0% 90%)" }}>
                    {c.headline}
                  </h3>
                </div>

                {/* Body */}
                <div className="px-7 py-6 flex-1 flex flex-col">
                  <p className="text-[13px] leading-relaxed flex-1 mb-6"
                    style={{ color: "hsl(0 0% 40%)" }}>
                    {c.desc}
                  </p>

                  {/* Stat pill */}
                  <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg"
                    style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
                    <span className="font-black text-[22px]" style={{ color: c.color }}>{c.stat.val}</span>
                    <span className="text-[11px] text-right" style={{ color: "hsl(0 0% 30%)" }}>{c.stat.sub}</span>
                  </div>

                  <Link href="/app">
                    <button className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                      style={{ border: `1px solid ${c.color}30`, color: c.color }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${c.color}10`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      Get Started <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
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
    <section id="staking" className="px-8 py-16" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: LIME }}
        >
          {/* Corner L-brackets — black, matching hero style */}
          {[
            { top: 0, left: 0, borderTop: "3px solid hsl(0 0% 4%)", borderLeft: "3px solid hsl(0 0% 4%)" },
            { top: 0, right: 0, borderTop: "3px solid hsl(0 0% 4%)", borderRight: "3px solid hsl(0 0% 4%)" },
            { bottom: 0, left: 0, borderBottom: "3px solid hsl(0 0% 4%)", borderLeft: "3px solid hsl(0 0% 4%)" },
            { bottom: 0, right: 0, borderBottom: "3px solid hsl(0 0% 4%)", borderRight: "3px solid hsl(0 0% 4%)" },
          ].map((s, i) => (
            <div key={i} className="pointer-events-none absolute" style={{ ...s, width: 36, height: 36 }} />
          ))}

          {/* Scattered dark data bits */}
          {["02", "178", "46630", "APX"].map((t, i) => (
            <div key={i} className="pointer-events-none absolute font-mono font-black select-none"
              style={{
                color: "hsl(0 0% 4%)",
                opacity: 0.06,
                fontSize: ["5rem","7rem","4rem","6rem"][i],
                top: ["10%","55%","70%","20%"][i],
                left: ["5%","70%","20%","78%"][i],
                lineHeight: 1,
              }}>
              {t}
            </div>
          ))}

          <div className="relative z-10 grid lg:grid-cols-2 gap-0">

            {/* LEFT — headline + CTA */}
            <div className="p-12 md:p-14 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono font-bold tracking-[0.28em] uppercase mb-6"
                  style={{ color: "hsl(0 0% 20%)" }}>
                  ◈ STAKING · APEX PROTOCOL
                </p>
                <h2 className="font-black uppercase leading-[1.0] tracking-tight"
                  style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", color: "hsl(0 0% 4%)" }}>
                  STAKE APX.<br />
                  EARN YIELD.<br />
                  OWN THE<br />PROTOCOL.
                </h2>
                <p className="mt-6 text-[14px] leading-relaxed max-w-sm"
                  style={{ color: "hsl(0 0% 22%)" }}>
                  Lock APX tokens, earn passive rewards, and vote on protocol governance.
                  7-day unstake cooldown ensures long-term alignment.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-10">
                {/* Dark CTA button */}
                <Link href="/app/staking">
                  <button
                    className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded text-[14px] transition-all hover:opacity-90"
                    style={{ background: "hsl(0 0% 4%)", color: LIME }}
                  >
                    <Lock className="h-4 w-4" /> Stake Now
                  </button>
                </Link>
                <Link href="/app">
                  <button
                    className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded text-[14px] transition-all hover:bg-black/10"
                    style={{ color: "hsl(0 0% 10%)", border: "1.5px solid hsl(0 0% 10% / 0.25)" }}
                  >
                    View Dashboard <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT — stats grid */}
            <div
              className="p-12 md:p-14 flex flex-col justify-between"
              style={{ borderLeft: "1px solid hsl(0 0% 4% / 0.12)" }}
            >
              {/* APX coin icon */}
              <div className="flex items-center gap-3 mb-10">
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "hsl(0 0% 4%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 3px hsl(0 0% 4% / 0.15)",
                }}>
                  <img src="/apex-coin-logo.png" alt="APX" style={{ width: 28, height: 28, objectFit: "contain" }} />
                </div>
                <div>
                  <p className="font-black text-[15px]" style={{ color: "hsl(0 0% 4%)" }}>APX Token</p>
                  <p className="text-[11px] font-mono" style={{ color: "hsl(0 0% 22%)" }}>Governance · Staking</p>
                </div>
              </div>

              {/* 3 big stats */}
              <div className="space-y-0">
                {[
                  { value: "15%", label: "Base Staking APY",    sub: "compounding rewards" },
                  { value: "7d",  label: "Unstake Cooldown",     sub: "long-term alignment" },
                  { value: "100M",label: "APX Max Supply",       sub: "fixed, no inflation" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center justify-between py-5"
                    style={{ borderBottom: i < 2 ? "1px solid hsl(0 0% 4% / 0.12)" : undefined }}>
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 18%)" }}>{s.label}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(0 0% 30%)" }}>{s.sub}</p>
                    </div>
                    <p className="font-black font-mono" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "hsl(0 0% 4%)" }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom tag */}
              <p className="text-[9px] font-mono tracking-[0.2em] mt-8" style={{ color: "hsl(0 0% 28%)" }}>
                // ROBINHOOD CHAIN · ID 46630 · USDAX.FINANCE
              </p>
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
              <img src="/favicon.png" alt="APEX" className="w-7 h-7 object-contain" />
              <span className="font-bold text-base">APEX</span>
            </div>
            <p
              className="text-[13px] leading-relaxed max-w-[180px]"
              style={{ color: "hsl(0 0% 35%)" }}
            >
              Programmable stablecoin infrastructure for the next generation of DeFi.
            </p>
            <div className="flex gap-4 mt-6">
              {[
                { Icon: Twitter,      href: "https://x.com/Usdax_Finance" },
                { Icon: Github,       href: "#" },
                { Icon: MessageSquare,href: "#" },
                { Icon: FileText,     href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target={href !== "#" ? "_blank" : undefined}
                  rel={href !== "#" ? "noopener noreferrer" : undefined}
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
