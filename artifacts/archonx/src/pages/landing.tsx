import { Link } from "wouter";
import {
  ArrowRight, Check, Droplets, HandMetal, Leaf,
  Building2, Code2, Vault, ChevronRight,
  Twitter, Github, MessageSquare, FileText,
  Lock, BarChart2, Zap,
} from "lucide-react";

/* ─────────────────────────── helpers ─────────────────────────── */

const C = {
  indigo: "hsl(263 70% 62%)",
  purple: "hsl(280 65% 60%)",
  emerald: "hsl(142 71% 45%)",
  cyan: "hsl(186 80% 50%)",
  warning: "hsl(35 92% 60%)",
};

function GradBtn({
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
        className={`inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-white text-sm transition-all ${className}`}
        style={{
          background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(280 60% 50%))",
          boxShadow: "0 4px 20px hsl(263 70% 62% / 0.25)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 30px hsl(263 70% 62% / 0.45)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 20px hsl(263 70% 62% / 0.25)";
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
      className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"
      style={{ border: "1px solid hsl(263 20% 18%)" }}
    >
      {children}
    </a>
  );
}

function SectionBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-4"
      style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────── NAV ─────────────────────────── */

function Nav() {
  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: "hsl(232 20% 4% / 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid hsl(263 20% 10%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))",
            }}
          >
            <span className="text-white font-black text-xs">AX</span>
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">
            Archon<span style={{ color: C.indigo }}>X</span>
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {[
            { label: "Product", href: "#product" },
            { label: "Features", href: "#features" },
            { label: "Use Cases", href: "#use-cases" },
            { label: "Staking", href: "#staking" },
          ].map((l) => (
            <a key={l.label} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Link href="/app">
            <button
              className="text-sm font-semibold px-5 py-2 rounded-full transition-all"
              style={{
                background: "hsl(263 70% 62% / 0.12)",
                color: "hsl(263 70% 75%)",
                border: "1px solid hsl(263 70% 62% / 0.25)",
              }}
            >
              Launch App →
            </button>
          </Link>
        </div>

        {/* Mobile */}
        <Link href="/app" className="md:hidden">
          <button
            className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(280 60% 50%))" }}
          >
            Launch App
          </button>
        </Link>
      </div>
    </nav>
  );
}

/* ─────────────────────────── MOCK DASHBOARD CARD ─────────────────────────── */

function MockDashboard() {
  return (
    <div className="relative">
      {/* Main panel */}
      <div
        className="rounded-2xl p-6 shadow-2xl"
        style={{
          background: "hsl(232 18% 8% / 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid hsl(263 20% 16%)",
          boxShadow: "0 30px 80px hsl(232 20% 2% / 0.6), 0 0 0 1px hsl(263 30% 20% / 0.3)",
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 mb-5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-safe/70" />
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">USDAX / USD</span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-3xl font-black text-foreground font-mono">$1.00</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "hsl(142 71% 45% / 0.15)", color: "hsl(142 71% 55%)" }}
              >
                +0.00%
              </span>
              <span className="text-[10px] text-muted-foreground">Pegged</span>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>24h vol: $24.5M</div>
            <div className="mt-0.5" style={{ color: C.indigo }}>Chain 46630</div>
          </div>
        </div>

        {/* Mini chart bars */}
        <div className="flex items-end gap-1 h-14 mb-5">
          {[40, 55, 35, 62, 48, 70, 45, 58, 72, 50, 65, 80].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${h}%`,
                background:
                  i === 11
                    ? "hsl(263 70% 62%)"
                    : i > 7
                    ? "hsl(263 70% 62% / 0.4)"
                    : "hsl(263 70% 62% / 0.2)",
              }}
            />
          ))}
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 gap-3 pt-4"
          style={{ borderTop: "1px solid hsl(263 20% 12%)" }}
        >
          {[
            { label: "APY", value: "15%", color: C.emerald },
            { label: "TVL", value: "$56K", color: C.indigo },
            { label: "Collat.", value: "150%", color: C.cyan },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-bold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating yield badge */}
      <div
        className="absolute -bottom-4 -right-4 rounded-xl px-4 py-2.5 shadow-xl hidden lg:flex items-center gap-3"
        style={{
          background: "hsl(263 70% 55%)",
          border: "1px solid hsl(263 70% 65% / 0.4)",
          boxShadow: "0 8px 30px hsl(263 70% 55% / 0.4)",
        }}
      >
        <Zap className="h-4 w-4 text-white" />
        <div>
          <div className="text-[10px] text-purple-200">Yield Active</div>
          <div className="text-xs font-bold text-white">+15% APY</div>
        </div>
      </div>

      {/* Floating health badge */}
      <div
        className="absolute -top-4 -left-4 rounded-xl px-4 py-2.5 shadow-xl hidden lg:flex items-center gap-2"
        style={{
          background: "hsl(232 18% 9%)",
          border: "1px solid hsl(142 71% 45% / 0.35)",
          boxShadow: "0 8px 30px hsl(232 20% 4% / 0.5)",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
        <div className="text-xs font-mono">
          <span className="text-muted-foreground">HF </span>
          <span style={{ color: C.emerald }} className="font-bold">2.13x</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── HERO ─────────────────────────── */

function Hero() {
  return (
    <section className="relative pt-28 pb-24 px-6 overflow-hidden">
      {/* BG glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[60%] h-[80%] rounded-full"
          style={{ background: "hsl(263 70% 62% / 0.07)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[40%] h-[60%] rounded-full"
          style={{ background: "hsl(280 60% 50% / 0.06)", filter: "blur(60px)" }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(263 50% 60%) 1px,transparent 1px),linear-gradient(90deg,hsl(263 50% 60%) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
              style={{
                background: "hsl(263 70% 62% / 0.1)",
                border: "1px solid hsl(263 70% 62% / 0.25)",
                color: "hsl(263 70% 75%)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: C.indigo }}
              />
              Live on Robinhood Chain · Chain ID 46630
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Where Money
              <br />
              <span className="gradient-text">Grows</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-lg leading-relaxed">
              A programmable, utility-driven stable token designed for native value accrual and
              seamless integration into DeFi on Robinhood Chain.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <GradBtn href="/app">
                <Zap className="h-4 w-4" /> Try it now
              </GradBtn>
              <OutlineBtn href="#product">
                Explore Protocol <ArrowRight className="h-3.5 w-3.5" />
              </OutlineBtn>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-8 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["hsl(263 70% 55%)", "hsl(186 80% 45%)", "hsl(142 71% 45%)", "hsl(35 92% 55%)"].map(
                  (bg, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        background: bg,
                        border: "2px solid hsl(232 20% 4%)",
                        marginLeft: i > 0 ? "-8px" : 0,
                      }}
                    >
                      {["A", "B", "C", "+"][i]}
                    </div>
                  )
                )}
              </div>
              <span>
                Trusted by <span className="text-foreground font-semibold">2,000+</span> early
                adopters
              </span>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <MockDashboard />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── TRUSTED BY ─────────────────────────── */

function TrustedBy() {
  const logos = [
    "CHAINLINK", "Robinhood", "OpenAI", "Perplexity",
    "KUKUIN", "MGC", "NxGen", "Matter Labs",
    "DEXTools", "NGRAVE", "emergent", "Lovalib",
  ];
  return (
    <section
      className="py-12"
      style={{
        borderTop: "1px solid hsl(263 20% 10%)",
        borderBottom: "1px solid hsl(263 20% 10%)",
        background: "hsl(232 20% 5%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-8">
          Backed by the best companies & visionary angels
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
          {logos.map((name) => (
            <span
              key={name}
              className="text-sm font-bold tracking-wider transition-colors cursor-default"
              style={{ color: "hsl(240 8% 35%)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "hsl(240 8% 70%)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "hsl(240 8% 35%)")}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── WHAT IS USDAX ─────────────────────────── */

function WhatIsUSDax() {
  const pillars = [
    {
      icon: Droplets,
      title: "Always liquid, always stable",
      desc: "Stay fully dollar-pegged with instant access to your funds — no lockups or delays.",
      color: C.indigo,
    },
    {
      icon: HandMetal,
      title: "100% hands-free",
      desc: "No need to manage strategies manually. USDAX works in the background for you.",
      color: C.purple,
    },
    {
      icon: Leaf,
      title: "Earn passive income",
      desc: "Your collateral is deployed into high-performing DeFi positions automatically.",
      color: C.emerald,
    },
  ];

  const metrics = [
    { value: "150%", label: "Collateral Ratio", color: C.indigo },
    { value: "15%", label: "Base APY", color: C.emerald },
    { value: "7d", label: "Staking Cooldown", color: C.warning },
    { value: "100M", label: "AKX Max Supply", color: C.purple },
  ];

  return (
    <section id="product" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionBadge color={C.indigo}>Product</SectionBadge>
          <h2 className="text-3xl md:text-5xl font-bold">
            What is <span className="gradient-text">USDAX</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-base md:text-lg">
            USDAX is a yield-bearing stablecoin that helps your capital grow while staying pegged
            to the U.S. dollar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl p-8 text-center card-hover"
                style={{
                  background: "hsl(232 18% 7%)",
                  border: "1px solid hsl(263 20% 12%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${p.color}40`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px ${p.color}10`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(263 20% 12%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: `${p.color}18` }}
                >
                  <Icon className="h-7 w-7" style={{ color: p.color }} />
                </div>
                <h3 className="text-lg font-bold mb-3">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Metric row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-3xl mx-auto">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="text-center rounded-xl py-5 px-3"
              style={{ background: "hsl(232 18% 7%)", border: "1px solid hsl(263 20% 11%)" }}
            >
              <div className="text-2xl font-extrabold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FEATURES ─────────────────────────── */

function Features() {
  const bullets = [
    {
      icon: Lock,
      title: "Smart Liquidation Protection",
      desc: "Real-time health factor monitoring. Positions stay safe above 1.0x.",
      color: C.indigo,
    },
    {
      icon: BarChart2,
      title: "Yield Optimization Engine",
      desc: "AKX staking rewards are auto-compounded. Base 15% APY, higher for early stakers.",
      color: C.emerald,
    },
    {
      icon: Zap,
      title: "Cross-Chain Ready",
      desc: "Built on Robinhood Chain (Arbitrum Orbit) with future bridges to Ethereum.",
      color: C.purple,
    },
  ];

  return (
    <section
      id="features"
      className="py-24 px-6"
      style={{ borderTop: "1px solid hsl(263 20% 10%)", background: "hsl(232 20% 4%)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <SectionBadge color={C.indigo}>ArchonX Engine</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Improve Outcomes &amp;{" "}
              <span className="gradient-text">Automate Workflows</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">
              ArchonX centralizes financial data, automates repetitive DeFi workflows, and enhances
              decision-making. Users gain faster insights, cleaner records, and a smoother path to
              growth.
            </p>
            <div className="mt-8 space-y-5">
              {bullets.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex items-start gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${b.color}18`, border: `1px solid ${b.color}25` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: b.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{b.title}</h4>
                      <p className="text-muted-foreground text-sm mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — protocol stats panel */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "hsl(232 18% 7%)",
              border: "1px solid hsl(263 20% 14%)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart2 className="h-4 w-4" style={{ color: C.indigo }} />
                Protocol Dashboard
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "hsl(142 71% 45% / 0.12)",
                  color: "hsl(142 71% 55%)",
                }}
              >
                ● Live
              </span>
            </div>

            <div className="space-y-5">
              {[
                {
                  label: "Total Value Locked",
                  value: "$56,333.75",
                  pct: 68,
                  gradient: "linear-gradient(90deg,hsl(263 70% 55%),hsl(280 60% 50%))",
                },
                {
                  label: "USDAX Minted",
                  value: "26,700 USDAX",
                  pct: 47,
                  gradient: "linear-gradient(90deg,hsl(142 71% 40%),hsl(186 80% 45%))",
                },
                {
                  label: "AKX Staked",
                  value: "700,000 AKX",
                  pct: 42,
                  gradient: "linear-gradient(90deg,hsl(280 60% 50%),hsl(310 60% 55%))",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold font-mono text-foreground">{row.value}</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "hsl(232 20% 10%)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, background: row.gradient }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-6 pt-5 grid grid-cols-3 gap-3"
              style={{ borderTop: "1px solid hsl(263 20% 11%)" }}
            >
              {[
                { label: "Active Vaults", value: "8" },
                { label: "Stakers", value: "5" },
                { label: "At-Risk", value: "1" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-bold font-mono text-foreground">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── USE CASES ─────────────────────────── */

function UseCases() {
  const cases = [
    {
      icon: Building2,
      title: "Business",
      desc: "Boost user engagement by offering USDAX — a secure yield-backed stablecoin with high yields, allowing your customers to earn effortlessly on your platform.",
      color: C.indigo,
    },
    {
      icon: Code2,
      title: "Developers",
      desc: "Integrate USDAX into your dApps with simple ERC-20 interfaces. Leverage our open-source smart contracts for collateral management and staking.",
      color: C.purple,
    },
    {
      icon: Vault,
      title: "Treasuries",
      desc: "Diversify your treasury with a stable, yield-bearing asset. Earn passive income on idle capital while maintaining dollar parity and full liquidity.",
      color: C.emerald,
    },
  ];

  return (
    <section id="use-cases" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <SectionBadge color={C.purple}>Use Cases</SectionBadge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Built for{" "}
            <span className="gradient-text">Developers, Business &amp; Treasuries</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
            ArchonX offers a variety of use cases for developers, businesses and treasuries seeking
            secure and profitable stablecoin integrations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="relative rounded-2xl p-8 overflow-hidden card-hover"
                style={{
                  background: "hsl(232 18% 7%)",
                  border: "1px solid hsl(263 20% 12%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${c.color}35`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(263 20% 12%)";
                }}
              >
                {/* Corner glow */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: `${c.color}08`,
                    filter: "blur(30px)",
                    transform: "translate(30%,-30%)",
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: `${c.color}18`, border: `1px solid ${c.color}25` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: c.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{c.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
                  <Link href="/app">
                    <span
                      className="inline-flex items-center gap-2 mt-6 text-sm font-medium transition-all hover:gap-3"
                      style={{ color: c.color }}
                    >
                      Launch App <ChevronRight className="h-3.5 w-3.5" />
                    </span>
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

/* ─────────────────────────── STAKING CTA ─────────────────────────── */

function StakingCTA() {
  return (
    <section
      id="staking"
      className="py-24 px-6"
      style={{ borderTop: "1px solid hsl(263 20% 10%)", background: "hsl(232 20% 4%)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="relative rounded-3xl p-12 md:p-16 overflow-hidden"
          style={{
            background: "hsl(232 18% 7%)",
            border: "1px solid hsl(263 20% 16%)",
            boxShadow: "0 0 80px hsl(263 70% 62% / 0.08)",
          }}
        >
          {/* Corner glows */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "hsl(263 70% 62% / 0.08)", filter: "blur(40px)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "hsl(280 60% 50% / 0.07)", filter: "blur(40px)" }}
          />

          <div className="relative z-10">
            <SectionBadge color={C.indigo}>Staking</SectionBadge>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Stake <span className="gradient-text">AKX</span> &amp; Earn Up to{" "}
              <span style={{ color: C.emerald }}>15% APY</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-4 text-base leading-relaxed">
              Lock your AKX tokens, earn passive rewards, and participate in protocol governance.
              7-day cooldown ensures long-term alignment and stable voting power.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <GradBtn href="/app/staking">
                <Lock className="h-4 w-4" /> Stake Now
              </GradBtn>
              <OutlineBtn href="/app">
                <BarChart2 className="h-4 w-4" /> View Dashboard
              </OutlineBtn>
            </div>

            <div
              className="grid grid-cols-3 gap-4 mt-10 pt-10 text-sm"
              style={{ borderTop: "1px solid hsl(263 20% 12%)" }}
            >
              {[
                { value: "15%", label: "Base APY", color: C.indigo },
                { value: "7d", label: "Cooldown Period", color: C.warning },
                { value: "100M", label: "AKX Max Supply", color: C.emerald },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="text-2xl font-extrabold font-mono"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FOOTER ─────────────────────────── */

function Footer() {
  const cols = [
    {
      title: "Protocol",
      links: ["USDAX", "AKX Token", "Staking", "Governance"],
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
      className="py-14 px-6"
      style={{ borderTop: "1px solid hsl(263 20% 10%)", background: "hsl(232 20% 3%)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))",
                }}
              >
                <span className="text-white font-black text-xs">AX</span>
              </div>
              <span className="font-bold text-lg">
                Archon<span style={{ color: C.indigo }}>X</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Programmable stablecoin infrastructure for the next generation of DeFi on Robinhood
              Chain.
            </p>
            <div className="flex gap-4 mt-5">
              {[Twitter, Github, MessageSquare, FileText].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60"
          style={{ borderTop: "1px solid hsl(263 20% 10%)" }}
        >
          <span>© 2026 ArchonX Protocol. All rights reserved.</span>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
              <a key={l} href="#" className="hover:text-muted-foreground transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────── ROOT ─────────────────────────── */

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
