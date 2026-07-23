import { useState } from "react";
import {
  useGetStakingStats,
  useListStakingPositions,
  useStakeAkx,
  useUnstakeAkx,
  useClaimRewards,
  getGetStakingStatsQueryKey,
  getListStakingPositionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, Users, Coins, Zap, Clock } from "lucide-react";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

const panelStyle = {
  background: "hsl(232 18% 7%)",
  border: "1px solid hsl(263 20% 13%)",
  borderRadius: "1rem",
};

export default function Staking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useGetStakingStats();
  const { data: positions, isLoading: posLoading } = useListStakingPositions();

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

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    stakeMutation.mutate({ data: { owner: WALLET_ADDRESS, amount: Number(stakeAmount) } });
  };

  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    unstakeMutation.mutate({ data: { amount: Number(unstakeAmount) } });
  };

  if (statsLoading || posLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 rounded-xl mx-auto animate-pulse"
            style={{ background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))" }}
          />
          <div className="font-mono text-sm text-muted-foreground">Loading staking module...</div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Staked",
      value: formatNumber(stats.totalStaked),
      sub: formatCurrency(stats.totalStakedUsd),
      icon: Coins,
      color: "hsl(263 70% 62%)",
    },
    {
      label: "Base APY",
      value: formatPercentage(stats.baseApy),
      sub: `Effective: ${formatPercentage(stats.effectiveApy)}`,
      icon: TrendingUp,
      color: "hsl(142 71% 45%)",
    },
    {
      label: "Distributed",
      value: `${formatNumber(stats.totalRewardsDistributed, 0)} AKX`,
      sub: `${formatNumber(stats.rewardRatePerDay, 2)} AKX / day`,
      icon: Zap,
      color: "hsl(186 80% 50%)",
    },
    {
      label: "Active Stakers",
      value: String(stats.activeStakers),
      sub: "Protocol participants",
      icon: Users,
      color: "hsl(263 70% 62%)",
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          AKX <span className="gradient-text">Staking</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Secure the protocol & earn yield</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-5 card-hover" style={panelStyle}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}18` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono mb-1" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Action panels */}
        <div className="space-y-4">
          {/* Stake */}
          <div className="rounded-2xl p-5" style={panelStyle}>
            <h3 className="font-semibold mb-1">Stake AKX</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Stake to earn rewards. Cooldown starts from your latest stake.
            </p>
            <form onSubmit={handleStake} className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  required
                  className="rounded-xl font-mono pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  AKX
                </span>
              </div>
              <button
                type="submit"
                disabled={stakeMutation.isPending}
                className="btn-gradient w-full text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {stakeMutation.isPending ? "Staking..." : "Stake AKX"}
              </button>
            </form>
          </div>

          {/* Unstake */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "hsl(232 18% 7%)",
              border: "1px solid hsl(35 92% 60% / 0.2)",
              borderRadius: "1rem",
            }}
          >
            <h3 className="font-semibold mb-1" style={{ color: "hsl(35 92% 65%)" }}>
              Unstake AKX
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Initiates the 7-day cooldown. Cannot be cancelled.
            </p>
            <form onSubmit={handleUnstake} className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  required
                  className="rounded-xl font-mono pr-16"
                  style={{ borderColor: "hsl(35 92% 60% / 0.3)" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                  AKX
                </span>
              </div>
              <button
                type="submit"
                disabled={unstakeMutation.isPending}
                className="w-full font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-all"
                style={{
                  background: "hsl(35 92% 60% / 0.12)",
                  color: "hsl(35 92% 65%)",
                  border: "1px solid hsl(35 92% 60% / 0.3)",
                }}
              >
                {unstakeMutation.isPending ? "Processing..." : "Begin Unstake"}
              </button>
            </form>
            <div className="flex items-center gap-1.5 mt-3">
              <Clock className="h-3 w-3" style={{ color: "hsl(35 92% 60%)" }} />
              <p className="text-[10px] text-muted-foreground font-mono">7-day cooldown required</p>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={panelStyle}>
          <h3 className="font-semibold mb-4">Your Staking Positions</h3>
          <div className="space-y-3">
            {positions?.map((pos) => {
              const inCooldown = !!pos.cooldownEndsAt;
              return (
                <div
                  key={pos.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: "hsl(232 20% 9%)",
                    border: inCooldown
                      ? "1px solid hsl(35 92% 60% / 0.25)"
                      : "1px solid hsl(263 20% 14%)",
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md uppercase"
                          style={
                            inCooldown
                              ? {
                                  background: "hsl(35 92% 60% / 0.12)",
                                  color: "hsl(35 92% 65%)",
                                  border: "1px solid hsl(35 92% 60% / 0.25)",
                                }
                              : {
                                  background: "hsl(142 71% 45% / 0.12)",
                                  color: "hsl(142 71% 55%)",
                                  border: "1px solid hsl(142 71% 45% / 0.25)",
                                }
                          }
                        >
                          {pos.status}
                        </span>
                        {!inCooldown && (
                          <span className="text-xs font-mono" style={{ color: "hsl(142 71% 55%)" }}>
                            {formatPercentage(pos.apy)} APY
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-bold font-mono">
                        {formatNumber(pos.stakedAmount)}{" "}
                        <span className="text-sm text-muted-foreground">AKX</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        Since {new Date(pos.stakedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-lg font-bold font-mono"
                        style={{ color: "hsl(142 71% 55%)" }}
                      >
                        +{formatNumber(pos.pendingRewards, 4)}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">AKX pending</div>
                    </div>
                  </div>

                  <div
                    className="flex justify-between items-center pt-3"
                    style={{ borderTop: "1px solid hsl(263 20% 12%)" }}
                  >
                    {inCooldown ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "hsl(35 92% 60%)" }}>
                        <Clock className="h-3 w-3" />
                        Unlocks {formatDistanceToNow(new Date(pos.cooldownEndsAt!), { addSuffix: true })}
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-muted-foreground">
                        Rewards accumulating in real-time
                      </div>
                    )}
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{
                        background:
                          pos.pendingRewards > 0
                            ? "hsl(142 71% 45% / 0.12)"
                            : "hsl(240 8% 12%)",
                        color:
                          pos.pendingRewards > 0
                            ? "hsl(142 71% 55%)"
                            : "hsl(240 8% 45%)",
                        border:
                          pos.pendingRewards > 0
                            ? "1px solid hsl(142 71% 45% / 0.3)"
                            : "1px solid hsl(240 8% 16%)",
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
              <div
                className="text-center p-10 rounded-xl font-mono text-sm text-muted-foreground"
                style={{ border: "1px dashed hsl(263 20% 14%)" }}
              >
                No active staking positions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
