import { ArrowLeft, Shield, AlertTriangle, Check, ExternalLink, FileText, Lock } from "lucide-react";

const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const BG      = "hsl(0 0% 4%)";
const MUTED   = "hsl(0 0% 28%)";

const contracts = [
  { name: "USDAX Token",       address: "0x89F2c042def8719930904A474FF999A0F8fddd64", desc: "ERC-20 stablecoin",          deployed: true  },
  { name: "VaultEngine",       address: "0xB5d971d69728B0C31b19A8f184d31813F29EEA20", desc: "CDP minting & management",   deployed: true  },
  { name: "CollateralManager", address: "0x2472DCBA450e0AA2f81e69AaCD33f91528343854", desc: "Risk parameter enforcement",  deployed: true  },
  { name: "Price Oracle",      address: "0xe5211fF6a85F51b290600B4807d0ee5F978cEC2D", desc: "On-chain price aggregator",  deployed: true  },
  { name: "WETH (Testnet)",    address: "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc", desc: "Testnet Wrapped Ether",       deployed: true  },
  { name: "WBTC (Testnet)",    address: "0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34", desc: "Testnet Wrapped Bitcoin",     deployed: true  },
  { name: "stETH (Testnet)",   address: "0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e", desc: "Testnet Liquid-staked Ether", deployed: true  },
  { name: "APX Token",         address: "Pending deployment",                            desc: "Governance token",            deployed: false },
  { name: "APXStaking",        address: "Pending deployment",                            desc: "Staking rewards",             deployed: false },
  { name: "Governance",        address: "Pending deployment",                            desc: "On-chain voting",             deployed: false },
];

export default function AuditReport() {
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
      <section style={{ padding: "80px 32px 64px", borderBottom: `1px solid ${BORDER}`, background: `radial-gradient(ellipse 60% 40% at 20% 0%, hsl(152 70% 48% / 0.05) 0%, transparent 70%)` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 16, textTransform: "uppercase" }}>
            ◈ USDAX Finance · Security
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 5rem)", textTransform: "uppercase", lineHeight: 1, marginBottom: 24 }}>
            SMART CONTRACT<br /><span style={{ color: EMERALD }}>AUDIT REPORT</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 520, color: "hsl(0 0% 45%)", marginBottom: 32 }}>
            USDAX Finance undergoes multiple independent security audits before each major release.
            This page documents our current audit status, scope, and security posture for all deployed contracts.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${AMBER}08`, border: `1px solid ${AMBER}28`, borderRadius: 12, padding: "12px 20px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER }} />
            <span style={{ fontSize: 13, color: AMBER, fontWeight: 700, fontFamily: "monospace" }}>
              TESTNET PHASE: Audit 1 In Progress
            </span>
          </div>
        </div>
      </section>

      {/* Audit 1 */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 8, textTransform: "uppercase" }}>Security Reviews</div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 32 }}>
            AUDIT <span style={{ color: LIME }}>SCHEDULE</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Audit 1 — In Progress */}
            <div style={{ background: CARD_BG, border: `1px solid ${AMBER}30`, borderRadius: 16, padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.12em" }}>Audit 1 · Testnet Contracts</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "hsl(0 0% 92%)" }}>Trail of Bits</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "monospace", background: `${AMBER}10`, color: AMBER, border: `1px solid ${AMBER}30`, borderRadius: 8, padding: "6px 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  In Progress
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginBottom: 20, padding: "16px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                {[
                  { label: "Scope",    value: "All testnet contracts" },
                  { label: "Timeline", value: "Q2–Q3 2026" },
                  { label: "Focus",    value: "CDP, oracle, liquidation" },
                  { label: "Network",  value: "Robinhood Chain Testnet" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: "hsl(0 0% 72%)", fontWeight: 600 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "hsl(0 0% 40%)", lineHeight: 1.7 }}>
                Trail of Bits is conducting a full security review of VaultEngine, CollateralManager, USDAX token,
                and the price oracle system. The audit covers integer overflow and underflow vectors, reentrancy
                patterns, oracle manipulation and staleness, economic attack surfaces, and access control. The full
                report will be published on this page upon completion before any mainnet deployment.
              </p>
            </div>

            {/* Audit 2 — Scheduled */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.12em" }}>Audit 2 · Pre-Mainnet</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "hsl(0 0% 55%)" }}>OpenZeppelin</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "monospace", background: "hsl(0 0% 8%)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Scheduled: H2 2026
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginBottom: 20, padding: "16px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                {[
                  { label: "Scope",    value: "Full protocol + APX" },
                  { label: "Timeline", value: "H2 2026" },
                  { label: "Focus",    value: "Mainnet readiness" },
                  { label: "Network",  value: "Robinhood Chain Mainnet" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: "hsl(0 0% 48%)", fontWeight: 600 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "hsl(0 0% 30%)", lineHeight: 1.7 }}>
                Full pre-mainnet audit covering the APX token, staking module, and governance contracts in addition
                to updated core protocol code. Formal verification via Certora is planned as part of this phase.
                No mainnet launch will proceed until both audits are complete and all critical findings resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployed Contracts */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 8, textTransform: "uppercase" }}>Robinhood Chain Testnet · Chain ID 46630</div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 32 }}>
            DEPLOYED <span style={{ color: LIME }}>CONTRACTS</span>
          </h2>

          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "10px 24px", borderBottom: `1px solid ${BORDER}`, gap: 16 }}>
              {["Contract", "Address", "Status"].map(h => (
                <span key={h} style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
              ))}
            </div>
            {contracts.map((c, i) => (
              <div key={c.name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "15px 24px", borderBottom: i < contracts.length - 1 ? `1px solid ${BORDER}` : undefined, gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: c.deployed ? "hsl(0 0% 82%)" : "hsl(0 0% 45%)" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.desc}</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>
                  {c.deployed ? (
                    <a href={`https://explorer.testnet.chain.robinhood.com/address/${c.address}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: "hsl(0 0% 52%)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = LIME)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 52%)")}>
                      {c.address} <ExternalLink style={{ width: 10, height: 10, flexShrink: 0 }} />
                    </a>
                  ) : (
                    <span style={{ color: MUTED }}>{c.address}</span>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: c.deployed ? `${EMERALD}10` : "hsl(0 0% 8%)", color: c.deployed ? EMERALD : MUTED, border: `1px solid ${c.deployed ? EMERALD + "25" : BORDER}`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", whiteSpace: "nowrap", width: "fit-content" }}>
                  {c.deployed ? "Deployed" : "Pending"}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 10, fontFamily: "monospace" }}>
            Verify all addresses on the{" "}
            <a href="https://explorer.testnet.chain.robinhood.com" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(0 0% 45%)", textDecoration: "underline" }}>
              Robinhood Chain Testnet explorer
            </a>{" "}
            before interacting with any contract.
          </p>
        </div>
      </section>

      {/* Security Practices */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 32 }}>
            SECURITY <span style={{ color: LIME }}>ARCHITECTURE</span>
          </h2>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { icon: Lock,          title: "Overcollateralization", body: "All positions require a minimum 150% collateral ratio. Liquidations trigger automatically when health factor drops below 1.0, before the protocol is at risk." },
              { icon: Shield,        title: "Oracle Security",        body: "Price feeds from Chainlink and protocol-specific oracles. Stale price detection and circuit breakers halt minting if any oracle fails or freezes." },
              { icon: AlertTriangle, title: "Emergency Pause",        body: "A time-locked pause mechanism can halt minting and liquidations in the event of a critical vulnerability, without requiring access to user funds." },
              { icon: FileText,      title: "Open Source",            body: "All contracts are fully open-source. Anyone can verify the bytecode on-chain or review the source on GitHub before depositing any collateral." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${EMERALD}10`, border: `1px solid ${EMERALD}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon style={{ width: 14, height: 14, color: EMERALD }} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 8, color: "hsl(0 0% 88%)" }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "hsl(0 0% 40%)" }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section style={{ padding: "64px 32px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 16 }}>
            RESPONSIBLE <span style={{ color: LIME }}>DISCLOSURE</span>
          </h2>
          <p style={{ fontSize: 14, color: "hsl(0 0% 42%)", lineHeight: 1.7, maxWidth: 540, marginBottom: 28 }}>
            If you discover a security vulnerability in USDAX Finance smart contracts or infrastructure,
            please report it privately to our security team. Do not disclose publicly until a patch is
            deployed and confirmed. We investigate and respond to all responsibly submitted reports.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="mailto:security@usdax.finance"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${EMERALD}0c`, border: `1px solid ${EMERALD}28`, borderRadius: 12, padding: "14px 24px", textDecoration: "none", color: EMERALD, fontWeight: 700, fontSize: 14 }}>
              <Shield style={{ width: 16, height: 16 }} /> security@usdax.finance
            </a>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "hsl(0 0% 6%)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 24px", color: MUTED, fontSize: 13 }}>
              <Check style={{ width: 14, height: 14 }} /> PGP key available on request
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: "hsl(0 0% 22%)" }}>© 2026 USDAX Finance · All rights reserved.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[{ label: "Docs", href: "/docs" }, { label: "App", href: "/app" }, { label: "About", href: "/about" }, { label: "Blog", href: "/blog" }].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, color: "hsl(0 0% 28%)", textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
