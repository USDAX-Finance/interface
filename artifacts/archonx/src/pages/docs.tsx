import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  ChevronRight, ArrowLeft, Copy, Check,
  Shield, Zap, BarChart2, Lock, Code2,
  AlertTriangle, BookOpen, FileText, Layers,
  Cpu, Globe, ExternalLink, Hash,
} from "lucide-react";

/* ─── design tokens (match landing) ─── */
const LIME        = "hsl(79 100% 57%)";
const LIME_DIM    = "hsl(79 100% 57% / 0.08)";
const LIME_BORDER = "hsl(79 100% 57% / 0.18)";
const BORDER      = "hsl(0 0% 10%)";
const CARD_BG     = "hsl(0 0% 6%)";

/* ─── sidebar structure ─── */
const SECTIONS = [
  {
    group: "Overview",
    icon: BookOpen,
    items: [
      { id: "introduction",        label: "Introduction" },
      { id: "how-it-works",        label: "How It Works" },
      { id: "architecture",        label: "Architecture" },
    ],
  },
  {
    group: "Getting Started",
    icon: Zap,
    items: [
      { id: "connect-wallet",      label: "Connect Wallet" },
      { id: "mint-usdax",          label: "Mint USDAX" },
      { id: "stake-apx",           label: "APX Staking" },
    ],
  },
  {
    group: "USDAX Stablecoin",
    icon: Shield,
    items: [
      { id: "usdax-overview",      label: "Overview" },
      { id: "collateral",          label: "Collateral Types" },
      { id: "peg-stability",       label: "Peg Stability" },
      { id: "redemption",          label: "Redemption" },
    ],
  },
  {
    group: "APX Token",
    icon: Layers,
    items: [
      { id: "apx-overview",        label: "Overview" },
      { id: "governance",          label: "Governance" },
    ],
  },
  {
    group: "Protocol Mechanics",
    icon: Cpu,
    items: [
      { id: "minting-mechanics",   label: "Minting" },
      { id: "staking-mechanics",   label: "Staking & Rewards" },
      { id: "liquidations",        label: "Liquidations" },
      { id: "fees",                label: "Fees" },
    ],
  },
  {
    group: "Developers",
    icon: Code2,
    items: [
      { id: "contracts",           label: "Contract Addresses" },
      { id: "api-reference",       label: "API Reference" },
      { id: "sdk",                 label: "SDK" },
    ],
  },
  {
    group: "Security",
    icon: AlertTriangle,
    items: [
      { id: "audits",              label: "Audits" },
    ],
  },
  {
    group: "Resources",
    icon: Globe,
    items: [
      { id: "roadmap",             label: "Roadmap" },
      { id: "faq",                 label: "FAQ" },
      { id: "changelog",           label: "Changelog" },
    ],
  },
] as const;

/* ─── small reusable pieces ─── */
function CodeBlock({ code, lang = "solidity" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-5 rounded-xl overflow-hidden" style={{ background: "hsl(0 0% 5%)", border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-[10px] font-mono tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="flex items-center gap-1.5 text-[11px] transition-colors"
          style={{ color: copied ? LIME : "hsl(0 0% 35%)" }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-6 font-mono" style={{ color: "hsl(0 0% 72%)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InfoBox({ type = "info", children }: { type?: "info" | "warn" | "danger"; children: React.ReactNode }) {
  const map = {
    info:   { color: LIME,                  bg: LIME_DIM,                        border: LIME_BORDER,                label: "NOTE" },
    warn:   { color: "hsl(38 92% 58%)",     bg: "hsl(38 92% 58% / 0.07)",       border: "hsl(38 92% 58% / 0.2)",   label: "WARNING" },
    danger: { color: "hsl(0 80% 62%)",      bg: "hsl(0 80% 58% / 0.07)",        border: "hsl(0 80% 58% / 0.2)",    label: "CAUTION" },
  };
  const s = map[type];
  return (
    <div className="my-5 px-4 py-3.5 rounded-lg text-[13px] leading-relaxed"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: "hsl(0 0% 62%)" }}>
      <span className="font-black text-[10px] tracking-widest mr-2" style={{ color: s.color }}>{s.label}</span>
      {children}
    </div>
  );
}

function ParamTable({ rows }: { rows: { param: string; value: string; desc: string }[] }) {
  return (
    <div className="my-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: "hsl(0 0% 5%)", borderBottom: `1px solid ${BORDER}` }}>
            {["Parameter", "Value", "Description"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-semibold text-[11px] tracking-widest uppercase"
                style={{ color: "hsl(0 0% 35%)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none", background: i % 2 === 0 ? CARD_BG : "hsl(0 0% 5%)" }}>
              <td className="px-4 py-3 font-mono" style={{ color: LIME }}>{r.param}</td>
              <td className="px-4 py-3 font-semibold" style={{ color: "hsl(0 0% 85%)" }}>{r.value}</td>
              <td className="px-4 py-3" style={{ color: "hsl(0 0% 42%)" }}>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EXPLORER = "https://explorer.testnet.chain.robinhood.com";

function ContractTable({ rows }: { rows: { name: string; address: string; desc: string }[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 1800);
  }
  const isDeployed = (a: string) => a.startsWith("0x");
  return (
    <div className="my-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: "hsl(0 0% 5%)", borderBottom: `1px solid ${BORDER}` }}>
            {["Contract", "Address", "Description"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-semibold text-[11px] tracking-widest uppercase"
                style={{ color: "hsl(0 0% 35%)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none", background: i % 2 === 0 ? CARD_BG : "hsl(0 0% 5%)" }}>
              <td className="px-4 py-3 font-mono text-[12px]" style={{ color: LIME, whiteSpace: "nowrap" }}>{r.name}</td>
              <td className="px-4 py-3">
                {isDeployed(r.address) ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`${EXPLORER}/address/${r.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] transition-colors"
                      style={{ color: "hsl(0 0% 70%)", textDecoration: "none" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = LIME)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 70%)")}
                      title={r.address}
                    >
                      {r.address.slice(0, 10)}…{r.address.slice(-8)}
                      <ExternalLink className="inline ml-1 w-2.5 h-2.5" style={{ verticalAlign: "middle" }} />
                    </a>
                    <button
                      onClick={() => copy(r.address)}
                      title="Copy full address"
                      className="transition-colors"
                      style={{ color: copied === r.address ? LIME : "hsl(0 0% 28%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {copied === r.address ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ color: "hsl(38 92% 58%)", background: "hsl(38 92% 58% / 0.1)", border: "1px solid hsl(38 92% 58% / 0.2)" }}>
                    Not yet deployed
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[12px]" style={{ color: "hsl(0 0% 42%)" }}>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group flex items-center gap-2 font-black text-2xl mt-14 mb-5 scroll-mt-20"
      style={{ color: "hsl(0 0% 92%)" }}>
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-40 transition-opacity">
        <Hash className="w-4 h-4" style={{ color: LIME }} />
      </a>
    </h2>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="group flex items-center gap-2 font-bold text-lg mt-9 mb-3 scroll-mt-20"
      style={{ color: "hsl(0 0% 80%)" }}>
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-30 transition-opacity">
        <Hash className="w-3 h-3" style={{ color: LIME }} />
      </a>
    </h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-7 mb-4" style={{ color: "hsl(0 0% 48%)" }}>{children}</p>;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "hsl(0 0% 78%)", fontWeight: 600 }}>{children}</strong>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[14px] leading-6 mb-2.5" style={{ color: "hsl(0 0% 48%)" }}>
      <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0" style={{ background: LIME }} />
      <span>{children}</span>
    </li>
  );
}

/* ─── main content sections ─── */
function Content() {
  return (
    <div className="max-w-3xl">

      {/* ── INTRODUCTION ── */}
      <section id="introduction">
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.22em] uppercase mb-3" style={{ color: LIME }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} /> USDAX FINANCE · DOCS v1.0
        </div>
        <h1 className="font-black text-4xl leading-tight mb-5" style={{ color: "hsl(0 0% 96%)" }}>
          USDAX Finance<br />
          <span style={{ color: LIME }}>Documentation</span>
        </h1>
        <Prose>
          USDAX Finance is a decentralized stablecoin and yield infrastructure built on{" "}
          <Highlight>Robinhood Chain (EVM 46630)</Highlight>. It issues <Highlight>USDAX</Highlight>, a
          USD-pegged stablecoin overcollateralized by on-chain assets, and <Highlight>APX</Highlight>, the
          governance and staking token that captures protocol revenue and coordinates upgrades.
        </Prose>
        <Prose>
          The protocol enables any wallet holder to mint USDAX by depositing collateral, earn savings yield
          via the on-chain savings rate module, and (once APX launches) stake APX to earn protocol fees
          and participate in on-chain governance.
        </Prose>
        <InfoBox>
          USDAX Finance is non-custodial. Your assets remain in smart contracts, no team multisig holds
          user funds. Always verify contract addresses before interacting.
        </InfoBox>
      </section>

      {/* ── HOW IT WORKS ── */}
      <SectionHeading id="how-it-works">How It Works</SectionHeading>
      <Prose>
        USDAX Finance operates a two-token system. USDAX is the stable unit of account; APX is the
        volatile backstop and governance layer. The protocol collects stability fees on outstanding USDAX
        debt and distributes them to APX stakers.
      </Prose>
      <div className="grid sm:grid-cols-3 gap-4 my-6">
        {[
          { icon: "①", title: "Deposit Collateral", desc: "Deposit ETH, WBTC, USDC or other approved assets as collateral into a Vault." },
          { icon: "②", title: "Mint USDAX",         desc: "Borrow USDAX against your collateral at a minimum 150% collateral ratio." },
          { icon: "③", title: "Earn & Govern",       desc: "Deposit USDAX into the savings pool (4.20% APY), or stake APX at launch to earn protocol fees and vote on parameters." },
        ].map((s) => (
          <div key={s.title} className="rounded-xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="text-2xl font-black mb-3" style={{ color: LIME }}>{s.icon}</div>
            <div className="font-bold text-[13px] mb-2" style={{ color: "hsl(0 0% 85%)" }}>{s.title}</div>
            <div className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 40%)" }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* ── ARCHITECTURE ── */}
      <SectionHeading id="architecture">Architecture</SectionHeading>
      <Prose>
        The protocol consists of five core smart-contract modules, all deployed on Robinhood Chain. Each
        module is upgradeable via governance timelock (48-hour delay).
      </Prose>
      <ParamTable rows={[
        { param: "VaultManager",      value: "Core",        desc: "Handles collateral deposits, USDAX minting, and repayment." },
        { param: "LiquidationEngine", value: "Risk",        desc: "Monitors CR ratios and executes liquidations at threshold breach." },
        { param: "StabilityPool",     value: "Backstop",    desc: "Absorbs bad debt using USDAX deposited by stability providers." },
        { param: "APXStaking",        value: "Revenue",     desc: "Distributes fee revenue to APX stakers pro-rata." },
        { param: "Governance",        value: "Control",     desc: "Timelock + APX voting for parameter changes and upgrades." },
      ]} />

      {/* ── CONNECT WALLET ── */}
      <SectionHeading id="connect-wallet">Connect Wallet</SectionHeading>
      <Prose>
        USDAX Finance supports any EVM-compatible wallet. Add Robinhood Chain to your wallet before
        interacting with the protocol.
      </Prose>
      <SubHeading id="add-network">Add Robinhood Chain Testnet</SubHeading>
      <ParamTable rows={[
        { param: "Network Name", value: "Robinhood Chain Testnet",                      desc: "Display name in your wallet" },
        { param: "Chain ID",     value: "46630",                                          desc: "EVM chain identifier" },
        { param: "RPC URL",      value: "https://rpc.testnet.chain.robinhood.com/rpc",   desc: "Public RPC endpoint" },
        { param: "Currency",     value: "ETH",                                            desc: "Native gas token (Sepolia ETH)" },
        { param: "Explorer",     value: "https://explorer.testnet.chain.robinhood.com",  desc: "Official testnet block explorer" },
      ]} />
      <CodeBlock lang="javascript" code={`// Add Robinhood Chain Testnet via wagmi / ethers
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0xB666",          // 46630 in hex
    chainName: "Robinhood Chain Testnet",
    rpcUrls: ["https://rpc.testnet.chain.robinhood.com/rpc"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
  }],
});`} />

      {/* ── MINT USDAX ── */}
      <SectionHeading id="mint-usdax">Mint USDAX</SectionHeading>
      <Prose>
        Open a Vault by depositing collateral and minting USDAX up to your permitted borrowing capacity.
        Maintain a collateral ratio above the liquidation threshold to keep your vault safe.
      </Prose>
      <ul className="mb-4">
        <Li>Navigate to <Highlight>app → Vaults</Highlight> and click <strong>Open Vault</strong>.</Li>
        <Li>Select your collateral asset and enter the deposit amount.</Li>
        <Li>Enter the USDAX amount to mint, the UI shows your live collateral ratio.</Li>
        <Li>Approve the collateral token (one-time ERC-20 approval), then confirm the mint transaction.</Li>
        <Li>USDAX arrives in your wallet immediately after the transaction confirms.</Li>
      </ul>
      <InfoBox type="warn">
        Keep your collateral ratio well above 150%. Market volatility can push your ratio down quickly.
        A ratio below 130% triggers liquidation.
      </InfoBox>

      {/* ── STAKE APX ── */}
      <SectionHeading id="stake-apx">APX Staking</SectionHeading>
      <InfoBox type="warn">
        APX Token is not yet deployed. Staking will be available at the APX token generation event (TGE),
        planned for H2 2026 alongside mainnet launch. The steps below describe the intended flow.
      </InfoBox>
      <Prose>
        Once APX launches, stake APX tokens to earn a share of all stability fees and mint fees collected
        across the protocol. Rewards accrue in real-time and are paid in USDAX; real protocol revenue, not emissions.
      </Prose>
      <ul className="mb-4">
        <Li>Navigate to <Highlight>app → Staking</Highlight>.</Li>
        <Li>Enter the APX amount and click <strong>Stake</strong>. Approve if prompted.</Li>
        <Li>Your staking position is immediately active and begins accruing rewards.</Li>
        <Li>Claim rewards at any time; unstake with a 7-day unbonding delay.</Li>
      </ul>

      {/* ── USDAX OVERVIEW ── */}
      <SectionHeading id="usdax-overview">USDAX, Overview</SectionHeading>
      <Prose>
        USDAX is a fully decentralized USD-pegged stablecoin. Every USDAX in circulation is backed by
        at least <Highlight>$1.50 of on-chain collateral</Highlight> at time of mint.
        Unlike algorithmic designs, USDAX cannot be diluted by minting unbacked supply.
      </Prose>
      <ParamTable rows={[
        { param: "Peg",                  value: "$1.00 USD",    desc: "Target price, maintained by arbitrage and stability mechanisms." },
        { param: "Min Collateral Ratio", value: "150%",         desc: "Minimum CR required to open or maintain a vault." },
        { param: "Liquidation CR",       value: "130%",         desc: "Vault is eligible for liquidation below this ratio." },
        { param: "Stability Fee",        value: "0.5% / year",  desc: "Annualised interest charged on USDAX debt." },
        { param: "Mint Fee",             value: "0.1%",         desc: "One-time fee on newly minted USDAX." },
      ]} />

      {/* ── COLLATERAL ── */}
      <SectionHeading id="collateral">Collateral Types</SectionHeading>
      <Prose>
        The protocol accepts multiple collateral assets, each with its own risk parameters set by
        governance. All collateral is held in non-custodial smart contracts.
      </Prose>
      <ParamTable rows={[
        { param: "WETH",   value: "LTV 66%",   desc: "Wrapped ETH, primary collateral, highest liquidity." },
        { param: "WBTC",   value: "LTV 65%",   desc: "Wrapped Bitcoin, blue-chip cross-chain collateral." },
        { param: "USDC",   value: "LTV 80%",   desc: "Circle USDC, low-risk stable collateral, lower yield." },
        { param: "RHOOD",  value: "LTV 55%",   desc: "Native Robinhood Chain gas token, higher risk, higher yield." },
        { param: "stETH",  value: "LTV 63%",   desc: "Liquid staked ETH, accrues staking yield inside vault." },
      ]} />
      <InfoBox>
        Governance can add or remove collateral types via proposal. Newly proposed collateral has a 7-day
        review period before activation.
      </InfoBox>

      {/* ── PEG STABILITY ── */}
      <SectionHeading id="peg-stability">Peg Stability</SectionHeading>
      <Prose>
        USDAX maintains its peg through three complementary mechanisms:
      </Prose>
      <ul className="mb-4">
        <Li><Highlight>Arbitrage</Highlight>, when USDAX trades below $1, users buy it cheaply and redeem collateral at face value, profiting and restoring the peg.</Li>
        <Li><Highlight>Stability Pool</Highlight>, USDAX depositors absorb liquidated collateral at a discount, creating organic buy pressure.</Li>
        <Li><Highlight>Stability Fee Adjustment</Highlight>, governance raises or lowers the stability fee to incentivize or disincentivize new minting.</Li>
      </ul>

      {/* ── REDEMPTION ── */}
      <SectionHeading id="redemption">Redemption</SectionHeading>
      <Prose>
        Any USDAX holder can redeem USDAX for underlying collateral at face value ($1.00) at any time.
        Redemptions are executed against the riskiest vaults first (lowest CR), incentivising vault
        owners to maintain healthy ratios.
      </Prose>
      <InfoBox type="warn">
        Redemptions incur a 0.5% redemption fee. Vault owners whose collateral is redeemed have their
        USDAX debt reduced by an equal amount, they keep any excess collateral.
      </InfoBox>

      {/* ── APX OVERVIEW ── */}
      <SectionHeading id="apx-overview">APX Token, Overview</SectionHeading>
      <Prose>
        APX is the governance and value-accrual token of USDAX Finance. It captures 100% of protocol
        revenue (stability fees + mint fees) and is used to vote on all protocol parameters.
      </Prose>
      <ParamTable rows={[
        { param: "Total Supply",      value: "100,000,000 APX",  desc: "Fixed maximum supply, no inflation." },
        { param: "Staking APY",       value: "~15%+ (projected)", desc: "Estimate at launch, driven by protocol revenue, not emissions. Variable." },
        { param: "Revenue Share",     value: "100%",             desc: "All protocol fees flow to APX stakers." },
        { param: "Voting",            value: "1 APX = 1 vote",   desc: "Direct on-chain governance." },
        { param: "Unbonding Period",  value: "7 days",           desc: "Cooldown before unstaked APX is returned." },
      ]} />

      {/* ── GOVERNANCE ── */}
      <SectionHeading id="governance">Governance</SectionHeading>
      <Prose>
        USDAX Finance is governed by APX token holders. Any wallet holding ≥ 10,000 APX (or receiving
        delegation) can create a governance proposal. Proposals pass with a 4% quorum and &gt;50% approval,
        and are executed after a 48-hour timelock.
      </Prose>
      <ul className="mb-4">
        <Li>Governance can adjust collateral ratios, stability fees, and liquidation thresholds.</Li>
        <Li>Adding new collateral types requires a 7-day signalling period before a binding vote.</Li>
        <Li>Emergency shutdown requires a 2/3 supermajority and bypasses the timelock.</Li>
        <Li>Delegates can vote on behalf of APX holders who choose not to participate directly.</Li>
      </ul>

      {/* ── MINTING MECHANICS ── */}
      <SectionHeading id="minting-mechanics">Minting Mechanics</SectionHeading>
      <Prose>
        Minting USDAX creates a <Highlight>Vault</Highlight>, a collateralised debt position (CDP) on-chain.
        Each vault tracks deposited collateral, outstanding USDAX debt, and accrued stability fees.
      </Prose>
      <CodeBlock lang="solidity" code={`// Simplified VaultManager interface
interface IVaultManager {
    /// @notice Open a vault and mint USDAX
    /// @param collateral ERC-20 collateral token address
    /// @param collateralAmount Amount of collateral to deposit (18 dec)
    /// @param usdaxAmount Amount of USDAX to mint (18 dec)
    function openVaultAndMint(
        address collateral,
        uint256 collateralAmount,
        uint256 usdaxAmount
    ) external;

    /// @notice Repay debt and withdraw collateral
    function repayAndClose(uint256 vaultId) external;

    /// @notice Get current collateral ratio (1e18 = 100%)
    function collateralRatio(uint256 vaultId) external view returns (uint256);
}`} />

      {/* ── STAKING MECHANICS ── */}
      <SectionHeading id="staking-mechanics">Staking & Rewards</SectionHeading>
      <Prose>
        APX stakers receive a pro-rata share of all protocol fees. Rewards are denominated in USDAX and
        accrue every block. The APY varies with protocol usage, higher USDAX supply means higher fee
        revenue.
      </Prose>
      <CodeBlock lang="solidity" code={`// Simplified APXStaking interface
interface IAPXStaking {
    /// @notice Stake APX tokens
    function stake(uint256 amount) external;

    /// @notice Begin unbonding (7-day cooldown)
    function initiateUnstake(uint256 amount) external;

    /// @notice Claim accrued USDAX rewards
    function claimRewards() external returns (uint256 rewardAmount);

    /// @notice View pending rewards
    function pendingRewards(address staker) external view returns (uint256);
}`} />

      {/* ── LIQUIDATIONS ── */}
      <SectionHeading id="liquidations">Liquidations</SectionHeading>
      <Prose>
        When a vault's collateral ratio falls below <Highlight>130%</Highlight>, it becomes eligible for
        liquidation. Liquidators repay a portion of the debt and receive collateral plus a{" "}
        <Highlight>10% bonus</Highlight>.
      </Prose>
      <ul className="mb-4">
        <Li>Liquidators call <code style={{ color: LIME, fontSize: 12 }}>liquidate(vaultId)</code> and repay up to 50% of outstanding USDAX debt.</Li>
        <Li>They receive the equivalent collateral value <strong>+ 10% liquidation bonus</strong>.</Li>
        <Li>Remaining debt is absorbed by the Stability Pool if a liquidator isn't found within one block.</Li>
        <Li>Stability Pool depositors receive the liquidated collateral pro-rata (at a discount vs. market).</Li>
      </ul>
      <ParamTable rows={[
        { param: "Liquidation CR",      value: "130%",   desc: "Threshold below which a vault is liquidatable." },
        { param: "Max Repay",           value: "50%",    desc: "Maximum fraction of debt a single liquidator can repay." },
        { param: "Liquidation Bonus",   value: "10%",    desc: "Bonus collateral paid to the liquidator." },
        { param: "Stability Pool Fee",  value: "0%",     desc: "No fee for Stability Pool liquidations." },
      ]} />
      <InfoBox type="danger">
        If the Stability Pool is depleted and no liquidators act, the protocol redistributes bad debt
        across all active vaults in proportion to their collateral. This is the last-resort mechanism.
      </InfoBox>

      {/* ── FEES ── */}
      <SectionHeading id="fees">Fee Schedule</SectionHeading>
      <ParamTable rows={[
        { param: "Mint Fee",              value: "0.10%",        desc: "Applied once at time of USDAX issuance." },
        { param: "Stability Fee",         value: "0.50% / yr",   desc: "Continuous interest on outstanding debt." },
        { param: "Redemption Fee",        value: "0.50%",        desc: "Applied when redeeming USDAX for collateral." },
        { param: "Liquidation Bonus",     value: "10.00%",       desc: "Paid to liquidators from collateral." },
        { param: "Protocol Revenue Share", value: "100% to stakers", desc: "All collected fees distributed to APX stakers." },
      ]} />

      {/* ── CONTRACTS ── */}
      <SectionHeading id="contracts">Contract Addresses</SectionHeading>

      {/* Testnet-only warning */}
      <div className="my-5 px-4 py-4 rounded-xl flex gap-3 items-start"
        style={{ background: "hsl(38 92% 58% / 0.07)", border: "1px solid hsl(38 92% 58% / 0.25)" }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(38 92% 58%)" }} />
        <div>
          <p className="font-black text-[11px] tracking-widest uppercase mb-1" style={{ color: "hsl(38 92% 58%)" }}>
            Testnet Only: Do Not Send Real Funds
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 55%)" }}>
            All contracts below are deployed exclusively on <strong style={{ color: "hsl(0 0% 80%)" }}>Robinhood Chain Testnet (Chain ID 46630)</strong>.
            These are <strong style={{ color: "hsl(0 0% 80%)" }}>not mainnet addresses</strong>. Sending real assets to testnet contracts will result in permanent loss.
            Mainnet deployment is planned for H2 2026.
          </p>
        </div>
      </div>

      <Prose>
        Click any address to verify it on the{" "}
        <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-colors"
          style={{ color: LIME }}>
          Robinhood Chain Testnet explorer <ExternalLink className="w-3 h-3" />
        </a>.
        Use the copy button to copy the full address to your clipboard.
      </Prose>

      <ContractTable rows={[
        { name: "USDAX Token",       address: "0x89F2c042def8719930904A474FF999A0F8fddd64", desc: "ERC-20 stablecoin, mintable by depositing collateral into a vault." },
        { name: "VaultEngine",       address: "0xB5d971d69728B0C31b19A8f184d31813F29EEA20", desc: "CDP minting, repayment, and collateral management." },
        { name: "CollateralManager", address: "0x2472DCBA450e0AA2f81e69AaCD33f91528343854", desc: "Collateral risk parameters and ceiling enforcement." },
        { name: "PriceOracle",       address: "0xe5211fF6a85F51b290600B4807d0ee5F978cEC2D", desc: "On-chain testnet price feed. Mainnet will use a decentralised oracle." },
        { name: "WETH (testnet)",    address: "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc", desc: "Testnet WETH. Claim from the faucet to use as vault collateral; not real ETH." },
        { name: "WBTC (testnet)",    address: "0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34", desc: "Testnet WBTC. Claim from the faucet to use as vault collateral; not real BTC." },
        { name: "stETH (testnet)",   address: "0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e", desc: "Testnet stETH. Claim from the faucet to use as vault collateral; not real stETH." },
        { name: "APX Token",         address: "Not yet deployed",                             desc: "Governance token; activates at APX token launch (H2 2026)." },
        { name: "APXStaking",        address: "Not yet deployed",                             desc: "Staking rewards contract; activates at APX token launch." },
        { name: "Governance",        address: "Not yet deployed",                             desc: "On-chain voting and timelock; activates at APX token launch." },
      ]} />

      {/* ── API REFERENCE ── */}
      <SectionHeading id="api-reference">API Reference</SectionHeading>
      <Prose>
        The USDAX Finance REST API provides read access to protocol state without requiring a Web3
        connection. Base URL: <code style={{ color: LIME, fontSize: 12 }}>https://api.usdax.finance/v1</code>
      </Prose>
      <SubHeading id="api-protocol">Protocol Stats</SubHeading>
      <CodeBlock lang="http" code={`GET /v1/protocol/stats

Response:
{
  "totalUsdaxSupply": "42300000.00",
  "totalCollateralUsd": "87540000.00",
  "globalCollateralRatio": "2.07",
  "apxStaked": "31200000",
  "stakingApy": "0.41",
  "stabilityPoolBalance": "4200000.00"
}`} />
      <SubHeading id="api-vaults">Vaults</SubHeading>
      <CodeBlock lang="http" code={`GET /v1/vaults/:address

Response:
{
  "vaults": [
    {
      "id": "1042",
      "collateral": "WETH",
      "collateralAmount": "10.5",
      "collateralUsd": "38115.00",
      "debt": "22000.00",
      "collateralRatio": "1.732",
      "status": "safe",
      "stabilityFeeAccrued": "12.43"
    }
  ]
}`} />

      {/* ── SDK ── */}
      <SectionHeading id="sdk">SDK</SectionHeading>
      <Prose>
        The <code style={{ color: LIME, fontSize: 12 }}>@usdax-finance/sdk</code> package provides a
        typed TypeScript interface for all protocol interactions. The SDK is currently in early access
        Reach out via <a href="https://x.com/Usdax_Finance" target="_blank" rel="noopener noreferrer" style={{ color: LIME }}>@Usdax_Finance</a> for access.
      </Prose>
      <CodeBlock lang="bash" code={`npm install @usdax-finance/sdk
# or
pnpm add @usdax-finance/sdk`} />
      <CodeBlock lang="typescript" code={`import { UsdaxProtocol } from "@usdax-finance/sdk";
import { createWalletClient, custom } from "viem";

// Robinhood Chain Testnet (Chain ID 46630)
const robinhoodTestnet = {
  id: 46630,
  name: "Robinhood Chain Testnet",
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com/rpc"] } },
  blockExplorers: { default: { url: "https://explorer.testnet.chain.robinhood.com" } },
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

const walletClient = createWalletClient({
  chain: robinhoodTestnet,
  transport: custom(window.ethereum),
});

const usdax = new UsdaxProtocol({ walletClient });

// Open a vault and mint 5,000 USDAX against 3 WETH
const tx = await usdax.vaults.openAndMint({
  collateral: "WETH",
  collateralAmount: 3n * 10n ** 18n,
  usdaxAmount: 5000n * 10n ** 18n,
});

await tx.wait();
// tx confirmed: tx.hash

// Stake APX (available at APX launch)
const stakeTx = await usdax.staking.stake(1000n * 10n ** 18n);
await stakeTx.wait();`} />

      {/* ── AUDITS ── */}
      <SectionHeading id="audits">Audits</SectionHeading>
      <Prose>
        Security is the top priority. USDAX Finance undergoes multiple independent audits before each
        major release. All audit reports are published in full.
      </Prose>
      <div className="grid sm:grid-cols-2 gap-4 my-5">
        {[
          { firm: "Trail of Bits",    date: "Q2–Q3 2026", status: "In Progress", findings: "Report at completion" },
          { firm: "OpenZeppelin",     date: "H2 2026", status: "Scheduled", findings: "Pre-mainnet" },
          { firm: "Sigma Prime",      date: "2027",    status: "Planned",   findings: "-" },
          { firm: "Certora Prover",   date: "2027",    status: "Planned",   findings: "Formal verification" },
        ].map((a) => (
          <div key={a.firm} className="rounded-xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="font-bold text-[13px] mb-1" style={{ color: "hsl(0 0% 85%)" }}>{a.firm}</div>
            <div className="text-[12px] mb-3" style={{ color: "hsl(0 0% 35%)" }}>{a.date} · {a.status}</div>
            <div className="text-[12px]" style={{ color: "hsl(0 0% 48%)" }}>{a.findings}</div>
          </div>
        ))}
      </div>

      {/* ── ROADMAP ── */}
      <SectionHeading id="roadmap">Roadmap</SectionHeading>
      {[
        {
          q: "Q2 2026: Testnet",
          done: true,
          items: ["Core contracts deployed on Robinhood Chain testnet", "Audit 1 (Trail of Bits) in progress", "SDK v0.1 published", "Public testnet with faucet open"],
        },
        {
          q: "H2 2026: Mainnet Alpha",
          done: false,
          items: ["Mainnet launch on Robinhood Chain with WETH + stETH collateral", "Audit 2 (OpenZeppelin), in progress", "APX token generation event (TGE)", "USDAX Savings Rate fully on-chain (testnet: live)"],
        },
        {
          q: "2027: Expansion",
          done: false,
          items: ["WBTC and RWA collateral onboarding", "Cross-chain USDAX bridges (Ethereum, Arbitrum)", "APX staking and governance module activated", "Formal verification (Certora) complete"],
        },
        {
          q: "2027–2028: Ecosystem",
          done: false,
          items: ["Real-world asset (RWA) collateral expansion", "USDAX lending markets integration", "Decentralised oracle network transition", "v2 governance with quadratic voting"],
        },
      ].map((phase) => (
        <div key={phase.q} className="relative pl-6 mb-8"
          style={{ borderLeft: `2px solid ${phase.done ? LIME : BORDER}` }}>
          <div className="absolute -left-[5px] top-0.5 w-2 h-2 rounded-full"
            style={{ background: phase.done ? LIME : "hsl(0 0% 20%)" }} />
          <div className="font-bold text-[13px] mb-3" style={{ color: phase.done ? LIME : "hsl(0 0% 60%)" }}>
            {phase.q} {phase.done && <span className="text-[10px] ml-1 font-black tracking-widest">[COMPLETE]</span>}
          </div>
          <ul>
            {phase.items.map((item) => <Li key={item}>{item}</Li>)}
          </ul>
        </div>
      ))}

      {/* ── FAQ ── */}
      <SectionHeading id="faq">FAQ</SectionHeading>
      {[
        {
          q: "Is USDAX algorithmic?",
          a: "No. Every USDAX is backed by at least 150% of on-chain collateral. There is no algorithmic rebasing or unbacked issuance.",
        },
        {
          q: "What happens if my vault gets liquidated?",
          a: "A liquidator repays up to 50% of your USDAX debt and receives that collateral value plus a 10% bonus. Your remaining collateral stays in your vault and your debt is reduced. You retain ownership of the vault.",
        },
        {
          q: "Can I lose more than I deposited?",
          a: "In normal conditions, no. In extreme market scenarios where the Stability Pool is depleted, bad debt may be redistributed to other vault owners, slightly diluting their collateral. The protocol's overcollateralisation ensures this is rare.",
        },
        {
          q: "How is APX APY calculated?",
          a: "APY = (Annual Protocol Revenue in USDAX) / (Total APX Staked × APX Price). As protocol revenue grows and APX staked stays constant, APY rises.",
        },
        {
          q: "Is there a lock period for staking APX?",
          a: "Staking has no lock period. Unstaking initiates a 7-day unbonding period before tokens are returned to your wallet.",
        },
        {
          q: "Who controls the protocol?",
          a: "APX token holders govern the protocol via on-chain voting. The development team holds no admin keys. All upgrades go through a 48-hour timelock.",
        },
      ].map((item) => (
        <div key={item.q} className="mb-5 rounded-xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
          <div className="font-bold text-[14px] mb-2" style={{ color: "hsl(0 0% 82%)" }}>{item.q}</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "hsl(0 0% 44%)" }}>{item.a}</div>
        </div>
      ))}

      {/* ── CHANGELOG ── */}
      <SectionHeading id="changelog">Changelog</SectionHeading>
      {[
        { v: "v1.0.0", date: "Jul 2026", notes: ["Initial documentation release.", "Testnet contracts documented.", "SDK v0.1 reference added."] },
        { v: "v0.9.0", date: "Jun 2026", notes: ["Architecture overview added.", "Fee schedule finalised.", "Responsible disclosure policy published."] },
      ].map((entry) => (
        <div key={entry.v} className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-black font-mono text-[13px]" style={{ color: LIME }}>{entry.v}</span>
            <span className="text-[11px]" style={{ color: "hsl(0 0% 32%)" }}>{entry.date}</span>
          </div>
          <ul>{entry.notes.map((n) => <Li key={n}>{n}</Li>)}</ul>
        </div>
      ))}

      {/* bottom spacer */}
      <div className="h-20" />
    </div>
  );
}

/* ─── sidebar ─── */
function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto pb-10 pr-2">
      <nav className="pt-8">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.group} className="mb-5">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase mb-2 px-2"
                style={{ color: "hsl(0 0% 28%)" }}>
                <Icon className="w-3 h-3" />
                {section.group}
              </div>
              {section.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-all mb-0.5"
                    style={{
                      color: isActive ? LIME : "hsl(0 0% 38%)",
                      background: isActive ? LIME_DIM : "transparent",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                    {item.label}
                  </a>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* ─── top bar ─── */
function TopBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 gap-4"
      style={{ background: "hsl(0 0% 3% / 0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}` }}>
      <Link href="/">
        <div className="flex items-center gap-2 cursor-pointer mr-4">
          <img src="/favicon.png" alt="USDAX Finance" className="w-6 h-6 rounded" />
          <span className="font-bold text-sm" style={{ color: "hsl(0 0% 75%)" }}>
            USDAX <span style={{ color: "hsl(0 0% 35%)" }}>finance</span>
          </span>
        </div>
      </Link>
      <span style={{ color: BORDER, userSelect: "none" }}>|</span>
      <span className="text-[12px] font-semibold" style={{ color: "hsl(0 0% 38%)" }}>Documentation</span>
      <div className="flex-1" />
      <Link href="/">
        <button className="flex items-center gap-1.5 text-[12px] transition-colors"
          style={{ color: "hsl(0 0% 35%)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 35%)")}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </button>
      </Link>
      <Link href="/app">
        <button className="text-[12px] font-semibold px-4 py-2 rounded"
          style={{ background: LIME, color: "hsl(0 0% 4%)" }}>
          Launch App
        </button>
      </Link>
    </header>
  );
}

/* ─── active section tracker ─── */
function useActiveSection(): string {
  const [active, setActive] = useState("introduction");
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const allIds = SECTIONS.flatMap((s) => s.items.map((i) => i.id));
    const handler = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        for (let i = allIds.length - 1; i >= 0; i--) {
          const el = document.getElementById(allIds[i]);
          if (el && el.getBoundingClientRect().top <= 96) {
            setActive(allIds[i]);
            return;
          }
        }
        setActive(allIds[0]);
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => { window.removeEventListener("scroll", handler); cancelAnimationFrame(rafRef.current); };
  }, []);

  return active;
}

/* ─── page root ─── */
export default function Docs() {
  const active = useActiveSection();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ background: "hsl(0 0% 4%)" }}>
      <TopBar />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 flex gap-10">
        <Sidebar active={active} />
        <main className="flex-1 min-w-0 py-10 lg:py-12">
          <Content />
        </main>
      </div>
    </div>
  );
}
