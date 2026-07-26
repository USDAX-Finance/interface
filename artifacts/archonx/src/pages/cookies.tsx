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

type CookieRow = { name: string; type: string; purpose: string; duration: string };

function CookieTable({ rows }: { rows: CookieRow[] }) {
  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: MUTED,
    padding: "10px 16px",
    borderBottom: `1px solid ${BORDER}`,
  };
  const td: React.CSSProperties = {
    fontSize: 13,
    color: TEXT,
    padding: "12px 16px",
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: "top",
  };
  return (
    <div style={{ overflowX: "auto", marginBottom: 14, borderRadius: 10, border: `1px solid ${BORDER}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: CARD }}>
            <th style={th}>Name / Key</th>
            <th style={th}>Type</th>
            <th style={th}>Purpose</th>
            <th style={th}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} style={{ background: i % 2 === 0 ? "transparent" : `hsl(0 0% 5%)` }}>
              <td style={{ ...td, fontFamily: "monospace", color: LIME }}>{row.name}</td>
              <td style={td}>{row.type}</td>
              <td style={td}>{row.purpose}</td>
              <td style={{ ...td, whiteSpace: "nowrap" }}>{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicy() {
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
            Cookie Policy
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
              This Cookie Policy explains how USDAX Finance uses cookies and similar local storage technologies
              when you access the interface at{" "}
              <a href="https://usdax.finance" style={{ color: LIME, textDecoration: "none" }}>usdax.finance</a>.
              We keep our use of these technologies to the absolute minimum needed to operate the interface.
            </p>
          </div>

          <Section title="1. What Are Cookies?">
            <P>
              Cookies are small text files stored in your browser by websites you visit. They allow the website
              to remember information about your visit, such as your preferences or session state.
            </P>
            <P>
              In addition to traditional cookies, modern web apps also use browser <strong>local storage</strong>{" "}
              and <strong>session storage</strong>; these work similarly but are not transmitted to a server
              with every request. USDAX Finance primarily uses local storage rather than cookies.
            </P>
          </Section>

          <Section title="2. Cookies and Storage We Use">
            <P>
              USDAX Finance uses only strictly necessary and functional storage. We do not use advertising,
              tracking, or analytics cookies from third parties.
            </P>
            <CookieTable rows={[
              {
                name: "privy:session",
                type: "Session Cookie",
                purpose: "Maintains your wallet connection session via Privy. Cleared when you disconnect or close the browser.",
                duration: "Session",
              },
              {
                name: "usdax:theme",
                type: "Local Storage",
                purpose: "Remembers your interface theme preference (currently only dark mode is supported).",
                duration: "Persistent",
              },
              {
                name: "usdax:dismissed-*",
                type: "Local Storage",
                purpose: "Records which banners or notices you have dismissed so they are not shown again.",
                duration: "Persistent",
              },
              {
                name: "__cf_bm",
                type: "Third-party Cookie",
                purpose: "Set by Cloudflare for bot management and security. Helps distinguish automated traffic from human users.",
                duration: "30 minutes",
              },
              {
                name: "rpc:cache",
                type: "Session Storage",
                purpose: "Temporarily caches on-chain read responses to reduce RPC calls and improve page performance.",
                duration: "Session",
              },
            ]} />
          </Section>

          <Section title="3. What We Do Not Use">
            <P>We explicitly do not use:</P>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {[
                "Google Analytics, Meta Pixel, or any third-party behavioural tracking scripts.",
                "Advertising cookies or retargeting pixels.",
                "Cross-site tracking technologies.",
                "Fingerprinting or device-identification scripts.",
              ].map((item) => (
                <li key={item} style={{ listStyleType: "disc", fontSize: 14, color: TEXT }}>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="4. Third-Party Cookies">
            <P>
              Some third-party services used by the interface may set their own cookies:
            </P>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {[
                "Privy (wallet connection): sets a session cookie to maintain your authenticated wallet session. See Privy's privacy policy for details.",
                "Cloudflare (CDN / DDoS protection): sets a short-lived bot-detection cookie (__cf_bm) on requests to our infrastructure.",
              ].map((item) => (
                <li key={item} style={{ listStyleType: "disc", fontSize: 14, color: TEXT }}>
                  {item}
                </li>
              ))}
            </ul>
            <P>
              We have no control over cookies set by third parties. We recommend reviewing their respective
              privacy and cookie policies.
            </P>
          </Section>

          <Section title="5. Managing Cookies">
            <P>
              You can control and delete cookies through your browser settings. Most browsers allow you to:
            </P>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {[
                "View all cookies currently stored by your browser.",
                "Delete individual cookies or all cookies for a specific site.",
                "Block cookies from specific sites or all sites.",
                "Set your browser to notify you before a cookie is stored.",
              ].map((item) => (
                <li key={item} style={{ listStyleType: "disc", fontSize: 14, color: TEXT }}>
                  {item}
                </li>
              ))}
            </ul>
            <P>
              Note: Blocking strictly necessary cookies (such as the Privy session cookie) may prevent the
              interface from functioning correctly. You will be unable to maintain a wallet connection without
              accepting session cookies.
            </P>
          </Section>

          <Section title="6. Local Storage and How to Clear It">
            <P>
              To clear USDAX Finance local storage data, open your browser's developer tools (F12), navigate to
              Application → Local Storage → usdax.finance, and delete the relevant keys. Alternatively, clearing
              your browser's site data for usdax.finance will remove all stored preferences.
            </P>
          </Section>

          <Section title="7. Changes to This Policy">
            <P>
              We may update this Cookie Policy from time to time, particularly as our use of storage technologies
              evolves. When we do, we will update the "Last updated" date above and announce material changes
              via{" "}
              <a href="https://x.com/Usdax_Finance" target="_blank" rel="noopener noreferrer" style={{ color: LIME, textDecoration: "none" }}>@Usdax_Finance</a>{" "}
              on X.
            </P>
          </Section>

          <Section title="8. Contact">
            <P>
              Questions about our use of cookies? Contact us at{" "}
              <a href="mailto:support@usdax.finance" style={{ color: LIME, textDecoration: "none" }}>support@usdax.finance</a>.
            </P>
          </Section>

          {/* Footer links */}
          <div style={{ display: "flex", gap: 24, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
            <a href="/privacy" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = MUTED)}>
              Privacy Policy →
            </a>
            <a href="/terms" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = MUTED)}>
              Terms of Service →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
