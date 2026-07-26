import { ArrowLeft } from "lucide-react";

const LIME   = "hsl(79 100% 57%)";
const AMBER  = "hsl(35 92% 60%)";
const BORDER = "hsl(0 0% 10%)";
const BG     = "hsl(0 0% 4%)";
const CARD   = "hsl(0 0% 6%)";
const MUTED  = "hsl(0 0% 28%)";
const TEXT   = "hsl(0 0% 82%)";

const LAST_UPDATED = "1 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "hsl(0 0% 92%)", marginBottom: 16, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.85, color: TEXT }}>
        {children}
      </div>
    </div>
  );
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ marginBottom: 14, ...style }}>{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <li key={item} style={{ listStyleType: "disc", color: TEXT }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function TermsOfService() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "hsl(0 0% 90%)" }}>
      {/* Header */}
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
      <section style={{ padding: "72px 32px 56px", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-3xl mx-auto">
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 16, textTransform: "uppercase" }}>
            Legal
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Risk warning */}
      <div style={{ padding: "0 32px" }}>
        <div className="max-w-3xl mx-auto" style={{ paddingTop: 32 }}>
          <div style={{ background: `hsl(35 92% 60% / 0.08)`, border: `1px solid ${AMBER}30`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ color: AMBER, fontWeight: 900, fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠</span>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: `hsl(35 92% 60% / 0.9)`, margin: 0 }}>
              <strong>Risk disclosure:</strong> Interacting with DeFi protocols carries significant financial risk,
              including the potential total loss of funds. Smart contracts may contain bugs. Collateral values can
              fall rapidly. Read these Terms fully before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: "48px 32px 80px" }}>
        <div className="max-w-3xl mx-auto">

          {/* Intro box */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", marginBottom: 48 }}>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: MUTED }}>
              These Terms of Service ("Terms") govern your access to and use of the USDAX Finance interface,
              smart contracts, and related services (collectively, the "Protocol"). By accessing or using the
              Protocol, you agree to be bound by these Terms. If you do not agree, do not use the Protocol.
            </p>
          </div>

          <Section title="1. Eligibility">
            <P>
              By using the Protocol, you represent and warrant that you are at least 18 years old, have the legal
              capacity to enter into a binding agreement, and are not located in, incorporated in, or otherwise
              subject to the laws of any jurisdiction where use of DeFi protocols is prohibited or restricted,
              including but not limited to the United States of America, OFAC-sanctioned countries, and
              jurisdictions listed on relevant financial-crime watchlists.
            </P>
            <P>
              You are solely responsible for determining whether your use of the Protocol is lawful in your
              jurisdiction. We make no representation that the Protocol is appropriate or available for use
              in all locations.
            </P>
          </Section>

          <Section title="2. Nature of the Protocol">
            <P>
              USDAX Finance is a decentralised, non-custodial stablecoin protocol deployed on the Robinhood Chain
              blockchain (testnet, Chain ID 46630, transitioning to mainnet). The Protocol consists of:
            </P>
            <Ul items={[
              "Smart contracts that enable users to deposit collateral and mint USDAX stablecoins.",
              "A savings rate mechanism allowing USDAX holders to earn yield.",
              "A liquidation system that automatically closes under-collateralised positions.",
              "A web-based interface for interacting with the above contracts.",
            ]} />
            <P>
              The smart contracts are autonomous and self-executing. Once deployed, neither USDAX Finance nor
              any third party can unilaterally reverse, block, or alter on-chain transactions. You interact with
              the contracts at your own risk.
            </P>
          </Section>

          <Section title="3. Non-Custodial: Your Keys, Your Funds">
            <P>
              The Protocol is non-custodial. We do not hold, manage, or have access to your private keys, wallet,
              or funds at any time. You are solely responsible for the security of your wallet and the credentials
              used to access it.
            </P>
            <P>
              If you lose access to your wallet or private keys, or if your wallet is compromised, we cannot
              recover your funds. There is no "forgot password" mechanism for a non-custodial protocol.
            </P>
          </Section>

          <Section title="4. Risks">
            <P>
              Using DeFi protocols involves significant and varied risks. You acknowledge and accept all of the
              following:
            </P>
            <Ul items={[
              "Smart contract risk: contracts may contain bugs, vulnerabilities, or design flaws that could result in total or partial loss of funds.",
              "Collateral risk: collateral values can decrease rapidly; positions may be liquidated with limited or no notice.",
              "Oracle risk: price feeds used to determine collateral value may be delayed, manipulated, or incorrect.",
              "Liquidation risk: if your collateral ratio falls below the minimum threshold, your position will be liquidated automatically.",
              "Regulatory risk: the legal status of DeFi protocols and stablecoins is uncertain and evolving in many jurisdictions.",
              "Network risk: blockchain congestion, forks, or outages may prevent timely transactions.",
              "Interface risk: the web interface is a front-end to the contracts; the interface may experience downtime, bugs, or be unavailable.",
            ]} />
          </Section>

          <Section title="5. Prohibited Conduct">
            <P>You agree not to use the Protocol to:</P>
            <Ul items={[
              "Violate any applicable law, regulation, or sanction.",
              "Engage in market manipulation, wash trading, or any form of fraudulent activity.",
              "Launder money or finance terrorism or other criminal activity.",
              "Exploit bugs or vulnerabilities in the smart contracts (please disclose responsibly via support@usdax.finance instead).",
              "Use automated systems to scrape, attack, or overwhelm the web interface.",
              "Impersonate USDAX Finance or its contributors.",
            ]} />
          </Section>

          <Section title="6. Interface Availability">
            <P>
              The web interface at usdax.finance is provided "as is" and "as available". We do not guarantee
              continuous, uninterrupted access. The interface may be modified, suspended, or discontinued at any
              time without notice. If the interface is unavailable, you may continue to interact with the
              underlying smart contracts directly via a compatible Ethereum-compatible wallet and a block explorer.
            </P>
          </Section>

          <Section title="7. Fees">
            <P>
              The Protocol charges protocol fees on certain operations (e.g. stability fees on minted USDAX,
              liquidation penalties). All fees are transparently defined in the smart contract code and the
              protocol documentation. Network gas fees are separate, determined by the Robinhood Chain network,
              and are not controlled by USDAX Finance.
            </P>
          </Section>

          <Section title="8. Intellectual Property">
            <P>
              The USDAX Finance interface, brand, and documentation are the intellectual property of USDAX Finance
              contributors. Smart contract code is open-source and released under the MIT License unless otherwise
              stated in the repository. You may not use the USDAX Finance name, logo, or branding without prior
              written permission.
            </P>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <P style={{ textTransform: "uppercase", fontWeight: 700, fontSize: 13 }}>
              The Protocol and interface are provided "as is" without warranty of any kind, express or implied,
              including but not limited to warranties of merchantability, fitness for a particular purpose, or
              non-infringement. We do not warrant that the Protocol will be error-free, secure, or continuously
              available.
            </P>
          </Section>

          <Section title="10. Limitation of Liability">
            <P style={{ textTransform: "uppercase", fontWeight: 700, fontSize: 13 }}>
              To the maximum extent permitted by applicable law, USDAX Finance and its contributors shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages, including
              but not limited to loss of funds, loss of data, or loss of profits, arising out of or in connection
              with your use of the Protocol, even if advised of the possibility of such damages.
            </P>
          </Section>

          <Section title="11. Indemnification">
            <P>
              You agree to indemnify, defend, and hold harmless USDAX Finance and its contributors from and
              against any claims, liabilities, damages, losses, and expenses arising out of or in any way
              connected with your use of the Protocol, your violation of these Terms, or your violation of any
              law or regulation.
            </P>
          </Section>

          <Section title="12. Governing Law and Disputes">
            <P>
              These Terms shall be governed by and construed in accordance with generally accepted principles of
              international commercial law, to the extent possible without reference to any single national
              legal system. Any dispute arising under these Terms shall be resolved through binding arbitration
              administered under standard international commercial arbitration rules.
            </P>
          </Section>

          <Section title="13. Changes to These Terms">
            <P>
              We reserve the right to modify these Terms at any time. When we do, we will update the "Last updated"
              date at the top of this page and announce material changes via{" "}
              <a href="https://x.com/Usdax_Finance" target="_blank" rel="noopener noreferrer" style={{ color: LIME, textDecoration: "none" }}>@Usdax_Finance</a>{" "}
              on X. Your continued use of the Protocol after any modification constitutes your acceptance of the
              updated Terms.
            </P>
          </Section>

          <Section title="14. Contact">
            <P>
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:support@usdax.finance" style={{ color: LIME, textDecoration: "none" }}>support@usdax.finance</a>.
            </P>
          </Section>

          {/* Footer links */}
          <div style={{ display: "flex", gap: 24, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
            <a href="/privacy" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = MUTED)}>
              Privacy Policy →
            </a>
            <a href="/cookies" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = MUTED)}>
              Cookie Policy →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
