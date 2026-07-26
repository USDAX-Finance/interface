import { Shield, AlertTriangle, Check, ExternalLink, FileText, Lock } from "lucide-react";

const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const BG      = "hsl(0 0% 4%)";
const MUTED   = "hsl(0 0% 28%)";

const testnetContracts = [
  { name: "USDAX Token",       address: "0x1988D89F5E7339394C20f93e982188c70eC4e5D3", desc: "ERC-20 stablecoin",           explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "VaultEngine",       address: "0x30E3A7dcF5f5773B605c25B4abbc3DbbFaB9DC8F", desc: "CDP minting & management (v1.2 — stability fee)",    explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "CollateralManager", address: "0x2472DCBA450e0AA2f81e69AaCD33f91528343854", desc: "Risk parameter enforcement",  explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "ChainlinkPriceOracle", address: "0xfE07515418B6f7239e9b4ecE21f49a75656Ba1a3", desc: "Chainlink-ready oracle (testnet: fallback prices; mainnet: live feeds)", explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "USDAxSavings",        address: "0x1Ad884C7d1C638f82F36c081b38f3e129c717A3C", desc: "Yield savings module",       explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "WETH (Testnet)",    address: "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc", desc: "Testnet Wrapped Ether",       explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "WBTC (Testnet)",    address: "0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34", desc: "Testnet Wrapped Bitcoin",     explorer: "https://explorer.testnet.chain.robinhood.com" },
  { name: "stETH (Testnet)",   address: "0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e", desc: "Testnet Liquid-staked Ether", explorer: "https://explorer.testnet.chain.robinhood.com" },
];

const mainnetContracts = [
  { name: "APX Token",   address: "0x42523E3e454B97ff8651926685aFAD61C950Ab2F", desc: "Protocol native token",  explorer: "https://robinhoodchain.blockscout.com" },
  { name: "APXStaking",  address: "0x00b6792ac02caf607d0b6ea4a6f572a83472412f", desc: "APX staking & rewards",   explorer: "https://robinhoodchain.blockscout.com" },
];

const pendingContracts = [
  { name: "Governance", address: "Pending deployment", desc: "On-chain voting" },
];

export default function AuditReport() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "hsl(0 0% 90%)" }}>
      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: "hsl(0 0% 3% / 0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/favicon.png" alt="USDAX" style={{ width: 26, height: 26, borderRadius: 4 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "hsl(0 0% 80%)" }}>USDAX <span style={{ color: "hsl(0 0% 35%)" }}>finance</span></span>
          </a>
          <div style={{ flex: 1 }} />
          {[{ label: "Staking", href: "/staking" }, { label: "Docs", href: "/docs" }, { label: "Blog", href: "/blog" }].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: 12, color: "hsl(0 0% 38%)", textDecoration: "none", padding: "6px 14px", border: `1px solid ${BORDER}`, borderRadius: 6 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)")}>{label}</a>
          ))}
          <a href="/app" style={{ fontSize: 12, fontWeight: 700, color: "hsl(0 0% 4%)", background: LIME, padding: "6px 16px", borderRadius: 6, textDecoration: "none" }}>Launch App</a>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${EMERALD}08`, border: `1px solid ${EMERALD}28`, borderRadius: 12, padding: "12px 20px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: EMERALD }} />
              <span style={{ fontSize: 13, color: EMERALD, fontWeight: 700, fontFamily: "monospace" }}>
                TESTNET PHASE: Self-Review Complete
              </span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${AMBER}08`, border: `1px solid ${AMBER}28`, borderRadius: 12, padding: "12px 20px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER }} />
              <span style={{ fontSize: 13, color: AMBER, fontWeight: 700, fontFamily: "monospace" }}>
                External Audit: Pending Engagement
              </span>
            </div>
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
            {/* Audit 1 — Pending */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.12em" }}>Audit 1 · Testnet Contracts</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "hsl(0 0% 55%)" }}>Audit Firm TBD</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "monospace", background: "hsl(0 0% 8%)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Not Yet Engaged
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginBottom: 20, padding: "16px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                {[
                  { label: "Scope",    value: "All testnet contracts" },
                  { label: "Timeline", value: "TBD" },
                  { label: "Focus",    value: "CDP, oracle, liquidation" },
                  { label: "Network",  value: "Robinhood Chain Testnet" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: "hsl(0 0% 48%)", fontWeight: 600 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "hsl(0 0% 40%)", lineHeight: 1.7 }}>
                An external security audit of VaultEngine, CollateralManager, USDAxToken, USDAxSavings, and the
                price oracle is required before any mainnet deployment is considered. Audit firm selection is
                pending. The full report will be published on this page upon completion.
              </p>
            </div>

            {/* Audit 2 — Planned */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: MUTED, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.12em" }}>Audit 2 · Pre-Mainnet</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "hsl(0 0% 55%)" }}>Audit Firm TBD</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "monospace", background: "hsl(0 0% 8%)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Planned
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginBottom: 20, padding: "16px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                {[
                  { label: "Scope",    value: "Full protocol + APX" },
                  { label: "Timeline", value: "Pre-mainnet" },
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
                A second full audit covering APX token, APXStaking, governance contracts, and updated core protocol
                code is planned before mainnet. No mainnet launch will proceed until both audits are complete and
                all critical findings resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployed Contracts */}
      <section style={{ padding: "64px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", textTransform: "uppercase", marginBottom: 32 }}>
            DEPLOYED <span style={{ color: LIME }}>CONTRACTS</span>
          </h2>

          {/* Testnet */}
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 10, textTransform: "uppercase" }}>Robinhood Chain Testnet · Chain ID 46630</div>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "10px 24px", borderBottom: `1px solid ${BORDER}`, gap: 16 }}>
              {["Contract", "Address", "Status"].map(h => (
                <span key={h} style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
              ))}
            </div>
            {testnetContracts.map((c, i) => (
              <div key={c.name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "15px 24px", borderBottom: i < testnetContracts.length - 1 ? `1px solid ${BORDER}` : undefined, gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(0 0% 82%)" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.desc}</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>
                  <a href={`${c.explorer}/address/${c.address}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: "hsl(0 0% 52%)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = LIME)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 52%)")}>
                    {c.address} <ExternalLink style={{ width: 10, height: 10, flexShrink: 0 }} />
                  </a>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: `${EMERALD}10`, color: EMERALD, border: `1px solid ${EMERALD}25`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", whiteSpace: "nowrap", width: "fit-content" }}>Deployed</span>
              </div>
            ))}
          </div>

          {/* Mainnet */}
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 10, textTransform: "uppercase" }}>Robinhood Chain Mainnet · Chain ID 4663</div>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "10px 24px", borderBottom: `1px solid ${BORDER}`, gap: 16 }}>
              {["Contract", "Address", "Status"].map(h => (
                <span key={h} style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
              ))}
            </div>
            {mainnetContracts.map((c, i) => (
              <div key={c.name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "15px 24px", borderBottom: i < mainnetContracts.length - 1 ? `1px solid ${BORDER}` : undefined, gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(0 0% 82%)" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.desc}</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>
                  <a href={`${c.explorer}/address/${c.address}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: "hsl(0 0% 52%)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = LIME)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 52%)")}>
                    {c.address} <ExternalLink style={{ width: 10, height: 10, flexShrink: 0 }} />
                  </a>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: `${EMERALD}10`, color: EMERALD, border: `1px solid ${EMERALD}25`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", whiteSpace: "nowrap", width: "fit-content" }}>Deployed</span>
              </div>
            ))}
          </div>

          {/* Pending */}
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 10, textTransform: "uppercase" }}>Pending Deployment</div>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "10px 24px", borderBottom: `1px solid ${BORDER}`, gap: 16 }}>
              {["Contract", "Address", "Status"].map(h => (
                <span key={h} style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
              ))}
            </div>
            {pendingContracts.map((c, i) => (
              <div key={c.name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 100px", padding: "15px 24px", borderBottom: i < pendingContracts.length - 1 ? `1px solid ${BORDER}` : undefined, gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(0 0% 45%)" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.desc}</div>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: MUTED }}>{c.address}</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: "hsl(0 0% 8%)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 5, padding: "2px 8px", textTransform: "uppercase", whiteSpace: "nowrap", width: "fit-content" }}>Pending</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 10, fontFamily: "monospace" }}>
            Verify addresses on{" "}
            <a href="https://explorer.testnet.chain.robinhood.com" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(0 0% 45%)", textDecoration: "underline" }}>testnet explorer</a>
            {" "}or{" "}
            <a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(0 0% 45%)", textDecoration: "underline" }}>mainnet Blockscout</a>
            {" "}before interacting with any contract.
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
              { icon: Shield,        title: "Oracle Security",        body: "Protocol now uses ChainlinkPriceOracle — Chainlink AggregatorV3 architecture with admin-set fallback prices on testnet. On mainnet (chain 4663), live Chainlink feeds are pre-configured for ETH/USD, WBTC/USD, and WSTETH/USD." },
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
            <a href="mailto:support@usdax.finance"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${EMERALD}0c`, border: `1px solid ${EMERALD}28`, borderRadius: 12, padding: "14px 24px", textDecoration: "none", color: EMERALD, fontWeight: 700, fontSize: 14 }}>
              <Shield style={{ width: 16, height: 16 }} /> support@usdax.finance
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
