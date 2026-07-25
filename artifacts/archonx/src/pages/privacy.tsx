import { ArrowLeft } from "lucide-react";

const LIME   = "hsl(79 100% 57%)";
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

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 14 }}>{children}</p>;
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

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <main style={{ padding: "56px 32px 80px" }}>
        <div className="max-w-3xl mx-auto">

          {/* Intro box */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", marginBottom: 48 }}>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: MUTED }}>
              USDAX Finance ("we", "us", "our") is committed to protecting your privacy. This policy explains what
              information we collect when you use the USDAX Finance interface at{" "}
              <a href="https://usdax.finance" style={{ color: LIME, textDecoration: "none" }}>usdax.finance</a>{" "}
              and any related services, and how we handle it.
            </p>
          </div>

          <Section title="1. What We Collect">
            <P>
              USDAX Finance is a non-custodial DeFi protocol. We do not require you to create an account, provide an
              email address, or submit any personally identifiable information (PII) to use the core protocol.
            </P>
            <P>We may collect the following limited data:</P>
            <Ul items={[
              "Public wallet addresses that interact with the USDAX Finance smart contracts; these are inherently public on-chain data.",
              "Browser and device information (user-agent, viewport size, language) collected automatically when you load our interface.",
              "Aggregated, anonymised usage statistics (pages visited, features used) via privacy-respecting analytics with no cross-site tracking.",
              "Information you voluntarily submit when contacting us via email (e.g. security@usdax.finance).",
            ]} />
          </Section>

          <Section title="2. How We Use Your Information">
            <P>We use the limited data we collect to:</P>
            <Ul items={[
              "Operate, maintain, and improve the USDAX Finance interface.",
              "Detect and prevent fraud, abuse, or security vulnerabilities.",
              "Respond to support or security disclosures sent to us by email.",
              "Comply with applicable legal obligations.",
              "Produce anonymised, aggregated analytics to understand how the interface is used.",
            ]} />
            <P>
              We do not sell, rent, or share your data with third parties for marketing or advertising purposes.
            </P>
          </Section>

          <Section title="3. On-Chain Data">
            <P>
              All transactions executed via the USDAX Finance smart contracts are recorded permanently on the Robinhood
              Chain blockchain. Blockchain data is public by design and outside our control. Your wallet address, transaction
              amounts, collateral types, and timestamps are visible to anyone who queries the chain.
            </P>
            <P>
              We do not have the ability to delete or modify on-chain data. If you are concerned about on-chain privacy,
              consider using privacy-preserving tools before interacting with any public blockchain.
            </P>
          </Section>

          <Section title="4. Cookies and Local Storage">
            <P>
              Our interface uses browser local storage to remember your preferences (e.g. theme, last-visited page).
              We do not use third-party advertising cookies or tracking pixels.
            </P>
            <P>
              We may use first-party session cookies strictly necessary for the interface to function. These are not
              used to track you across other websites. For full details, see our{" "}
              <a href="/cookies" style={{ color: LIME, textDecoration: "none" }}>Cookie Policy</a>.
            </P>
          </Section>

          <Section title="5. Third-Party Services">
            <P>The interface may load assets or data from the following categories of third parties:</P>
            <Ul items={[
              "RPC providers: to read on-chain state from Robinhood Chain.",
              "IPFS gateways: for decentralised asset hosting.",
              "Privy: for optional wallet connection flows. Privy's own privacy policy governs their data handling.",
              "Price oracle networks: for real-time collateral valuations.",
            ]} />
            <P>
              We do not control how these third parties collect or process data. We encourage you to review their
              respective privacy policies.
            </P>
          </Section>

          <Section title="6. Data Retention">
            <P>
              We retain server-side logs (e.g. API request logs) for up to 30 days for security and debugging purposes,
              after which they are automatically deleted. Anonymised analytics data may be retained indefinitely.
            </P>
            <P>
              We do not retain copies of your wallet keys, private transaction data, or any off-chain personal
              information beyond what you voluntarily provide to us.
            </P>
          </Section>

          <Section title="7. Your Rights">
            <P>
              Depending on your jurisdiction, you may have rights including: access to data we hold about you,
              correction of inaccurate data, deletion of data we hold, and objection to certain processing activities.
            </P>
            <P>
              Because we collect minimal identifying data, most requests will be satisfied simply by clarifying that
              we do not hold personal data linked to you. To make a request, email{" "}
              <a href="mailto:privacy@usdax.finance" style={{ color: LIME, textDecoration: "none" }}>privacy@usdax.finance</a>.
            </P>
          </Section>

          <Section title="8. Children">
            <P>
              The USDAX Finance interface is not directed at children under the age of 18. We do not knowingly
              collect personal information from minors. If you believe a minor has provided us with personal
              information, please contact us and we will delete it promptly.
            </P>
          </Section>

          <Section title="9. Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time. When we do, we will update the "Last updated"
              date at the top of this page. Material changes will be announced via the official USDAX Finance
              Twitter/X account{" "}
              <a href="https://x.com/Usdax_Finance" target="_blank" rel="noopener noreferrer" style={{ color: LIME, textDecoration: "none" }}>@Usdax_Finance</a>.
              Continued use of the interface after changes constitutes acceptance of the updated policy.
            </P>
          </Section>

          <Section title="10. Contact">
            <P>
              For privacy-related questions or requests, contact us at:{" "}
              <a href="mailto:privacy@usdax.finance" style={{ color: LIME, textDecoration: "none" }}>privacy@usdax.finance</a>
            </P>
          </Section>

          {/* Footer links */}
          <div style={{ display: "flex", gap: 24, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
            <a href="/terms" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = MUTED)}>
              Terms of Service →
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
