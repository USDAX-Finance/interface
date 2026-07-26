import { BookOpen } from "lucide-react";

const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const BG      = "hsl(0 0% 4%)";
const MUTED   = "hsl(0 0% 28%)";

const posts = [
  {
    slug: "usdax-savings-rate-live",
    date: "July 24, 2026",
    category: "Product Update",
    color: EMERALD,
    title: "USDAX Savings Rate Now Live on Robinhood Chain",
    excerpt: "The USDAxSavings contract is now deployed on Robinhood Chain Testnet at 0xeBcbB803FC90A89ed1edb659528d771cA3B19958. USDAX holders can deposit and earn 4.20% APY with no lock-up period and no minimum deposit. The savings pool is seeded with 900 USDAX in reward reserves. The yield interface is live in the app under the Yield tab.",
    readTime: "3 min",
  },
  {
    slug: "q3-protocol-update",
    date: "July 10, 2026",
    category: "Protocol Update",
    color: LIME,
    title: "Q3 2026 Update: Vaults, Liquidations, and the Road to Mainnet",
    excerpt: "Three months into public testnet. Vault creation, collateral management, and the liquidation engine are all functioning as designed. This post covers what we've learned from testnet, the savings rate deployment, and what remains before mainnet is considered, including audit, live oracle, and peg mechanism.",
    readTime: "6 min",
  },
  {
    slug: "understanding-collateralization",
    date: "June 28, 2026",
    category: "Education",
    color: AMBER,
    title: "Understanding USDAX's Collateralization Model",
    excerpt: "A technical deep-dive into how CDP vaults work, why 150% minimum collateral ratio was chosen, how health factors are calculated in real time, and exactly what happens during a liquidation. Essential reading for anyone opening a vault on USDAX Finance.",
    readTime: "8 min",
  },
  {
    slug: "testnet-launch",
    date: "June 15, 2026",
    category: "Announcement",
    color: LIME,
    title: "USDAX Finance Goes Live on Robinhood Chain Testnet",
    excerpt: "Core smart contracts are now live on Robinhood Chain Testnet (Chain ID 46630). VaultEngine, CollateralManager, USDAX token, and the price oracle are all deployed and verified. The public testnet is open. Mint USDAX by depositing WETH, WBTC, or stETH collateral. Faucet tokens available.",
    readTime: "4 min",
  },
  {
    slug: "introducing-usdax-finance",
    date: "June 1, 2026",
    category: "Announcement",
    color: LIME,
    title: "Introducing USDAX Finance: Programmable Stablecoin on Robinhood Chain",
    excerpt: "Today we're launching USDAX Finance, a decentralized, overcollateralized stablecoin protocol built natively on Robinhood Chain. Here's why we chose Robinhood Chain, what makes USDAX different from other CDP stablecoins, our two-token design with APX, and what the roadmap looks like through 2027.",
    readTime: "5 min",
  },
];

export default function Blog() {
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
          {[{ label: "Staking", href: "/staking" }, { label: "Docs", href: "/docs" }, { label: "Audit", href: "/audit" }].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: 12, color: "hsl(0 0% 38%)", textDecoration: "none", padding: "6px 14px", border: `1px solid ${BORDER}`, borderRadius: 6 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)")}>{label}</a>
          ))}
          <a href="/app" style={{ fontSize: 12, fontWeight: 700, color: "hsl(0 0% 4%)", background: LIME, padding: "6px 16px", borderRadius: 6, textDecoration: "none" }}>Launch App</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: "80px 32px 48px", borderBottom: `1px solid ${BORDER}`, background: `radial-gradient(ellipse 50% 40% at 10% 0%, hsl(79 100% 57% / 0.04) 0%, transparent 70%)` }}>
        <div className="max-w-3xl mx-auto">
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", color: MUTED, marginBottom: 16, textTransform: "uppercase" }}>
            ◈ USDAX Finance · Blog
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", textTransform: "uppercase", lineHeight: 1, marginBottom: 16 }}>
            PROTOCOL <span style={{ color: LIME }}>UPDATES</span>
          </h1>
          <p style={{ fontSize: 15, color: "hsl(0 0% 40%)", lineHeight: 1.7 }}>
            Engineering updates, product announcements, and educational content from the USDAX Finance team.
            Posts are written by protocol engineers, not marketing.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section style={{ padding: "48px 32px 80px" }}>
        <div className="max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {posts.map((post, i) => (
            <article key={post.slug}
              style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 32px", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${LIME}22`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", background: `${post.color}10`, color: post.color, border: `1px solid ${post.color}25`, borderRadius: 6, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {post.category}
                </span>
                <span style={{ fontSize: 12, color: MUTED, fontFamily: "monospace" }}>{post.date}</span>
                {i === 0 && (
                  <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "monospace", background: `${LIME}10`, color: LIME, border: `1px solid ${LIME}22`, borderRadius: 4, padding: "1px 6px", letterSpacing: "0.1em", marginLeft: 4 }}>NEW</span>
                )}
                <span style={{ fontSize: 12, color: "hsl(0 0% 22%)", marginLeft: "auto" }}>{post.readTime} read</span>
              </div>

              <h2 style={{ fontWeight: 900, fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)", marginBottom: 12, color: "hsl(0 0% 92%)", lineHeight: 1.3 }}>
                {post.title}
              </h2>

              <p style={{ fontSize: 13, color: "hsl(0 0% 40%)", lineHeight: 1.7, marginBottom: 20 }}>
                {post.excerpt}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen style={{ width: 13, height: 13, color: MUTED }} />
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "monospace" }}>Full article publishing soon</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: "hsl(0 0% 22%)" }}>© 2026 USDAX Finance · All rights reserved.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[{ label: "Docs", href: "/docs" }, { label: "App", href: "/app" }, { label: "About", href: "/about" }, { label: "Audit", href: "/audit" }].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, color: "hsl(0 0% 28%)", textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
