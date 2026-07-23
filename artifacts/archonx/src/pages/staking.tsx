import { useState } from "react";
import {
  useGetStakingStats, useListStakingPositions,
  useStakeAkx, useUnstakeAkx, useClaimRewards,
  getGetStakingStatsQueryKey, getListStakingPositionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Coins, Zap, Clock, ArrowDownRight, ChevronRight, AlertTriangle } from "lucide-react";

/* ─── tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG2= "hsl(0 0% 8%)";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

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
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-xl animate-pulse"
            style={{ background: `${LIME}12`, border: `1px solid ${LIME}28` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Coins className="w-5 h-5 animate-pulse" style={{ color: LIME }} />
          </div>
        </div>
        <div className="font-mono text-[10px] tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 32%)" }}>
          Loading staking module...
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, Icon, color }: {
  label: string; value: string; sub: string;
  Icon: React.ElementType; color: string;
}) {
  return (
    <div className="relative rounded-xl p-5 overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <LBracket color={`${color}20`} />
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="font-black text-2xl font-mono mb-1 truncate" style={{ color }}>{value}</div>
      <div className="text-[11px] font-mono truncate" style={{ color: "hsl(0 0% 30%)" }}>{sub}</div>
    </div>
  );
}

/* ─── Action Panel (tab: stake / unstake) ─── */
function ActionPanel({
  onStake, onUnstake, stakeLoading, unstakeLoading,
}: {
  onStake: (amt: number) => void;
  onUnstake: (amt: number) => void;
  stakeLoading: boolean;
  unstakeLoading: boolean;
}) {
  const [tab, setTab]     = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n) return;
    if (tab === "stake") onStake(n);
    else onUnstake(n);
    setAmount("");
  };

  const isStake = tab === "stake";
  const accent  = isStake ? LIME : AMBER;

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${accent}22` }}>
      {/* Accent top bar */}
      <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `${accent}50` }} />
      <LBracket color={`${accent}25`} />

      {/* Tab switcher */}
      <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {(["stake", "unstake"] as const).map((t) => {
          const a = t === "stake" ? LIME : AMBER;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setAmount(""); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all"
              style={{
                color: active ? a : "hsl(0 0% 28%)",
                background: active ? `${a}08` : "transparent",
                borderBottom: active ? `2px solid ${a}` : "2px solid transparent",
              }}
            >
              {t === "stake" ? <Zap className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {t === "stake" ? "Stake" : "Unstake"}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {/* Description */}
        <p className="text-[11px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 35%)" }}>
          {isStake
            ? "Deposit APX to earn USDAX rewards. No minimum, no lock period. Rewards accrue in real-time."
            : "Initiates a 7-day cooldown before APX is returned to your wallet. This action cannot be cancelled."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Amount input */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: "hsl(0 0% 30%)" }}>
              Amount
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="pr-12"
                style={{
                  background: CARD_BG2,
                  border: `1px solid ${amount ? accent + "40" : BORDER}`,
                  borderRadius: "10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "hsl(0 0% 86%)",
                  height: "44px",
                  transition: "border-color .15s",
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[11px]"
                style={{ color: accent }}>
                APX
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isStake ? stakeLoading : unstakeLoading}
            className="w-full font-black py-3 rounded-xl text-[13px] tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              isStake
                ? { background: LIME, color: "hsl(0 0% 4%)" }
                : { background: `${AMBER}14`, color: AMBER, border: `1px solid ${AMBER}35` }
            }
            onMouseEnter={(e) => {
              if (isStake) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${LIME}28`;
            }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            {isStake
              ? (stakeLoading   ? "Broadcasting..." : "Stake APX")
              : (unstakeLoading ? "Processing..."   : "Begin Unstake")}
          </button>
        </form>

        {/* Unstake warning */}
        {!isStake && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg"
            style={{ background: `${AMBER}08`, border: `1px solid ${AMBER}20` }}>
            <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: AMBER }} />
            <p className="text-[10px] font-mono leading-relaxed" style={{ color: AMBER }}>
              7-day cooldown required before funds are released. Cannot be cancelled once initiated.
            </p>
          </div>
        )}

        {/* Protocol info strip */}
        <div className="grid grid-cols-2 gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          {[
            { l: "Lock Period",     v: isStake ? "None"  : "7 days"  },
            { l: "Reward Token",    v: "USDAX"                        },
            { l: "Min. Stake",      v: "Any amount"                   },
            { l: "Fee",             v: "0%"                           },
          ].map((r) => (
            <div key={r.l}>
              <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5" style={{ color: "hsl(0 0% 24%)" }}>{r.l}</div>
              <div className="font-bold text-[11px] font-mono" style={{ color: "hsl(0 0% 62%)" }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Position Card ─── */
function PositionCard({
  pos, onClaim, claimLoading,
}: {
  pos: any;
  onClaim: (id: number) => void;
  claimLoading: boolean;
}) {
  const inCooldown  = !!pos.cooldownEndsAt;
  const accent      = inCooldown ? AMBER : LIME;
  const statusColor = inCooldown ? AMBER : EMERALD;
  const hasRewards  = pos.pendingRewards > 0;

  return (
    <div className="relative rounded-xl overflow-hidden transition-all"
      style={{ background: CARD_BG2, border: `1px solid ${accent}18` }}>
      <LBracket size={7} color={`${accent}22`} />

      {/* Top row: status + APY | rewards */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: `${statusColor}12`, color: statusColor, border: `1px solid ${statusColor}25` }}>
            {pos.status}
          </span>
          {!inCooldown && (
            <span className="font-mono font-black text-[11px]" style={{ color: LIME }}>
              {formatPercentage(pos.apy)} APY
            </span>
          )}
          {inCooldown && (
            <div className="flex items-center gap-1 font-mono text-[11px]" style={{ color: AMBER }}>
              <Clock className="w-3 h-3" />
              Cooldown active
            </div>
          )}
        </div>
        {/* Pending rewards */}
        <div className="text-right">
          <div className="font-black font-mono text-[13px]" style={{ color: hasRewards ? LIME : "hsl(0 0% 30%)" }}>
            +{formatNumber(pos.pendingRewards, 4)}
          </div>
          <div className="font-mono text-[9px] tracking-wider" style={{ color: "hsl(0 0% 26%)" }}>USDAX pending</div>
        </div>
      </div>

      {/* Middle row: staked amount + meta */}
      <div className="px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-black text-[22px] font-mono leading-none" style={{ color: "hsl(0 0% 92%)" }}>
            {formatNumber(pos.stakedAmount, 0)}
          </span>
          <span className="font-bold text-sm" style={{ color: "hsl(0 0% 32%)" }}>APX</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 26%)" }}>
            Position #{pos.id}
          </span>
          <span className="w-0.5 h-0.5 rounded-full" style={{ background: "hsl(0 0% 22%)" }} />
          <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 26%)" }}>
            Since {new Date(pos.stakedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Footer: accumulation note + claim */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2"
        style={{ borderTop: `1px solid ${BORDER}` }}>
        <span className="text-[10px] font-mono" style={{ color: "hsl(0 0% 24%)" }}>
          {inCooldown ? "Rewards paused during cooldown" : "Accumulating in real-time"}
        </span>
        <button
          disabled={!hasRewards || claimLoading}
          onClick={() => onClaim(pos.id)}
          className="flex items-center gap-1 font-black text-[11px] px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: hasRewards ? `${LIME}12` : "hsl(0 0% 7%)",
            color:      hasRewards ? LIME         : "hsl(0 0% 25%)",
            border:     hasRewards ? `1px solid ${LIME}28` : `1px solid ${BORDER}`,
          }}
          onMouseEnter={(e) => { if (hasRewards) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${LIME}20`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
        >
          {claimLoading ? "Claiming..." : "Claim Rewards"}
          {hasRewards && <ChevronRight className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

/* ─── ROOT ─── */
export default function Staking() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const { data: stats,     isLoading: statsLoading } = useGetStakingStats();
  const { data: positions, isLoading: posLoading }   = useListStakingPositions();

  const stakeMutation = useStakeAkx({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStakingPositionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() });
        toast({ title: "Staked successfully" });
      },
    },
  });

  const unstakeMutation = useUnstakeAkx({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStakingPositionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() });
        toast({ title: "Unstaking started · 7-day cooldown" });
      },
    },
  });

  const claimMutation = useClaimRewards({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStakingPositionsQueryKey() });
        toast({ title: "Rewards claimed" });
      },
    },
  });

  if (statsLoading || posLoading) return <LoadingPulse />;
  if (!stats) return null;

  const totalPending = positions?.reduce((s, p) => s + p.pendingRewards, 0) ?? 0;

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDEX Finance · APX Staking Module
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
            APX <span style={{ color: LIME }}>Staking</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>
            Stake APX · Earn USDAX · Secure the protocol
          </p>
        </div>
        {/* Total pending reward pill */}
        {totalPending > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
            style={{ background: `${LIME}08`, border: `1px solid ${LIME}22` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 50%)" }}>Total pending:</span>
            <span className="font-black font-mono text-sm" style={{ color: LIME }}>
              +{formatNumber(totalPending, 4)} USDAX
            </span>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Staked"
          value={`${formatNumber(stats.totalStaked, 0)} APX`}
          sub={formatCurrency(stats.totalStakedUsd)}
          Icon={Coins}
          color={LIME}
        />
        <StatCard
          label="Base APY"
          value={formatPercentage(stats.baseApy)}
          sub={`Effective: ${formatPercentage(stats.effectiveApy)}`}
          Icon={TrendingUp}
          color={EMERALD}
        />
        <StatCard
          label="Rewards Distributed"
          value={`${formatNumber(stats.totalRewardsDistributed, 0)} APX`}
          sub={`${formatNumber(stats.rewardRatePerDay, 2)} APX / day`}
          Icon={Zap}
          color={LIME}
        />
        <StatCard
          label="Active Stakers"
          value={String(stats.activeStakers)}
          sub="Protocol participants"
          Icon={Users}
          color={EMERALD}
        />
      </div>

      {/* ── Body: action + positions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Action panel */}
        <div className="lg:col-span-1">
          <ActionPanel
            onStake={(amt) => stakeMutation.mutate({ data: { owner: WALLET_ADDRESS, amount: amt } })}
            onUnstake={(amt) => unstakeMutation.mutate({ id: 0, data: { amount: amt } })}
            stakeLoading={stakeMutation.isPending}
            unstakeLoading={unstakeMutation.isPending}
          />
        </div>

        {/* Positions panel */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 30%)" }}>
                Your Staking Positions
              </span>
            </div>
            {positions && positions.length > 0 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${LIME}10`, color: `${LIME}cc`, border: `1px solid ${LIME}20` }}>
                {positions.length} active
              </span>
            )}
          </div>

          {/* Positions list */}
          <div className="p-4 space-y-3">
            {positions && positions.length > 0 ? (
              positions.map((pos) => (
                <PositionCard
                  key={pos.id}
                  pos={pos}
                  onClaim={(id) => claimMutation.mutate({ id })}
                  claimLoading={claimMutation.isPending}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}>
                  <Coins className="w-4 h-4" style={{ color: "hsl(0 0% 25%)" }} />
                </div>
                <p className="font-mono text-[11px]" style={{ color: "hsl(0 0% 28%)" }}>
                  No active staking positions
                </p>
                <p className="font-mono text-[10px]" style={{ color: "hsl(0 0% 20%)" }}>
                  Stake APX to start earning USDAX rewards
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
