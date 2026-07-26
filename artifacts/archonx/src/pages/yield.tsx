import { useState, useCallback } from "react";
import { HelpButton, HelpModal, HSection, Formula, Badge, RefTable } from "@/components/help-modal";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetYieldStats, useListYieldPools, useListYieldPositions,
  useDepositYield, useWithdrawYield, useClaimYieldRewards,
  getGetYieldStatsQueryKey, getListYieldPositionsQueryKey,
} from "@workspace/api-client-react";
import type { YieldPool, YieldPosition } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  formatCurrency, formatNumber, formatCompact,
  formatCompactNum, formatShortDateUTC,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/privy-auth";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient, createWalletClient, custom, http,
  defineChain, parseUnits,
} from "viem";
import {
  Sprout, TrendingUp, Layers, Zap, AlertTriangle,
  Coins, BarChart2, RefreshCw, Droplets,
  ArrowUpRight, ArrowDownLeft, X, Clock, CheckCircle2,
  Loader2,
} from "lucide-react";

/* ─── Chain + contract config ─── */
const RPC       = "https://rpc.testnet.chain.robinhood.com/rpc";
const EXPLORER  = "https://explorer.testnet.chain.robinhood.com";
const CHAIN_HEX = "0xb626";
const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "Robinhood Explorer", url: EXPLORER } },
});

const SAVINGS_CONTRACT = "0x1Ce84b4Fb6E6b44C767d4575bE56890DbC8EFA00" as `0x${string}`;
const USDAX_CONTRACT   = "0x89F2c042def8719930904A474FF999A0F8fddd64" as `0x${string}`;

const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;

const SAVINGS_ABI = [
  { name: "deposit",       type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "withdraw",      type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "claimRewards",  type: "function", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { name: "pendingRewards",type: "function", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const pubClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(RPC, { retryCount: 5, retryDelay: 1_000 }),
  pollingInterval: 2_000,
});

async function ensureChain(provider: any) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CHAIN_HEX, chainName: "Robinhood Chain Testnet",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [RPC], blockExplorerUrls: [EXPLORER],
        }],
      });
    } else throw err;
  }
}

/* ─── Design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const VIOLET  = "hsl(262 83% 68%)";
const RED     = "hsl(0 84% 60%)";
const BORDER  = "hsl(0 0% 11%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 8%)";
const MUTED   = "hsl(0 0% 40%)";
const DIM     = "hsl(0 0% 28%)";

const POOL_META: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  "savings":      { color: EMERALD, icon: Coins,    label: "Savings"    },
  "stable-lp":   { color: LIME,    icon: Droplets,  label: "Stable LP"  },
  "volatile-lp": { color: AMBER,   icon: BarChart2, label: "Volatile LP"},
  "vault":       { color: VIOLET,  icon: RefreshCw, label: "Auto-Vault" },
};

const RISK_COLOR: Record<string, string> = {
  low:    EMERALD,
  medium: AMBER,
  high:   RED,
};

/* ─── Shared atoms ─── */
function SectionLabel({ children, color = LIME, pulse = false }: {
  children: React.ReactNode; color?: string; pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pulse ? "animate-pulse" : ""}`}
        style={{ background: color }} />
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: DIM }}>
        {children}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: `${LIME}10`, border: `1px solid ${LIME}25` }}>
          <Sprout className="w-5 h-5" style={{ color: LIME }} />
        </div>
        <p className="font-mono text-[11px] tracking-widest uppercase animate-pulse" style={{ color: DIM }}>
          Loading yield pools…
        </p>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  label, value, sub, color, icon: Icon,
}: { label: string; value: string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: CARD, border: `1px solid ${color}15` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: DIM }}>{label}</span>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div className="font-black text-2xl font-mono mb-1" style={{ color }}>{value}</div>
      <div className="text-[12px]" style={{ color: DIM }}>{sub}</div>
    </div>
  );
}

/* ─── Live Pool Card ─── */
function LivePoolCard({ pool, onDeposit }: { pool: YieldPool; onDeposit: (pool: YieldPool) => void }) {
  const meta      = POOL_META[pool.type] ?? POOL_META["savings"];
  const color     = meta.color;
  const Icon      = meta.icon;
  const riskColor = RISK_COLOR[pool.riskLevel];
  const basePct   = pool.apy > 0 ? (pool.baseApy / pool.apy) * 100 : 100;
  const rewardPct = 100 - basePct;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: CARD, border: `1px solid ${color}20` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}20`; }}>

      {/* Top accent */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}70, ${color}15)` }} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}12`, border: `1.5px solid ${color}28` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: DIM }}>
                {meta.label}
              </div>
              <div className="font-black text-[15px] leading-tight" style={{ color: "hsl(0 0% 90%)" }}>
                {pool.name}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {/* LIVE badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: `${EMERALD}12`, border: `1px solid ${EMERALD}30` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
              <span className="font-mono text-[10px] font-black uppercase" style={{ color: EMERALD }}>Live</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${riskColor}10`, color: riskColor, border: `1px solid ${riskColor}20` }}>
              {pool.riskLevel} risk
            </span>
          </div>
        </div>

        {/* Protocol */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {pool.tokens.map((t) => (
              <span key={t} className="flex items-center gap-1 text-[10px] font-mono font-black px-2 py-0.5 rounded-full"
                style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                {t === "USDAX" && (
                  <img src="/usdax-coin.png" alt="USDAX" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                )}
                {t}
              </span>
            ))}
          </div>
          <span className="text-[11px] font-mono" style={{ color: DIM }}>{pool.protocol}</span>
        </div>

        {/* APY block */}
        <div className="rounded-xl p-4" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
          <div className="flex items-end justify-between mb-2">
            <span className="font-black text-[32px] font-mono leading-none" style={{ color }}>
              {formatNumber(pool.apy, 2)}%
            </span>
            <span className="font-mono text-[11px] tracking-widest uppercase mb-1" style={{ color: DIM }}>APY</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden flex mb-2" style={{ background: "hsl(0 0% 10%)" }}>
            <div className="h-full" style={{ width: `${basePct}%`, background: color, opacity: 0.9 }} />
            {pool.rewardApy > 0 && (
              <div className="h-full" style={{ width: `${rewardPct}%`, background: LIME, opacity: 0.7 }} />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[11px] font-mono" style={{ color: DIM }}>
                Base {formatNumber(pool.baseApy, 2)}%
              </span>
            </div>
            {pool.rewardApy > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
                <span className="text-[11px] font-mono" style={{ color: DIM }}>
                  APX {formatNumber(pool.rewardApy, 2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TVL */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: DIM }}>TVL</span>
          <span className="font-black font-mono text-[14px]" style={{ color: "hsl(0 0% 65%)" }}>
            {pool.tvlUsd > 0 ? formatCompact(pool.tvlUsd) : "$0"}
          </span>
        </div>

        {/* CTA */}
        <div>
          <button
            disabled={pool.type !== "savings"}
            onClick={() => pool.type === "savings" && onDeposit(pool)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              font-black text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: color, color: "hsl(0 0% 4%)" }}
            onMouseEnter={(e) => { if (pool.type === "savings") (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${color}30`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            <ArrowDownLeft className="w-4 h-4" />
            {pool.type === "savings" ? "Deposit USDAX" : "Coming Soon"}
          </button>
          <p className="text-center text-[11px] mt-2" style={{ color: "hsl(0 0% 35%)" }}>
            {pool.type === "savings"
              ? "Deposits go directly on-chain via USDAxSavings contract"
              : <><span>Contract live on-chain · Direct deposit via </span><a href={EXPLORER} target="_blank" rel="noopener noreferrer" style={{ color: "hsl(0 0% 55%)", textDecoration: "underline" }}>explorer</a></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Coming Soon Pool Card ─── */
function ComingSoonCard({ pool }: { pool: YieldPool }) {
  const meta      = POOL_META[pool.type] ?? POOL_META["savings"];
  const color     = meta.color;
  const Icon      = meta.icon;
  const riskColor = RISK_COLOR[pool.riskLevel];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, opacity: 0.65 }}>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}30, transparent)` }} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}08`, border: `1.5px solid ${color}18` }}>
              <Icon className="w-5 h-5" style={{ color: `${color}70` }} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: DIM }}>
                {meta.label}
              </div>
              <div className="font-black text-[15px] leading-tight" style={{ color: "hsl(0 0% 70%)" }}>
                {pool.name}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: `${AMBER}10`, border: `1px solid ${AMBER}25` }}>
              <Clock className="w-2.5 h-2.5" style={{ color: AMBER }} />
              <span className="font-mono text-[10px] font-black uppercase" style={{ color: AMBER }}>Coming Soon</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${riskColor}08`, color: `${riskColor}70`, border: `1px solid ${riskColor}15` }}>
              {pool.riskLevel} risk
            </span>
          </div>
        </div>

        {/* Protocol */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {pool.tokens.map((t) => (
              <span key={t} className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full"
                style={{ background: `${color}07`, color: `${color}60`, border: `1px solid ${color}12` }}>
                {t}
              </span>
            ))}
          </div>
          <span className="text-[11px] font-mono" style={{ color: DIM }}>{pool.protocol}</span>
        </div>

        {/* APY (projected) */}
        <div className="rounded-xl p-4" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
          <div className="flex items-end justify-between mb-2">
            <span className="font-black text-[32px] font-mono leading-none" style={{ color: "hsl(0 0% 50%)" }}>
              {formatNumber(pool.apy, 2)}%
            </span>
            <div className="text-right mb-1">
              <div className="font-mono text-[11px] tracking-widest uppercase" style={{ color: DIM }}>APY</div>
              <div className="font-mono text-[9px] uppercase" style={{ color: AMBER }}>Projected</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
            <div className="h-full rounded-full" style={{ width: "60%", background: "hsl(0 0% 20%)" }} />
          </div>
        </div>

        {/* Pending info */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: `${AMBER}06`, border: `1px solid ${AMBER}15` }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: AMBER }} />
          <span className="text-[11px]" style={{ color: `${AMBER}90` }}>
            {pool.feeTier
              ? `Pending ${pool.protocol} deployment on Robinhood Chain`
              : "Awaiting external protocol deployment"}
          </span>
        </div>

        {/* Disabled button */}
        <button disabled
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            font-black text-[13px] cursor-not-allowed opacity-40"
          style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 40%)", border: `1px solid ${BORDER}` }}>
          <Clock className="w-4 h-4" /> Coming Soon
        </button>
      </div>
    </div>
  );
}

/* ─── Position Card ─── */
function PositionCard({
  pos, onClaim, onWithdraw, claiming, withdrawing,
}: {
  pos: YieldPosition; onClaim: (id: number) => void;
  onWithdraw: (pos: YieldPosition) => void; claiming: boolean; withdrawing: boolean;
}) {
  const meta       = POOL_META[pos.poolType] ?? POOL_META["savings"];
  const color      = meta.color;
  const Icon       = meta.icon;
  const hasFees    = pos.pendingFeesUsdax    > 0.001;
  const hasAny     = hasFees;
  const pnlPos     = pos.pnlPercent >= 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${color}18` }}>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}60, transparent)` }} />

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}12`, border: `1.5px solid ${color}25` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="flex items-center gap-1 text-[10px] font-mono font-black px-2 py-0.5 rounded-full"
                style={{ background: `${EMERALD}10`, color: EMERALD, border: `1px solid ${EMERALD}22` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
                ACTIVE
              </span>
              <span className="font-mono text-[11px] font-bold" style={{ color: LIME }}>
                {formatNumber(pos.apy, 2)}% APY
              </span>
            </div>
            <div className="font-black text-[14px]" style={{ color: "hsl(0 0% 88%)" }}>{pos.poolName}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-black font-mono text-[15px]" style={{ color: pnlPos ? LIME : RED }}>
            {pnlPos ? "+" : ""}{formatCurrency(pos.pnlUsd)}
          </div>
          <div className="text-[11px] font-mono" style={{ color: pnlPos ? `${LIME}70` : `${RED}70` }}>
            {pnlPos ? "+" : ""}{formatNumber(pos.pnlPercent, 3)}%
          </div>
        </div>
      </div>

      {/* Deposited / Current */}
      <div className="grid grid-cols-2 gap-0 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="pr-4" style={{ borderRight: `1px solid ${BORDER}` }}>
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: DIM }}>Deposited</div>
          <div className="font-black font-mono text-[16px]" style={{ color: "hsl(0 0% 80%)" }}>
            {formatCompactNum(pos.depositedUsdax)}
            <span className="font-medium text-[11px] ml-1" style={{ color: DIM }}>USDAX</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: DIM }}>Since {formatShortDateUTC(pos.depositedAt)}</div>
        </div>
        <div className="pl-4">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1.5" style={{ color: DIM }}>Current Value</div>
          <div className="font-black font-mono text-[16px]" style={{ color: "hsl(0 0% 92%)" }}>
            {formatCurrency(pos.currentValueUsd)}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="text-[11px]" style={{ color: DIM }}>Accumulating</span>
          </div>
        </div>
      </div>

      {/* Pending fee earnings */}
      {hasFees && (
        <div className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
              <Droplets className="w-3 h-3" style={{ color }} />
            </div>
            <div>
              <div className="text-[10px] font-mono" style={{ color: DIM }}>Fee Earnings</div>
              <div className="font-black font-mono text-[13px]" style={{ color }}>
                +{formatNumber(pos.pendingFeesUsdax, 4)} USDAX
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-5 py-4">
        <button
          disabled={!hasAny || claiming}
          onClick={() => onClaim(pos.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
            font-black text-[12px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: hasAny ? `${LIME}10` : "hsl(0 0% 7%)",
            color: hasAny ? LIME : "hsl(0 0% 28%)",
            border: hasAny ? `1px solid ${LIME}22` : `1px solid ${BORDER}`,
          }}>
          <Zap className="w-3.5 h-3.5" />
          {claiming ? "Claiming…" : "Claim"}
        </button>
        <button
          disabled={withdrawing}
          onClick={() => onWithdraw(pos)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
            font-black text-[12px] transition-all disabled:opacity-30"
          style={{ background: `${RED}08`, color: RED, border: `1px solid ${RED}20` }}>
          <ArrowUpRight className="w-3.5 h-3.5" />
          {withdrawing ? "Processing…" : "Withdraw"}
        </button>
      </div>
    </div>
  );
}

/* ─── Deposit Modal ─── */
function DepositModal({
  pool, onClose, onConfirm, loading,
}: { pool: YieldPool; onClose: () => void; onConfirm: (amount: number) => void; loading: boolean }) {
  const [amount, setAmount] = useState("");
  const meta    = POOL_META[pool.type] ?? POOL_META["savings"];
  const color   = meta.color;
  const Icon    = meta.icon;
  const preview = parseFloat(amount) || 0;
  const yearly  = preview * (pool.apy / 100);
  const monthly = yearly / 12;
  const weekly  = yearly / 52;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden"
        style={{ background: "hsl(0 0% 5%)", border: `1px solid ${color}28` }}>
        <div className="h-0.5" style={{ background: `${color}70` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}12`, border: `1.5px solid ${color}28` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <div className="font-black text-[15px]" style={{ color: "hsl(0 0% 90%)" }}>Deposit USDAX</div>
              <div className="text-[11px] font-mono" style={{ color: DIM }}>{pool.name}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: MUTED, background: "hsl(0 0% 9%)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = MUTED; }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Pool stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "APY",  v: `${formatNumber(pool.apy, 2)}%`, c: color },
              { l: "TVL",  v: pool.tvlUsd > 0 ? formatCompact(pool.tvlUsd) : "$0", c: MUTED },
              { l: "Risk", v: pool.riskLevel, c: RISK_COLOR[pool.riskLevel] },
            ].map((s) => (
              <div key={s.l} className="text-center rounded-xl p-3"
                style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: DIM }}>{s.l}</div>
                <div className="font-black text-[13px] font-mono capitalize" style={{ color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Amount input */}
          <div>
            <label className="block font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: DIM }}>
              Amount (USDAX)
            </label>
            <div className="relative">
              <Input
                type="number" min="0" step="any" placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  background: CARD2,
                  border: `1px solid ${amount && preview > 0 ? `${color}40` : BORDER}`,
                  borderRadius: "12px",
                  fontFamily: "monospace",
                  fontSize: "20px",
                  fontWeight: 900,
                  color: "hsl(0 0% 90%)",
                  height: "54px",
                  paddingRight: "80px",
                  outline: "none",
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black text-[12px]"
                style={{ color }}>USDAX</span>
            </div>
          </div>

          {/* Projection */}
          {preview > 0 && (
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
              <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: DIM }}>
                Projected Returns
              </div>
              {[
                { l: "Weekly",  v: formatCurrency(weekly)  },
                { l: "Monthly", v: formatCurrency(monthly) },
                { l: "Yearly",  v: formatCurrency(yearly)  },
              ].map((r) => (
                <div key={r.l} className="flex justify-between items-center">
                  <span className="text-[13px]" style={{ color: MUTED }}>{r.l}</span>
                  <span className="font-black font-mono text-[13px]" style={{ color }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm */}
          <button
            disabled={!preview || loading}
            onClick={() => onConfirm(preview)}
            className="w-full font-black py-3.5 rounded-xl text-[14px] transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: color, color: "hsl(0 0% 4%)" }}
            onMouseEnter={(e) => {
              if (!loading && preview) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${color}28`;
            }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            {loading ? "Confirming…" : `Deposit ${preview > 0 ? formatCompactNum(preview) + " USDAX" : ""}`}
          </button>

          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: DIM }} />
            <p className="text-[11px] leading-relaxed" style={{ color: DIM }}>
              APY is variable and may change. Past returns do not guarantee future results.
              Review protocol risks before depositing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ─── */
export default function YieldPage() {
  const queryClient  = useQueryClient();
  const { toast }    = useToast();
  const { address, authenticated, login } = useAuth();
  const { wallets }  = useWallets();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats,     isLoading: statsLoading }  = (useGetYieldStats as any)(address ?? undefined) as ReturnType<typeof useGetYieldStats>;
  const { data: pools,     isLoading: poolsLoading }  = useListYieldPools();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: positions, isLoading: posLoading }    = (useListYieldPositions as any)(address ?? undefined) as ReturnType<typeof useListYieldPositions>;

  const [depositPool,   setDepositPool]   = useState<YieldPool | null>(null);
  const [claimingId,    setClaimingId]    = useState<number | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [depositStep,   setDepositStep]   = useState<"idle"|"approving"|"depositing"|"confirming">("idle");
  const [showHelp,      setShowHelp]      = useState(false);

  /* API mutations — used as fallback / DB sync after on-chain success */
  const depositMutation = useDepositYield({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetYieldStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListYieldPositionsQueryKey() });
        setDepositPool(null);
        setDepositStep("idle");
      },
    },
  });

  const claimMutation = useClaimYieldRewards({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListYieldPositionsQueryKey() });
        setClaimingId(null);
      },
      onError: () => setClaimingId(null),
    },
  });

  const withdrawMutation = useWithdrawYield({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetYieldStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListYieldPositionsQueryKey() });
        setWithdrawingId(null);
      },
      onError: () => setWithdrawingId(null),
    },
  });

  /* ── On-chain helper ── */
  const getWalletClient = useCallback(async () => {
    if (!authenticated || !address) { login(); throw new Error("not authenticated"); }
    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    const provider = await wallet.getEthereumProvider();
    await ensureChain(provider);
    const wc = createWalletClient({ chain: robinhoodTestnet, transport: custom(provider) });
    const [account] = await wc.requestAddresses();
    return { wc, account };
  }, [authenticated, address, login, wallets]);

  /* ── Savings deposit: approve USDAX → USDAxSavings.deposit() ── */
  const handleDepositConfirm = useCallback(async (amount: number) => {
    if (!depositPool) return;

    if (depositPool.type !== "savings") {
      depositMutation.mutate({ poolId: depositPool.id, amount, owner: address ?? "" });
      return;
    }

    const amountWei = parseUnits(amount.toString(), 18);
    try {
      setDepositStep("approving");
      const { wc, account } = await getWalletClient();

      const approveHash = await wc.writeContract({
        account, address: USDAX_CONTRACT, abi: ERC20_ABI,
        functionName: "approve", args: [SAVINGS_CONTRACT, amountWei],
      });
      setDepositStep("confirming");
      await pubClient.waitForTransactionReceipt({ hash: approveHash, timeout: 120_000 });

      setDepositStep("depositing");
      const depositHash = await wc.writeContract({
        account, address: SAVINGS_CONTRACT, abi: SAVINGS_ABI,
        functionName: "deposit", args: [amountWei],
      });
      setDepositStep("confirming");
      await pubClient.waitForTransactionReceipt({ hash: depositHash, timeout: 120_000 });

      /* Sync to DB */
      depositMutation.mutate({ poolId: depositPool.id, amount, owner: address ?? "" });
      toast({
        title: "Deposited ✓",
        description: (
          <span>{amount} USDAX earning 4.20% APY. <a href={`${EXPLORER}/tx/${depositHash}`} target="_blank" rel="noopener noreferrer" className="underline">View tx</a></span>
        ),
      });
    } catch (e: any) {
      setDepositStep("idle");
      const msg = e?.code === 4001 ? "Rejected in wallet." : e?.shortMessage || e?.message?.slice(0, 120) || "Failed.";
      toast({ title: "Deposit failed", description: msg, variant: "destructive" });
    }
  }, [depositPool, address, getWalletClient, depositMutation, toast]);

  /* ── Savings claim: USDAxSavings.claimRewards() ── */
  const handleClaim = useCallback(async (pos: YieldPosition) => {
    if (pos.poolType !== "savings") {
      setClaimingId(pos.id);
      claimMutation.mutate({ id: pos.id });
      return;
    }
    setClaimingId(pos.id);
    try {
      const { wc, account } = await getWalletClient();
      const hash = await wc.writeContract({
        account, address: SAVINGS_CONTRACT, abi: SAVINGS_ABI, functionName: "claimRewards", args: [],
      });
      await pubClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      claimMutation.mutate({ id: pos.id });
      toast({ title: "Rewards claimed ✓", description: <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="underline">View tx</a> });
    } catch (e: any) {
      setClaimingId(null);
      const msg = e?.code === 4001 ? "Rejected." : e?.shortMessage || "Failed.";
      toast({ title: "Claim failed", description: msg, variant: "destructive" });
    }
  }, [getWalletClient, claimMutation, toast]);

  /* ── Savings withdraw: USDAxSavings.withdraw() ── */
  const handleWithdraw = useCallback(async (pos: YieldPosition) => {
    if (pos.poolType !== "savings") {
      setWithdrawingId(pos.id);
      withdrawMutation.mutate({ id: pos.id, amount: pos.depositedUsdax });
      return;
    }
    setWithdrawingId(pos.id);
    const amountWei = parseUnits(pos.depositedUsdax.toString(), 18);
    try {
      const { wc, account } = await getWalletClient();
      const hash = await wc.writeContract({
        account, address: SAVINGS_CONTRACT, abi: SAVINGS_ABI,
        functionName: "withdraw", args: [amountWei],
      });
      await pubClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      withdrawMutation.mutate({ id: pos.id, amount: pos.depositedUsdax });
      toast({ title: "Withdrawn ✓", description: <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="underline">View tx</a> });
    } catch (e: any) {
      setWithdrawingId(null);
      const msg = e?.code === 4001 ? "Rejected." : e?.shortMessage || "Failed.";
      toast({ title: "Withdrawal failed", description: msg, variant: "destructive" });
    }
  }, [getWalletClient, withdrawMutation, toast]);

  if (statsLoading || poolsLoading || posLoading) return <LoadingState />;
  if (!stats || !pools) return null;

  const livePools    = pools.filter((p) => p.isActive);
  const pendingPools = pools.filter((p) => !p.isActive);
  const totalEarned  = positions?.reduce((s, p) => s + p.pnlUsd, 0) ?? 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: DIM }}>
              USDAX Finance · Yield Pools
            </span>
          </div>
          <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight mb-2 flex items-center gap-3">
            USDAX <span style={{ color: LIME }}>Yield</span>
            <HelpButton onClick={() => setShowHelp(true)} />
          </h1>
          <p className="text-[14px] leading-relaxed max-w-xl" style={{ color: MUTED }}>
            Deploy idle USDAX into the savings pool. Earn protocol fees and
            auto-compounded returns on Robinhood Chain.
          </p>
        </div>
        {totalEarned > 0 && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 flex-shrink-0"
            style={{ background: `${LIME}07`, border: `1px solid ${LIME}20` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="text-[12px]" style={{ color: MUTED }}>Total earned</span>
            <span className="font-black font-mono text-[14px]" style={{ color: LIME }}>
              +{formatCurrency(totalEarned)}
            </span>
          </div>
        )}
      </div>

      {/* ── How the 4.20% yield is funded (always visible) ── */}
      <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: DIM }}>
          How Yield Is Funded
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-3">
          {[
            {
              icon: Layers,
              color: LIME,
              title: "Vault Owners Mint USDAX",
              desc: "Every time someone opens a vault and mints USDAX, a 0.5% mint fee is charged on the amount. Example: mint 1,000 USDAX, pay 5 USDAX as fee.",
            },
            {
              icon: Zap,
              color: AMBER,
              title: "Fees Fund the Reward Pool",
              desc: "The 0.5% mint fee flows into the USDAxSavings reward pool on-chain. This pool is the source of all savings yield; no external subsidy.",
            },
            {
              icon: TrendingUp,
              color: EMERALD,
              title: "Depositors Earn 4.20% APY",
              desc: "Deposit your USDAX into the Savings pool. Rewards accrue every second. Claim or withdraw anytime; no lock-up, no impermanent loss.",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div>
                <div className="font-black text-[12px] mb-1" style={{ color: "hsl(0 0% 82%)" }}>{item.title}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: DIM }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 text-[11px] font-mono" style={{ borderTop: `1px solid ${BORDER}`, color: "hsl(0 0% 28%)" }}>
          Economic loop: Vault owners pay fees to borrow USDAX liquidity. Those fees fund savers. Savers earn yield for providing USDAX depth to the protocol.
        </div>
      </div>

      {/* ── Get Started flow (shown when user has no yield positions) ── */}
      {(!positions || positions.length === 0) && (
        <div className="rounded-2xl p-5" style={{ background: `${EMERALD}06`, border: `1px solid ${EMERALD}20` }}>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: `${EMERALD}80` }}>
            Get Started in 3 Steps
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              {
                step: "1",
                color: LIME,
                title: "Get Testnet Tokens",
                desc: "Claim free WETH, WBTC, or stETH from the Faucet. These are your collateral.",
                action: "Go to Faucet",
                href: "/faucet",
              },
              {
                step: "2",
                color: EMERALD,
                title: "Open a Vault, Mint USDAX",
                desc: "Deposit collateral into Vaults. The protocol mints USDAX directly to your wallet at no cost beyond the 0.5% fee.",
                action: "Open a Vault",
                href: "/app/positions",
              },
              {
                step: "3",
                color: AMBER,
                title: "Deposit USDAX Here",
                desc: "Come back to this page, click Deposit on the Savings pool, and start earning 4.20% APY immediately.",
                action: null,
                href: null,
              },
            ].map((s) => (
              <div key={s.step} className="flex-1 rounded-xl p-4"
                style={{ background: "hsl(0 0% 5%)", border: `1px solid ${s.color}15` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px]"
                    style={{ background: `${s.color}20`, color: s.color }}>
                    {s.step}
                  </span>
                  <span className="font-black text-[12px]" style={{ color: "hsl(0 0% 85%)" }}>{s.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: DIM }}>{s.desc}</p>
                {s.href && (
                  <a href={s.href}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black font-mono px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}>
                    <ArrowDownLeft className="w-3 h-3" />
                    {s.action}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pool TVL"         value={formatCompact(stats.totalTvlUsd)}           sub={`${stats.activePools} live pool${stats.activePools !== 1 ? "s" : ""}`}             color={LIME}    icon={Layers}     />
        <StatCard label="Best Live APY"    value={`${formatNumber(stats.bestApy, 2)}%`}       sub="USDAX Savings Rate"                                                                 color={EMERALD} icon={TrendingUp} />
        <StatCard label="Your Deposited"   value={formatCompact(stats.userTotalDepositedUsd)} sub={`${stats.userPositions} position${stats.userPositions !== 1 ? "s" : ""}`}           color={LIME}    icon={Sprout}     />
        <StatCard label="Your Yield"       value={formatCurrency(stats.userTotalEarnedUsd)}   sub="All time, all pools"                                                                color={EMERALD} icon={Zap}        />
      </div>

      {/* ── Live Pools ── */}
      {livePools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <SectionLabel color={EMERALD} pulse>Live Pools</SectionLabel>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: `${EMERALD}10`, border: `1px solid ${EMERALD}25` }}>
                <CheckCircle2 className="w-3 h-3" style={{ color: EMERALD }} />
                <span className="font-mono text-[10px] font-black" style={{ color: EMERALD }}>
                  {livePools.length} deployed on-chain
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {livePools.map((pool) => (
              <LivePoolCard key={pool.id} pool={pool} onDeposit={setDepositPool} />
            ))}
          </div>
        </div>
      )}

      {/* ── Roadmap ── */}
      <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 mb-4">
          <SectionLabel color={AMBER}>Roadmap</SectionLabel>
          <span className="font-mono text-[11px]" style={{ color: DIM }}>
            Additional yield strategies planned for mainnet
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "Stable LP",   desc: "USDAX/USDC liquidity pool",         req: "Uniswap V3 on Robinhood Chain", apy: "8–12%" },
            { name: "Volatile LP", desc: "USDAX/ETH concentrated liquidity",   req: "Uniswap V3 on Robinhood Chain", apy: "15–25%" },
            { name: "Auto-Vault",  desc: "Auto-compounding collateral yield",   req: "Mainnet vault deployment",      apy: "Variable" },
          ].map((item) => (
            <div key={item.name} className="rounded-xl p-4" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-[13px]" style={{ color: "hsl(0 0% 65%)" }}>{item.name}</span>
                <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${AMBER}10`, color: AMBER, border: `1px solid ${AMBER}25` }}>
                  {item.apy} APY
                </span>
              </div>
              <p className="text-[12px] mb-2" style={{ color: DIM }}>{item.desc}</p>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(0 0% 28%)" }} />
                <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>Requires: {item.req}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Your Positions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel color={LIME} pulse={!!positions?.length}>Your Positions</SectionLabel>
          {positions && positions.length > 0 && (
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-full"
              style={{ background: `${LIME}10`, color: LIME, border: `1px solid ${LIME}20` }}>
              {positions.length} active
            </span>
          )}
        </div>

        {positions && positions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {positions.map((pos) => (
              <PositionCard
                key={pos.id}
                pos={pos}
                claiming={claimingId === pos.id}
                withdrawing={withdrawingId === pos.id}
                onClaim={(id) => { const p = positions?.find(x => x.id === id); if (p) handleClaim(p); }}
                onWithdraw={(p) => handleWithdraw(p)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-5 rounded-2xl"
            style={{ background: CARD, border: `1px dashed ${BORDER}` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}>
              <Sprout className="w-6 h-6" style={{ color: "hsl(0 0% 28%)" }} />
            </div>
            <div className="text-center">
              <div className="font-black text-[15px] mb-1" style={{ color: "hsl(0 0% 42%)" }}>
                No yield positions yet
              </div>
              <div className="text-[13px]" style={{ color: DIM }}>
                Deposit USDAX into the savings pool above to start earning 4.20% APY
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Yield Guide Modal ── */}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} title="Yield Guide: How to Earn with USDAX" accent="hsl(152 70% 48%)">
        <HSection title="What is the Savings Pool?">
          <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
            The <strong style={{ color: "hsl(0 0% 90%)" }}>USDAX Savings Pool</strong> is a fully on-chain yield mechanism.
            Deposit your idle USDAX and earn <strong style={{ color: "hsl(152 70% 48%)" }}>4.20% APY</strong> passively.
            Rewards come from protocol fees collected from Vault borrowers.
            No lock-up period; withdraw anytime.
          </p>
        </HSection>

        <HSection title="APY Formula">
          <Formula>{`Daily reward  = Deposited USDAX × 4.20% ÷ 365

Example with 500 USDAX:
  = 500 × 0.042 ÷ 365
  = 0.0575 USDAX per day  (~$0.058/day)
  = ~$21.00 per year`}</Formula>
        </HSection>

        <HSection title="Recommended Test: 500 USDAX">
          <Formula>{`Step 1 : Open a Vault, mint 800 USDAX
Step 2 : Deposit 500 USDAX into savings
Step 3 : Keep 300 USDAX in wallet (to repay vault later)

Earnings after 1 day  : ~0.058 USDAX
Earnings after 7 days : ~0.40 USDAX
Earnings after 30 days: ~1.73 USDAX`}</Formula>
        </HSection>

        <HSection title="Quick Reference">
          <RefTable
            headers={["Deposit", "Daily Reward", "Annual Yield"]}
            rows={[
              ["100 USDAX",   "0.0115 USDAX", "$4.20"],
              ["500 USDAX",   "0.0575 USDAX", "$21.00"],
              ["1,000 USDAX", "0.115 USDAX",  "$42.00"],
              ["5,000 USDAX", "0.575 USDAX",  "$210.00"],
            ]}
          />
        </HSection>

        <HSection title="Deposit Flow (On-Chain)">
          <div className="space-y-1.5 text-[12px]" style={{ color: "hsl(0 0% 60%)" }}>
            {[
              ["1", "Click 'Deposit USDAX' on the Savings Rate pool card"],
              ["2", "Enter amount (try 500)"],
              ["3", "Tx 1: Approve USDAX → USDAxSavings contract (sign in wallet)"],
              ["4", "Tx 2: deposit() on-chain → confirm in wallet"],
              ["5", "Wait ~15s → position appears under 'Your Positions'"],
              ["6", "Rewards accumulate automatically every block"],
            ].map(([n, s]) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="font-mono font-black text-[10px] w-4 flex-shrink-0 mt-0.5"
                  style={{ color: "hsl(152 70% 48%)" }}>{n}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </HSection>

        <HSection title="Claim &amp; Withdraw">
          <Formula>{`Claim   → claimRewards()  : harvests pending USDAX rewards
Withdraw → withdraw(amount) : returns deposited USDAX + rewards

Both are single on-chain transactions. No lock-up period.
Withdraw before repaying your vault if needed.`}</Formula>
        </HSection>

        <HSection title="Contract Addresses">
          <Formula>{`USDAX Token  : 0x89F2c042def8719930904A474FF999A0F8fddd64
USDAxSavings : 0x1Ce84b4Fb6E6b44C767d4575bE56890DbC8EFA00`}</Formula>
        </HSection>
      </HelpModal>

      {/* ── Deposit modal ── */}
      {depositPool && (
        <DepositModal
          pool={depositPool}
          onClose={() => { if (depositStep === "idle") setDepositPool(null); }}
          onConfirm={handleDepositConfirm}
          loading={depositStep !== "idle" || depositMutation.isPending}
        />
      )}
    </div>
  );
}
