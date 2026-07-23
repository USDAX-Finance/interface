import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetYieldStats, useListYieldPools, useListYieldPositions,
  useDepositYield, useWithdrawYield, useClaimYieldRewards,
  getGetYieldStatsQueryKey, getListYieldPositionsQueryKey,
} from "@workspace/api-client-react";
import type { YieldPool, YieldPosition } from "@workspace/api-zod";
import { Input } from "@/components/ui/input";
import {
  formatCurrency, formatNumber, formatCompact,
  formatCompactNum, formatShortDateUTC,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Sprout, TrendingUp, Layers, Zap, AlertTriangle,
  Coins, BarChart2, RefreshCw, Droplets,
  ArrowUpRight, ArrowDownLeft, X, Info,
} from "lucide-react";

/* ─── tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const VIOLET  = "hsl(262 83% 68%)";
const RED     = "hsl(0 84% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 8%)";

const WALLET = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

/* ─── Pool meta — icon + color per type ─── */
const POOL_META: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  "savings":     { color: EMERALD, icon: Coins,    label: "Savings"    },
  "stable-lp":  { color: LIME,    icon: Droplets,  label: "Stable LP"  },
  "volatile-lp":{ color: AMBER,   icon: BarChart2, label: "Volatile LP"},
  "vault":      { color: VIOLET,  icon: RefreshCw, label: "Auto-Vault" },
};

const RISK_COLOR: Record<string, string> = {
  low:    EMERALD,
  medium: AMBER,
  high:   RED,
};

/* ─── Shared atoms ─── */
function LBracket({ size = 8, color }: { size?: number; color: string }) {
  const s = { position: "absolute" as const, width: size, height: size };
  return (
    <>
      <span style={{ ...s, top: 0, left: 0, borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
      <span style={{ ...s, top: 0, right: 0, borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
      <span style={{ ...s, bottom: 0, left: 0, borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} />
      <span style={{ ...s, bottom: 0, right: 0, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
    </>
  );
}

function SectionHeader({ dot, children }: { dot?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot ?? LIME }} />
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
        {children}
      </span>
    </div>
  );
}

function TokenPills({ tokens, color }: { tokens: string[]; color: string }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tokens.map((t) => (
        <span key={t} className="text-[9px] font-black font-mono px-2 py-0.5 rounded-full tracking-wider"
          style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}>
          {t}
        </span>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-xl animate-pulse"
            style={{ background: `${LIME}10`, border: `1px solid ${LIME}25` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout className="w-5 h-5 animate-pulse" style={{ color: LIME }} />
          </div>
        </div>
        <p className="font-mono text-[10px] tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 28%)" }}>
          Loading yield pools…
        </p>
      </div>
    </div>
  );
}

/* ─── Stats strip ─── */
function StatCard({
  label, value, sub, color, icon: Icon,
}: { label: string; value: string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className="relative rounded-xl p-4 overflow-hidden"
      style={{ background: CARD, border: `1px solid ${color}15` }}>
      <div className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${color}45, transparent)` }} />
      <LBracket color={`${color}18`} />
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "hsl(0 0% 26%)" }}>{label}</span>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
      </div>
      <div className="font-black text-xl font-mono mb-0.5" style={{ color }}>{value}</div>
      <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>{sub}</div>
    </div>
  );
}

/* ─── Pool Card ─── */
function PoolCard({ pool, onDeposit }: { pool: YieldPool; onDeposit: (pool: YieldPool) => void }) {
  const meta  = POOL_META[pool.type] ?? POOL_META["savings"];
  const color = meta.color;
  const Icon  = meta.icon;
  const riskColor = RISK_COLOR[pool.riskLevel];

  // APY visual breakdown
  const basePct   = pool.apy > 0 ? (pool.baseApy / pool.apy) * 100 : 100;
  const rewardPct = 100 - basePct;

  return (
    <div className="relative rounded-xl overflow-hidden flex flex-col transition-all"
      style={{ background: CARD, border: `1px solid ${color}15` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}15`; }}>

      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}60, ${color}12)` }} />
      <LBracket color={`${color}20`} />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}12`, border: `1.5px solid ${color}25` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "hsl(0 0% 28%)" }}>
                {meta.label}
              </div>
              <div className="font-black text-[14px] leading-tight truncate" style={{ color: "hsl(0 0% 88%)" }}>
                {pool.name}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase"
              style={{ background: `${riskColor}12`, color: riskColor, border: `1px solid ${riskColor}22` }}>
              {pool.riskLevel} risk
            </span>
            {pool.feeTier && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "hsl(0 0% 9%)", color: "hsl(0 0% 34%)" }}>
                {pool.feeTier} fee
              </span>
            )}
          </div>
        </div>

        {/* Token pills + protocol */}
        <div className="flex items-center justify-between">
          <TokenPills tokens={pool.tokens} color={color} />
          <span className="font-mono text-[9px] truncate ml-2" style={{ color: "hsl(0 0% 26%)" }}>
            {pool.protocol}
          </span>
        </div>

        {/* APY */}
        <div className="rounded-xl p-3" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
          <div className="flex items-end justify-between mb-1.5">
            <span className="font-black text-[28px] font-mono leading-none" style={{ color }}>
              {formatNumber(pool.apy, 2)}%
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>
              APY
            </span>
          </div>
          {/* Stacked bar */}
          <div className="h-1 rounded-full overflow-hidden flex mb-1.5" style={{ background: "hsl(0 0% 10%)" }}>
            <div className="h-full" style={{ width: `${basePct}%`, background: color, opacity: 0.85 }} />
            {pool.rewardApy > 0 && (
              <div className="h-full" style={{ width: `${rewardPct}%`, background: LIME, opacity: 0.65 }} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="font-mono text-[9px]" style={{ color: "hsl(0 0% 32%)" }}>
                Base {formatNumber(pool.baseApy, 2)}%
              </span>
            </div>
            {pool.rewardApy > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
                <span className="font-mono text-[9px]" style={{ color: "hsl(0 0% 32%)" }}>
                  APX {formatNumber(pool.rewardApy, 2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TVL row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "hsl(0 0% 26%)" }}>TVL</span>
          <span className="font-black font-mono text-[13px]" style={{ color: "hsl(0 0% 65%)" }}>
            {formatCompact(pool.tvlUsd)}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onDeposit(pool)}
          className="mt-auto w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl
            font-black text-[12px] transition-all"
          style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = `${color}20`;
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}18`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = `${color}12`;
            (e.currentTarget as HTMLElement).style.boxShadow = "";
          }}>
          <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit USDAX
        </button>
      </div>
    </div>
  );
}

/* ─── Position Card ─── */
function PositionCard({
  pos, onClaim, onWithdraw, claiming, withdrawing,
}: {
  pos: YieldPosition;
  onClaim: (id: number) => void;
  onWithdraw: (pos: YieldPosition) => void;
  claiming: boolean;
  withdrawing: boolean;
}) {
  const meta       = POOL_META[pos.poolType] ?? POOL_META["savings"];
  const color      = meta.color;
  const Icon       = meta.icon;
  const hasFees    = pos.pendingFeesUsdax    > 0.001;
  const hasRewards = pos.pendingRewardsApx   > 0.001;
  const hasAny     = hasFees || hasRewards;
  const pnlPos     = pos.pnlPercent >= 0;

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD, border: `1px solid ${color}15` }}>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}55, transparent)` }} />
      <LBracket size={7} color={`${color}18`} />

      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}12`, border: `1.5px solid ${color}25` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full uppercase"
                style={{ background: `${EMERALD}10`, color: EMERALD, border: `1px solid ${EMERALD}22` }}>
                ACTIVE
              </span>
              <span className="font-mono text-[10px] font-bold" style={{ color: LIME }}>
                {formatNumber(pos.apy, 2)}% APY
              </span>
            </div>
            <div className="font-black text-[13px] leading-tight" style={{ color: "hsl(0 0% 86%)" }}>
              {pos.poolName}
            </div>
          </div>
        </div>
        {/* PnL badge */}
        <div className="text-right">
          <div className="font-black font-mono text-[14px]"
            style={{ color: pnlPos ? LIME : RED }}>
            {pnlPos ? "+" : ""}{formatCurrency(pos.pnlUsd)}
          </div>
          <div className="font-mono text-[10px]"
            style={{ color: pnlPos ? `${LIME}80` : `${RED}80` }}>
            {pnlPos ? "+" : ""}{formatNumber(pos.pnlPercent, 3)}%
          </div>
        </div>
      </div>

      {/* Deposited + Current */}
      <div className="grid grid-cols-2 gap-0 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="pr-3" style={{ borderRight: `1px solid ${BORDER}` }}>
          <div className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "hsl(0 0% 26%)" }}>
            Deposited
          </div>
          <div className="font-black font-mono text-[15px]" style={{ color: "hsl(0 0% 78%)" }}>
            {formatCompactNum(pos.depositedUsdax)}
            <span className="font-medium text-[10px] ml-1" style={{ color: "hsl(0 0% 34%)" }}>USDAX</span>
          </div>
          <div className="font-mono text-[9px] mt-0.5" style={{ color: "hsl(0 0% 26%)" }}>
            Since {formatShortDateUTC(pos.depositedAt)}
          </div>
        </div>
        <div className="pl-3">
          <div className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "hsl(0 0% 26%)" }}>
            Current Value
          </div>
          <div className="font-black font-mono text-[15px]" style={{ color: "hsl(0 0% 92%)" }}>
            {formatCurrency(pos.currentValueUsd)}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[9px]" style={{ color: "hsl(0 0% 26%)" }}>Accumulating</span>
          </div>
        </div>
      </div>

      {/* Pending rewards */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${LIME}10`, border: `1px solid ${LIME}18` }}>
            <Zap className="w-2.5 h-2.5" style={{ color: LIME }} />
          </div>
          <div>
            <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 26%)" }}>APX Rewards</div>
            <div className="font-black font-mono text-[12px]"
              style={{ color: hasRewards ? LIME : "hsl(0 0% 28%)" }}>
              +{formatNumber(pos.pendingRewardsApx, 4)} APX
            </div>
          </div>
        </div>
        {hasFees && (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
              <Droplets className="w-2.5 h-2.5" style={{ color }} />
            </div>
            <div>
              <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 26%)" }}>Fee Earnings</div>
              <div className="font-black font-mono text-[12px]" style={{ color }}>
                +{formatNumber(pos.pendingFeesUsdax, 4)} USDAX
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <button
          disabled={!hasAny || claiming}
          onClick={() => onClaim(pos.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            font-black text-[11px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: hasAny ? `${LIME}10` : "hsl(0 0% 6%)",
            color:      hasAny ? LIME          : "hsl(0 0% 24%)",
            border:     hasAny ? `1px solid ${LIME}25` : `1px solid ${BORDER}`,
          }}
          onMouseEnter={(e) => { if (hasAny && !claiming) (e.currentTarget as HTMLElement).style.background = `${LIME}18`; }}
          onMouseLeave={(e) => { if (hasAny) (e.currentTarget as HTMLElement).style.background = `${LIME}10`; }}>
          <Zap className="w-3 h-3" />
          {claiming ? "Claiming…" : "Claim"}
        </button>
        <button
          disabled={withdrawing}
          onClick={() => onWithdraw(pos)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            font-black text-[11px] transition-all disabled:opacity-30"
          style={{ background: `${RED}08`, color: RED, border: `1px solid ${RED}22` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${RED}14`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${RED}08`; }}>
          <ArrowUpRight className="w-3 h-3" />
          {withdrawing ? "Processing…" : "Withdraw"}
        </button>
      </div>
    </div>
  );
}

/* ─── Deposit Modal ─── */
function DepositModal({
  pool, onClose, onConfirm, loading,
}: {
  pool: YieldPool;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState("");
  const meta     = POOL_META[pool.type] ?? POOL_META["savings"];
  const color    = meta.color;
  const Icon     = meta.icon;
  const preview  = parseFloat(amount) || 0;
  const yearly   = preview * (pool.apy / 100);
  const monthly  = yearly / 12;
  const weekly   = yearly / 52;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl overflow-hidden"
        style={{ background: "hsl(0 0% 5%)", border: `1px solid ${color}28` }}>
        <LBracket color={`${color}28`} />
        <div className="h-0.5" style={{ background: `${color}70` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${color}12`, border: `1.5px solid ${color}28` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <div className="font-black text-[14px]" style={{ color: "hsl(0 0% 88%)" }}>Deposit USDAX</div>
              <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 30%)" }}>{pool.name}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "hsl(0 0% 36%)", background: "hsl(0 0% 8%)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 72%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 36%)"; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Pool stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "APY",  v: `${formatNumber(pool.apy, 2)}%`, c: color },
              { l: "TVL",  v: formatCompact(pool.tvlUsd),       c: "hsl(0 0% 55%)" },
              { l: "Risk", v: pool.riskLevel,                    c: RISK_COLOR[pool.riskLevel] },
            ].map((s) => (
              <div key={s.l} className="text-center rounded-xl p-2.5"
                style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
                <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5"
                  style={{ color: "hsl(0 0% 26%)" }}>{s.l}</div>
                <div className="font-black text-[13px] font-mono capitalize" style={{ color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Amount input */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-1.5"
              style={{ color: "hsl(0 0% 28%)" }}>
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
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "hsl(0 0% 88%)",
                  height: "50px",
                  paddingRight: "72px",
                  outline: "none",
                }}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-[11px]"
                style={{ color }}>USDAX</span>
            </div>
          </div>

          {/* Projection */}
          {preview > 0 && (
            <div className="rounded-xl p-3.5 space-y-2"
              style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
              <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "hsl(0 0% 26%)" }}>
                Projected Returns
              </div>
              {[
                { l: "Weekly",  v: formatCurrency(weekly)  },
                { l: "Monthly", v: formatCurrency(monthly) },
                { l: "Yearly",  v: formatCurrency(yearly)  },
              ].map((r) => (
                <div key={r.l} className="flex justify-between items-center">
                  <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 38%)" }}>{r.l}</span>
                  <span className="font-black font-mono text-[12px]" style={{ color }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm */}
          <button
            disabled={!preview || loading}
            onClick={() => onConfirm(preview)}
            className="w-full font-black py-3.5 rounded-xl text-[13px] transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: color, color: "hsl(0 0% 4%)" }}
            onMouseEnter={(e) => {
              if (!loading && preview) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${color}28`;
            }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            {loading ? "Confirming…" : `Deposit ${preview > 0 ? formatCompactNum(preview) + " USDAX" : ""}`}
          </button>

          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(0 0% 26%)" }} />
            <p className="font-mono text-[9px] leading-relaxed" style={{ color: "hsl(0 0% 26%)" }}>
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
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const { data: stats,     isLoading: statsLoading }     = useGetYieldStats();
  const { data: pools,     isLoading: poolsLoading }     = useListYieldPools();
  const { data: positions, isLoading: posLoading }       = useListYieldPositions();

  const [depositPool,  setDepositPool]  = useState<YieldPool | null>(null);
  const [claimingId,   setClaimingId]   = useState<number | null>(null);
  const [withdrawingId,setWithdrawingId]= useState<number | null>(null);

  const depositMutation = useDepositYield({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetYieldStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListYieldPositionsQueryKey() });
        toast({ title: "Deposited successfully" });
        setDepositPool(null);
      },
    },
  });

  const claimMutation = useClaimYieldRewards({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListYieldPositionsQueryKey() });
        toast({ title: "Rewards claimed successfully" });
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
        toast({ title: "Withdrawal submitted" });
        setWithdrawingId(null);
      },
      onError: () => setWithdrawingId(null),
    },
  });

  if (statsLoading || poolsLoading || posLoading) return <LoadingState />;
  if (!stats || !pools) return null;

  const totalEarned = positions?.reduce((s, p) => s + p.pnlUsd, 0) ?? 0;

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
              USDEX Finance · Yield Engine
            </span>
          </div>
          <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight">
            USDAX <span style={{ color: LIME }}>Harvest</span>
          </h1>
          <p className="text-sm mt-1 max-w-lg" style={{ color: "hsl(0 0% 38%)" }}>
            Deploy idle USDAX into curated yield pools — earn trading fees, APX token rewards, and auto-compounded returns across Robinhood Chain.
          </p>
        </div>
        {totalEarned > 0 && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 flex-shrink-0"
            style={{ background: `${LIME}07`, border: `1px solid ${LIME}20` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 40%)" }}>Total earned</span>
            <span className="font-black font-mono text-sm" style={{ color: LIME }}>
              +{formatCurrency(totalEarned)}
            </span>
          </div>
        )}
      </div>

      {/* ── What is Harvest? ── */}
      <div className="relative rounded-xl overflow-hidden px-5 py-4"
        style={{ background: CARD, border: `1px solid ${LIME}12` }}>
        <LBracket color={`${LIME}18`} />
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${LIME}10`, border: `1px solid ${LIME}22` }}>
            <Info className="w-4 h-4" style={{ color: LIME }} />
          </div>
          <div>
            <div className="font-black text-[13px] mb-1" style={{ color: "hsl(0 0% 84%)" }}>
              What is USDAX Harvest?
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>
              Harvest lets you deploy USDAX into yield-generating strategies: stable LP pools (Curve, Uniswap),
              the USDAX native savings rate, or an auto-compounding vault. Each pool shows a real-time APY split
              between base fees and APX governance token incentives. Deposit at any time, withdraw whenever you want — no lock-ups.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Pool TVL"    value={formatCompact(stats.totalTvlUsd)}            sub={`${stats.activePools} active pools`}                                   color={LIME}    icon={Layers}    />
        <StatCard label="Best APY"          value={`${formatNumber(stats.bestApy, 2)}%`}        sub="Highest across all pools"                                              color={EMERALD} icon={TrendingUp}/>
        <StatCard label="Your Deposited"    value={formatCompact(stats.userTotalDepositedUsd)}  sub={`${stats.userPositions} position${stats.userPositions !== 1 ? "s" : ""}`} color={LIME} icon={Sprout}    />
        <StatCard label="Your Yield Earned" value={formatCurrency(stats.userTotalEarnedUsd)}    sub="All time, all pools"                                                    color={EMERALD} icon={Zap}       />
      </div>

      {/* ── Pool grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Available Pools</SectionHeader>
          <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 26%)" }}>
            {pools.length} pools · Robinhood Chain EVM 46630
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} onDeposit={setDepositPool} />
          ))}
        </div>
      </div>

      {/* ── Positions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: "hsl(0 0% 30%)" }}>
              Your Positions
            </span>
          </div>
          {positions && positions.length > 0 && (
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full"
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
                onClaim={(id) => { setClaimingId(id); claimMutation.mutate({ id }); }}
                onWithdraw={(p) => { setWithdrawingId(p.id); withdrawMutation.mutate({ id: p.id, amount: p.depositedUsdax }); }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
            style={{ background: CARD, border: `1px dashed ${BORDER}` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${LIME}07`, border: `1px dashed ${LIME}18` }}>
              <Sprout className="w-5 h-5" style={{ color: "hsl(0 0% 24%)" }} />
            </div>
            <div className="text-center">
              <div className="font-black text-sm mb-1" style={{ color: "hsl(0 0% 38%)" }}>
                No yield positions yet
              </div>
              <div className="font-mono text-[11px]" style={{ color: "hsl(0 0% 24%)" }}>
                Select a pool above and deposit USDAX to start earning
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Deposit modal ── */}
      {depositPool && (
        <DepositModal
          pool={depositPool}
          onClose={() => setDepositPool(null)}
          onConfirm={(amount) =>
            depositMutation.mutate({ poolId: depositPool.id, amount, owner: WALLET })
          }
          loading={depositMutation.isPending}
        />
      )}
    </div>
  );
}
