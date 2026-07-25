import { ArrowLeft, Shield, Users, Zap, Globe, Lock, Mail, Twitter } from "lucide-react";

const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const BG      = "hsl(0 0% 4%)";
const MUTED   = "hsl(0 0% 28%)";

export default function About() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "hsl(0 0% 90%)" }}>
      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: "hsl(0 0% 3% / 0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, textDecoration: "none", fontSize: 13 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Home
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/favicon.png" alt="USDAX" style={{ width: 24, height: 24, borderRadius: 4 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>USDAX Finance</span>
          </div>
          <a href="/app" style={{ fontSize: 13, color: LIME, textDecoration: "none", fontWeight: 700 }}>Launch App →</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: "80px 32px 64px", borderBottom: `1px solid ${BORDER}`, background: `radial-gradient(ellipse 60% 40% at 20% 0%, hsl(79 100% 57% / 0.05) 0%, transparent 70%)` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 16, textTransform: "uppercase" }}>
            ◈ USDAX Finance · About
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 5rem)", textTransform: "uppercase", lineHeight: 1, marginBottom: 24 }}>
            BUILDING THE FUTURE<br />OF <span style={{ color: LIME }}>PROGRAMMABLE</span><br />STABLECOINS.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 520, color: "hsl(0 0% 45%)" }}>
            USDAX Finance is a decentralized stablecoin protocol built natively on Robinhood Chain.
            Our mission: create the most trust-minimized, capital-efficient stablecoin infrastructure
            for the next generation of on-chain finance.
          </p>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 8, textTransform: "uppercase" }}>Core Values</div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 36 }}>
            WHAT WE <span style={{ color: LIME }}>STAND FOR</span>
          </h2>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { icon: Shield, color: EMERALD, title: "Security First", body: "Every contract is built with defense-in-depth: overcollateralization, oracle diversity, and circuit breakers. Security is not a feature; it is the foundation." },
              { icon: Globe,  color: LIME,    title: "Fully On-Chain", body: "Every mint, liquidation, and redemption happens on-chain. No custodians, no admin multisig, no off-chain dependencies. Code is law." },
              { icon: Zap,    color: LIME,    title: "Capital Efficiency", body: "USDAX is engineered for the highest possible collateral utilization while maintaining strict solvency guarantees for all positions at all times." },
              { icon: Users,  color: EMERALD, title: "Community Governed", body: "APX token holders govern all protocol parameters (collateral ratios, stability fees, new collateral types) through binding on-chain votes." },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8, color: "hsl(0 0% 90%)" }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "hsl(0 0% 40%)" }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 8, textTransform: "uppercase" }}>Milestones</div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 40 }}>
            PROTOCOL <span style={{ color: LIME }}>TIMELINE</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { date: "Q1 2026",    label: "Development",    done: true,  desc: "Core protocol architecture designed. VaultEngine, CollateralManager, and USDAX contracts written and internally reviewed by the engineering team." },
              { date: "Q2 2026",    label: "Testnet Launch", done: true,  desc: "All core contracts deployed to Robinhood Chain Testnet (Chain ID 46630). Public testnet opened. Independent security audit initiated with Trail of Bits." },
              { date: "July 2026",  label: "Savings Rate",   done: true,  desc: "USDAxSavings contract deployed on Robinhood Chain Testnet. USDAX holders can now earn 4.20% APY with no lock-up and no minimum deposit." },
              { date: "H2 2026",    label: "Mainnet Alpha",  done: false, desc: "Mainnet launch on Robinhood Chain. Audit 2 (OpenZeppelin) completion. APX token generation event. Staking and governance activated." },
              { date: "2027+",      label: "Ecosystem",      done: false, desc: "RWA collateral expansion. Cross-chain USDAX bridges to Ethereum and Arbitrum. Decentralized oracle transition. v2 governance." },
            ].map((item, i) => (
              <div key={item.date} style={{ display: "flex", gap: 24, paddingBottom: i < 4 ? 32 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.done ? LIME : "hsl(0 0% 16%)", border: item.done ? "none" : `1px solid ${BORDER}`, marginTop: 3 }} />
                  {i < 4 && <div style={{ width: 1, flex: 1, background: BORDER, marginTop: 8 }} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: item.done ? LIME : MUTED, fontWeight: 700 }}>{item.date}</span>
                    {item.done && (
                      <span style={{ fontSize: 10, fontFamily: "monospace", background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}22`, borderRadius: 4, padding: "1px 6px", fontWeight: 900, letterSpacing: "0.1em" }}>COMPLETE</span>
                    )}
                    <span style={{ fontWeight: 900, fontSize: 13, color: item.done ? "hsl(0 0% 78%)" : "hsl(0 0% 48%)" }}>{item.label}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "hsl(0 0% 36%)", lineHeight: 1.65, maxWidth: 500 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 8, textTransform: "uppercase" }}>Team</div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 16 }}>
            BUILT BY <span style={{ color: LIME }}>DEFI ENGINEERS</span>
          </h2>
          <p style={{ fontSize: 14, color: "hsl(0 0% 40%)", lineHeight: 1.7, maxWidth: 540, marginBottom: 36 }}>
            USDAX Finance is built by a focused team of blockchain engineers, protocol designers, and
            security researchers. We operate pseudonymously, as is standard in DeFi, letting the
            protocol and code speak for itself.
          </p>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {[
              { role: "Protocol Engineering", skills: "EVM, Solidity, CDP mechanics, liquidation design" },
              { role: "Security Research",    skills: "Smart contract auditing, economic attack modeling" },
              { role: "Frontend Engineering", skills: "React, TypeScript, Web3 UX, wallet integrations" },
              { role: "Protocol Economics",   skills: "DeFi tokenomics, governance design, risk modeling" },
            ].map((m) => (
              <div key={m.role} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 22px" }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: "hsl(0 0% 82%)", marginBottom: 6 }}>{m.role}</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{m.skills}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: "64px 32px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 32 }}>
            GET IN <span style={{ color: LIME }}>TOUCH</span>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {[
              { icon: Mail,    label: "General",  value: "team@usdax.finance",       href: "mailto:team@usdax.finance" },
              { icon: Shield,  label: "Security", value: "security@usdax.finance",   href: "mailto:security@usdax.finance" },
              { icon: Twitter, label: "Twitter",  value: "@Usdax_Finance",            href: "https://x.com/Usdax_Finance" },
              { icon: Globe,   label: "Website",  value: "usdax.finance",             href: "https://usdax.finance" },
            ].map(({ icon: Icon, label, value, href }) => (
              <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit", minWidth: 200 }}>
                <Icon style={{ width: 16, height: 16, color: LIME, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "hsl(0 0% 72%)", fontWeight: 600 }}>{value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: "hsl(0 0% 22%)" }}>© 2026 USDAX Finance · usdax.finance · All rights reserved.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[{ label: "Docs", href: "/docs" }, { label: "App", href: "/app" }, { label: "Blog", href: "/blog" }, { label: "Audit", href: "/audit" }].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, color: "hsl(0 0% 28%)", textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
