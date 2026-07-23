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
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, Users, Coins, Zap, Clock, ArrowDownRight } from "lucide-react";

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG2= "hsl(0 0% 8%)";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

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
          <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: `${LIME}12`, border: `1px solid ${LIME}28` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Coins className="w-5 h-5 animate-pulse" style={{ color: LIME }} />
          </div>
        </div>
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 32%)" }}>
          Loading staking module...
        </div>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {children}
    </div>
  );
}

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
        setStakeAmount("");
      },
    },
  });

  const unstakeMutation = useUnstakeAkx({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStakingPositionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() });
        toast({ title: "Unstaking started · 7-day cooldown" });
        setUnstakeAmount("");
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

  const [stakeAmount,   setStakeAmount]   = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const handleStake   = (e: React.FormEvent) => { e.preventDefault(); stakeMutation.mutate({ data: { owner: WALLET_ADDRESS, amount: Number(stakeAmount) } }); };
  const handleUnstake = (e: React.FormEvent) => { e.preventDefault(); unstakeMutation.mutate({ id: 0, data: { amount: Number(unstakeAmount) } }); };

  if (statsLoading || posLoading) return <LoadingPulse />;
  if (!stats) return null;

  const statCards = [
    { label: "Total Staked",   value: formatNumber(stats.totalStaked),              sub: formatCurrency(stats.totalStakedUsd),                           icon: Coins,      color: LIME    },
    { label: "Base APY",       value: formatPercentage(stats.baseApy),              sub: `Effective: ${formatPercentage(stats.effectiveApy)}`,            icon: TrendingUp, color: EMERALD },
    { label: "Distributed",    value: `${formatNumber(stats.totalRewardsDistributed, 0)} APX`, sub: `${formatNumber(stats.rewardRatePerDay, 2)} APX / day`, icon: Zap,        color: LIME    },
    { label: "Active Stakers", value: String(stats.activeStakers),                  sub: "Protocol participants",                                         icon: Users,      color: EMERALD },
  ];

  const inputStyle = {
    background: "hsl(0 0% 7%)",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    fontFamily: "var(--font-mono)",
    color: "hsl(0 0% 82%)",
  };

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Header */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
          ◈ USDEX Finance · Staking Module
        </div>
        <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
          APX <span style={{ color: LIME }}>Staking</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>Secure the protocol & earn real yield</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative rounded-xl p-5 overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <LBracket color={`${s.color}20`} />
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 30%)" }}>
                  {s.label}
                </span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <div className="font-black text-2xl font-mono mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-mono" style={{ color: "hsl(0 0% 30%)" }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Action panels */}
        <div className="space-y-4">

          {/* Stake */}
          <Panel className="p-5">
            <LBracket color={`${LIME}22`} />
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: LIME }} />
              <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: "hsl(0 0% 88%)" }}>Stake APX</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 35%)" }}>
              Stake to earn USDAX rewards. No minimum, no lock period.
            </p>
            <form onSubmit={handleStake} className="space-y-3">
              <div className="relative">
                <Input
                  type="number" placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  required style={{ ...inputStyle, paddingRight: "48px" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono" style={{ color: "hsl(0 0% 35%)" }}>
                  APX
                </span>
              </div>
              <button
                type="submit"
                disabled={stakeMutation.isPending}
                className="w-full font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-40"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${LIME}30`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
              >
                {stakeMutation.isPending ? "Staking..." : "Stake APX"}
              </button>
            </form>
          </Panel>

          {/* Unstake */}
          <div className="relative rounded-xl p-5 overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${AMBER}22` }}>
            <LBracket color={`${AMBER}30`} />
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4" style={{ color: AMBER }} />
              <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: AMBER }}>Unstake APX</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 35%)" }}>
              Initiates the 7-day cooldown. Cannot be cancelled.
            </p>
            <form onSubmit={handleUnstake} className="space-y-3">
              <div className="relative">
                <Input
                  type="number" placeholder="0.00"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: "48px", borderColor: `${AMBER}30` }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono" style={{ color: "hsl(0 0% 35%)" }}>
                  APX
                </span>
              </div>
              <button
                type="submit"
                disabled={unstakeMutation.isPending}
                className="w-full font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-40"
                style={{ background: `${AMBER}12`, color: AMBER, border: `1px solid ${AMBER}30` }}
              >
                {unstakeMutation.isPending ? "Processing..." : "Begin Unstake"}
              </button>
            </form>
            <div className="flex items-center gap-1.5 mt-3">
              <Clock className="h-3 w-3" style={{ color: AMBER }} />
              <p className="text-[10px] font-mono" style={{ color: "hsl(0 0% 30%)" }}>7-day cooldown required</p>
            </div>
          </div>
        </div>

        {/* Positions */}
        <Panel className="lg:col-span-2 p-5">
          <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: "hsl(0 0% 82%)" }}>
              Your Staking Positions
            </h3>
          </div>

          <div className="space-y-3">
            {positions?.map((pos) => {
              const inCooldown = !!pos.cooldownEndsAt;
              return (
                <div
                  key={pos.id}
                  className="relative rounded-xl p-4 overflow-hidden transition-all"
                  style={{
                    background: CARD_BG2,
                    border: inCooldown ? `1px solid ${AMBER}25` : `1px solid ${BORDER}`,
                  }}
                >
                  <LBracket size={8} color={inCooldown ? `${AMBER}35` : `${LIME}20`} />

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={
                            inCooldown
                              ? { background: `${AMBER}12`, color: AMBER, border: `1px solid ${AMBER}25` }
                              : { background: `${EMERALD}12`, color: EMERALD, border: `1px solid ${EMERALD}25` }
                          }
                        >
                          {pos.status}
                        </span>
                        {!inCooldown && (
                          <span className="text-xs font-mono font-bold" style={{ color: LIME }}>
                            {formatPercentage(pos.apy)} APY
                          </span>
                        )}
                      </div>
                      <div className="font-black text-xl font-mono" style={{ color: "hsl(0 0% 90%)" }}>
                        {formatNumber(pos.stakedAmount)}{" "}
                        <span className="text-sm font-medium" style={{ color: "hsl(0 0% 35%)" }}>APX</span>
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: "hsl(0 0% 28%)" }}>
                        Since {new Date(pos.stakedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black font-mono" style={{ color: LIME }}>
                        +{formatNumber(pos.pendingRewards, 4)}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: "hsl(0 0% 28%)" }}>USDAX pending</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    {inCooldown ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: AMBER }}>
                        <Clock className="h-3 w-3" />
                        Unlocks {formatDistanceToNow(new Date(pos.cooldownEndsAt!), { addSuffix: true })}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono" style={{ color: "hsl(0 0% 28%)" }}>
                        Rewards accumulating in real-time
                      </div>
                    )}
                    <button
                      className="text-xs font-black px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{
                        background: pos.pendingRewards > 0 ? `${LIME}12`  : "hsl(0 0% 8%)",
                        color:      pos.pendingRewards > 0 ? LIME          : "hsl(0 0% 28%)",
                        border:     pos.pendingRewards > 0 ? `1px solid ${LIME}30` : `1px solid ${BORDER}`,
                      }}
                      disabled={pos.pendingRewards <= 0 || claimMutation.isPending}
                      onClick={() => claimMutation.mutate({ id: pos.id })}
                    >
                      {claimMutation.isPending ? "Claiming..." : "Claim Rewards"}
                    </button>
                  </div>
                </div>
              );
            })}
            {positions?.length === 0 && (
              <div className="text-center p-10 rounded-xl font-mono text-sm"
                style={{ border: `1px dashed ${BORDER}`, color: "hsl(0 0% 28%)" }}>
                No active staking positions
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
