import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetYieldStats, useListYieldPools, useListYieldPositions,
  useDepositYield, useWithdrawYield, useClaimYieldRewards,
  getGetYieldStatsQueryKey, getListYieldPositionsQueryKey,
} from "@workspace/api-client-react";
import type { YieldPool, YieldPosition } from "@workspace/api-zod";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatShortDateUTC } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Sprout, TrendingUp, Layers, Zap, ChevronRight,
  ArrowDownRight, AlertTriangle, RefreshCw, Coins,
  BarChart2, Droplets,
} from "lucide-react";

/* ─── tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const VIOLET  = "hsl(262 83% 68%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG2= "hsl(0 0% 8%)";

const WALLET = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

/* ─── Pool type config ─── */
const POOL_META: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  "savings":     { color: EMERALD, icon: Coins,     label: "Savings"     },
  "stable-lp":  { color: LIME,    icon: Droplets,   label: "Stable LP"   },
  "volatile-lp":{ color: AMBER,   icon: BarChart2,  label: "Volatile LP" },
  "vault":      { color: VIOLET,  icon: RefreshCw,  label: "Auto-Vault"  },
};

const RISK_COLOR: Record<string, string> = {
  low:    EMERALD,
  medium: AMBER,
  high:   "hsl(0 84% 60%)",
};

/* ─── atoms ─── */
function LBracket({ size = 10, color = `${LIME}25` }: { size?: number; color?: string }) {
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

function LoadingPulse() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: `${LIME}12`, border: `1px solid ${LIME}28` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout className="w-5 h-5 animate-pulse" style={{ color: LIME }} />
          </div>
        </div>
        <div className="font-mono text-[10px] tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 32%)" }}>
          Loading yield pools...
        </div>
      </div>
    </div>
  );
}

/* ─── Token pills ─── */
function TokenBadges({ tokens, color }: { tokens: string[]; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {tokens.map((t) => (
        <span key={t}
          className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full tracking-wider"
          style={{ background: `${color}14`, color, border: `1px solid ${color}25` }}>
          {t}
        </span>
      ))}
    </div>
  );
}

/* ─── APY breakdown bar ─── */
function ApyBar({ pool, color }: { pool: YieldPool; color: string }) {
  const total = pool.apy;
  const basePct   = total > 0 ? (pool.baseApy / total) * 100 : 100;
  const rewardPct = 100 - basePct;
  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <span className="font-black text-[26px] font-mono leading-none" style={{ color }}>
          {formatNumber(pool.apy, 2)}%
        </span>
        <span className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>APY</span>
      </div>
      {/* Stacked bar */}
      <div className="h-1.5 rounded-full overflow-hidden flex mb-2" style={{ background: "hsl(0 0% 10%)" }}>
        <div className="h-full rounded-l-full" style={{ width: `${basePct}%`, background: color, opacity: 0.9 }} />
        {pool.rewardApy > 0 && (
          <div className="h-full rounded-r-full" style={{ width: `${rewardPct}%`, background: LIME, opacity: 0.7 }} />
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span className="font-mono text-[9px]" style={{ color: "hsl(0 0% 35%)" }}>
            Base {formatNumber(pool.baseApy, 2)}%
          </span>
        </div>
        {pool.rewardApy > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
            <span className="font-mono text-[9px]" style={{ color: "hsl(0 0% 35%)" }}>
              APX {formatNumber(pool.rewardApy, 2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Pool Card ─── */
function PoolCard({ pool, onDeposit }: { pool: YieldPool; onDeposit: (pool: YieldPool) => void }) {
  const meta  = POOL_META[pool.type] ?? POOL_META["savings"];
  const color = meta.color;
  const Icon  = meta.icon;
  const riskColor = RISK_COLOR[pool.riskLevel];
  const MAX_TVL = 5_000_000;
  const tvlPct  = Math.min((pool.tvlUsd / MAX_TVL) * 100, 100);

  return (
    <div className="relative rounded-xl overflow-hidden flex flex-col transition-all group"
      style={{ background: CARD_BG, border: `1px solid ${color}18` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}18`; }}>

      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}60, ${color}18)` }} />
      <LBracket color={`${color}25`} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}14`, border: `1px solid ${color}22` }}>
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>
                {meta.label}
              </span>
            </div>
            <div className="font-black text-[15px] leading-tight" style={{ color: "hsl(0 0% 88%)" }}>
              {pool.name}
            </div>
            <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>{pool.protocol}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: `${riskColor}12`, color: riskColor, border: `1px solid ${riskColor}25` }}>
              {pool.riskLevel} risk
            </span>
            {pool.feeTier && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 35%)" }}>
                {pool.feeTier} fee
              </span>
            )}
          </div>
        </div>

        {/* Token pills */}
        <TokenBadges tokens={pool.tokens} color={color} />

        {/* APY */}
        <ApyBar pool={pool} color={color} />

        {/* TVL */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "hsl(0 0% 26%)" }}>TVL</span>
            <span className="font-mono font-bold text-[11px]" style={{ color: "hsl(0 0% 55%)" }}>
              {formatCurrency(pool.tvlUsd)}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
            <div className="h-full rounded-full" style={{ width: `${tvlPct}%`, background: `${color}55` }} />
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] leading-relaxed" style={{ color: "hsl(0 0% 32%)" }}>
          {pool.description}
        </p>

        {/* CTA */}
        <button
          onClick={() => onDeposit(pool)}
          className="mt-auto w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[12px] transition-all"
          style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}22`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${color}20`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}14`; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
          <Sprout className="w-3.5 h-3.5" /> Deposit USDAX
        </button>
      </div>
    </div>
  );
}

/* ─── Position Card ─── */
function PositionCard({ pos, onClaim, onWithdraw, loading }: {
  pos: YieldPosition;
  onClaim: (id: number) => void;
  onWithdraw: (pos: YieldPosition) => void;
  loading: boolean;
}) {
  const meta      = POOL_META[pos.poolType] ?? POOL_META["savings"];
  const color     = meta.color;
  const hasFees   = pos.pendingFeesUsdax > 0.001;
  const hasRewards= pos.pendingRewardsApx > 0.001;
  const pnlPos    = pos.pnlPercent >= 0;

  return (
    <div className="relative rounded-xl overflow-hidden transition-all"
      style={{ background: CARD_BG2, border: `1px solid ${color}18` }}>
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}55, transparent)` }} />
      <LBracket size={7} color={`${color}22`} />

      {/* Top row: pool + apy | pnl */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: `${EMERALD}12`, color: EMERALD, border: `1px solid ${EMERALD}25` }}>
              ACTIVE
            </span>
            <span className="font-mono text-[10px] font-bold" style={{ color: LIME }}>
              {formatNumber(pos.apy, 2)}% APY
            </span>
          </div>
          <div className="font-black text-[14px]" style={{ color: "hsl(0 0% 86%)" }}>{pos.poolName}</div>
          <TokenBadges tokens={pos.tokens} color={color} />
        </div>
        <div className="text-right">
          <div className={`font-black font-mono text-[15px] ${pnlPos ? "" : ""}`}
            style={{ color: pnlPos ? LIME : "hsl(0 84% 60%)" }}>
            {pnlPos ? "+" : ""}{formatNumber(pos.pnlUsd, 2)} USD
          </div>
          <div className="font-mono text-[10px]" style={{ color: pnlPos ? `${LIME}90` : "hsl(0 84% 60% / 0.7)" }}>
            {pnlPos ? "+" : ""}{formatNumber(pos.pnlPercent, 3)}% return
          </div>
        </div>
      </div>

      {/* Middle: deposited + current */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5" style={{ color: "hsl(0 0% 26%)" }}>Deposited</div>
          <div className="font-black font-mono text-[15px]" style={{ color: "hsl(0 0% 78%)" }}>
            {formatNumber(pos.depositedUsdax, 0)}
            <span className="font-medium text-[11px] ml-1" style={{ color: "hsl(0 0% 35%)" }}>USDAX</span>
          </div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color: "hsl(0 0% 26%)" }}>
            Since {formatShortDateUTC(pos.depositedAt)}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5" style={{ color: "hsl(0 0% 26%)" }}>Current Value</div>
          <div className="font-black font-mono text-[15px]" style={{ color: "hsl(0 0% 92%)" }}>
            {formatCurrency(pos.currentValueUsd)}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>Accumulating</span>
          </div>
        </div>
      </div>

      {/* Pending rewards row */}
      <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${LIME}12`, border: `1px solid ${LIME}20` }}>
            <Zap className="w-2.5 h-2.5" style={{ color: LIME }} />
          </div>
          <div>
            <div className="font-mono text-[9px]" style={{ color: "hsl(0 0% 26%)" }}>APX Rewards</div>
            <div className="font-black font-mono text-[12px]" style={{ color: hasRewards ? LIME : "hsl(0 0% 30%)" }}>
              +{formatNumber(pos.pendingRewardsApx, 4)} APX
            </div>
          </div>
        </div>
        {hasFees && (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
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

      {/* Footer: claim + withdraw */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          disabled={(!hasFees && !hasRewards) || loading}
          onClick={() => onClaim(pos.id)}
          className="flex items-center gap-1 font-black text-[11px] px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: (hasFees || hasRewards) ? `${LIME}12` : "hsl(0 0% 7%)",
            color:      (hasFees || hasRewards) ? LIME          : "hsl(0 0% 25%)",
            border:     (hasFees || hasRewards) ? `1px solid ${LIME}28` : `1px solid ${BORDER}`,
          }}
          onMouseEnter={(e) => { if (hasFees || hasRewards) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${LIME}18`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
          {loading ? "Processing..." : "Claim Rewards"}
          {(hasFees || hasRewards) && <ChevronRight className="w-3 h-3" />}
        </button>
        <button
          onClick={() => onWithdraw(pos)}
          className="flex items-center gap-1 font-black text-[11px] px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: `hsl(0 84% 60% / 0.07)`,
            color: "hsl(0 84% 60%)",
            border: `1px solid hsl(0 84% 60% / 0.22)`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `hsl(0 84% 60% / 0.14)`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `hsl(0 84% 60% / 0.07)`; }}>
          <ArrowDownRight className="w-3 h-3" /> Withdraw
        </button>
      </div>
    </div>
  );
}

/* ─── Deposit Modal ─── */
function DepositModal({ pool, onClose, onConfirm, loading }: {
  pool: YieldPool;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState("");
  const meta  = POOL_META[pool.type] ?? POOL_META["savings"];
  const color = meta.color;
  const Icon  = meta.icon;
  const preview = Number(amount);
  const projectedYearly = preview * (pool.apy / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[400px] rounded-2xl overflow-hidden"
        style={{ background: "hsl(0 0% 5%)", border: `1px solid ${color}30` }}>
        <LBracket color={`${color}30`} />
        {/* Top bar */}
        <div className="h-0.5" style={{ background: `${color}60` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <div className="font-black text-[13px]" style={{ color: "hsl(0 0% 88%)" }}>Deposit USDAX</div>
              <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 30%)" }}>{pool.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
            style={{ color: "hsl(0 0% 40%)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 40%)"; }}>
            ✕
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Pool summary */}
          <div className="grid grid-cols-3 gap-2 rounded-xl p-3"
            style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}>
            {[
              { l: "APY",         v: `${formatNumber(pool.apy, 2)}%`,   c: color   },
              { l: "TVL",         v: formatCurrency(pool.tvlUsd),        c: "hsl(0 0% 55%)" },
              { l: "Risk",        v: pool.riskLevel,                      c: RISK_COLOR[pool.riskLevel] },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5" style={{ color: "hsl(0 0% 26%)" }}>{s.l}</div>
                <div className="font-black text-[12px] font-mono capitalize" style={{ color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Amount input */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: "hsl(0 0% 28%)" }}>
              Amount (USDAX)
            </label>
            <div className="relative">
              <Input
                type="number" min="0" step="any" placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
                style={{
                  background: CARD_BG2,
                  border: `1px solid ${amount ? color + "40" : BORDER}`,
                  borderRadius: "10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "hsl(0 0% 86%)",
                  height: "46px",
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[11px]"
                style={{ color }}>USDAX</span>
            </div>
          </div>

          {/* Projection */}
          {preview > 0 && (
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: `${color}07`, border: `1px solid ${color}20` }}>
              <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>
                Projected Returns
              </div>
              {[
                { l: "30 days",  v: formatCurrency((projectedYearly / 12)) },
                { l: "1 year",   v: formatCurrency(projectedYearly) },
              ].map((r) => (
                <div key={r.l} className="flex justify-between items-center">
                  <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 40%)" }}>{r.l}</span>
                  <span className="font-black font-mono text-[12px]" style={{ color }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm button */}
          <button
            disabled={!preview || loading}
            onClick={() => onConfirm(preview)}
            className="w-full font-black py-3 rounded-xl text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: color, color: "hsl(0 0% 4%)" }}
            onMouseEnter={(e) => { if (!loading && preview) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${color}30`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
            {loading ? "Confirming..." : "Confirm Deposit"}
          </button>

          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(0 0% 28%)" }} />
            <p className="font-mono text-[9px] leading-relaxed" style={{ color: "hsl(0 0% 28%)" }}>
              Yield is variable and may change. Past APY does not guarantee future returns. Review protocol risks before depositing.
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
  const { data: positions, isLoading: positionsLoading } = useListYieldPositions();

  const [depositPool, setDepositPool] = useState<YieldPool | null>(null);

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
        toast({ title: "Rewards claimed" });
      },
    },
  });

  const withdrawMutation = useWithdrawYield({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetYieldStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListYieldPositionsQueryKey() });
        toast({ title: "Withdrawal submitted" });
      },
    },
  });

  if (statsLoading || poolsLoading || positionsLoading) return <LoadingPulse />;
  if (!stats || !pools) return null;

  const totalUserEarned = positions?.reduce((s, p) => s + p.pnlUsd, 0) ?? 0;

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDEX Finance · Yield Engine
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
            USDAX <span style={{ color: LIME }}>Harvest</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>
            Deposit USDAX into yield pools · Earn fees, APX rewards & auto-compounded returns
          </p>
        </div>
        {totalUserEarned > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: `${LIME}08`, border: `1px solid ${LIME}22` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 50%)" }}>Total earned:</span>
            <span className="font-black font-mono text-sm" style={{ color: LIME }}>
              +{formatCurrency(totalUserEarned)}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Pool TVL",     value: formatCurrency(stats.totalTvlUsd),           sub: `${stats.activePools} active pools`,                           color: LIME,    icon: Layers    },
          { label: "Best APY",           value: `${formatNumber(stats.bestApy, 2)}%`,        sub: "Across all pools",                                            color: EMERALD, icon: TrendingUp },
          { label: "Your Deposited",     value: formatCurrency(stats.userTotalDepositedUsd), sub: `${stats.userPositions} position${stats.userPositions !== 1 ? "s" : ""}`, color: LIME, icon: Sprout },
          { label: "Your Yield Earned",  value: formatCurrency(stats.userTotalEarnedUsd),    sub: "All time, all pools",                                          color: EMERALD, icon: Zap       },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative rounded-xl p-5 overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <LBracket color={`${s.color}20`} />
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>{s.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <div className="font-black text-2xl font-mono mb-1 truncate" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] font-mono truncate" style={{ color: "hsl(0 0% 30%)" }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Pool grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME }} />
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 30%)" }}>
            Available Pools
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 30%)" }}>
              Your Positions
            </span>
          </div>
          {positions && positions.length > 0 && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `${LIME}10`, color: `${LIME}cc`, border: `1px solid ${LIME}20` }}>
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
                onClaim={(id) => claimMutation.mutate({ id })}
                onWithdraw={(p) => withdrawMutation.mutate({ id: p.id, amount: p.depositedUsdax })}
                loading={claimMutation.isPending || withdrawMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
            style={{ background: CARD_BG, border: `1px dashed ${BORDER}` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}>
              <Sprout className="w-5 h-5" style={{ color: "hsl(0 0% 25%)" }} />
            </div>
            <div className="text-center">
              <div className="font-black text-sm mb-1" style={{ color: "hsl(0 0% 40%)" }}>No yield positions yet</div>
              <div className="font-mono text-[11px]" style={{ color: "hsl(0 0% 26%)" }}>
                Choose a pool above and deposit USDAX to start earning
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
