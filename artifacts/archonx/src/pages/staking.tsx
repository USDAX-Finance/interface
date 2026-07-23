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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

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
      }
    }
  });

  const unstakeMutation = useUnstakeAkx({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStakingPositionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() });
        toast({ title: "Unstaking process started (7-day cooldown)" });
        setUnstakeAmount("");
      }
    }
  });

  const claimMutation = useClaimRewards({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStakingPositionsQueryKey() });
        toast({ title: "Rewards claimed successfully" });
      }
    }
  });

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    stakeMutation.mutate({
      data: { owner: WALLET_ADDRESS, amount: Number(stakeAmount) }
    });
  };

  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    unstakeMutation.mutate({
      data: { amount: Number(unstakeAmount) }
    });
  };

  if (statsLoading || posLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="font-mono text-xl text-primary animate-pulse">LOADING_STAKING_MODULE...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">AKX Staking</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Secure the protocol & earn yield
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staked (AKX)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatNumber(stats.totalStaked)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{formatCurrency(stats.totalStakedUsd)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Base APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-safe">{formatPercentage(stats.baseApy)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Effective: {formatPercentage(stats.effectiveApy)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatNumber(stats.totalRewardsDistributed)} AKX</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{formatNumber(stats.rewardRatePerDay)} AKX / day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Stakers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{stats.activeStakers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTIONS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stake AKX</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStake} className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={stakeMutation.isPending} className="font-mono">
                    STAKE
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-warning/30">
            <CardHeader>
              <CardTitle className="text-sm text-warning">Unstake AKX</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnstake} className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="outline" disabled={unstakeMutation.isPending} className="font-mono text-warning border-warning hover:bg-warning hover:text-warning-foreground">
                    UNSTAKE
                  </Button>
                </div>
                <p className="text-xs text-warning/80 font-mono mt-2">
                  * Requires 7-day cooldown before claimable
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* POSITIONS */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Your Staking Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions?.map((pos) => (
                  <div key={pos.id} className="border border-border/50 rounded-md p-4 bg-background">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase mb-1">
                          {pos.status}
                        </Badge>
                        <div className="text-xl font-bold font-mono text-primary">
                          {formatNumber(pos.stakedAmount)} AKX
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          Staked: {new Date(pos.stakedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-safe">+{formatNumber(pos.pendingRewards, 4)} AKX</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">Pending Rewards</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border/50 mt-4">
                      <div className="text-xs font-mono text-muted-foreground">
                        {pos.cooldownEndsAt ? (
                          <span className="text-warning">
                            Cooldown ends {formatDistanceToNow(new Date(pos.cooldownEndsAt), { addSuffix: true })}
                          </span>
                        ) : (
                          `APY: ${formatPercentage(pos.apy)}`
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="safe"
                        className="font-mono text-xs h-7"
                        disabled={pos.pendingRewards <= 0 || claimMutation.isPending}
                        onClick={() => claimMutation.mutate({ id: pos.id })}
                      >
                        CLAIM_REWARDS
                      </Button>
                    </div>
                  </div>
                ))}
                {positions?.length === 0 && (
                  <div className="text-center p-8 font-mono text-muted-foreground border border-dashed border-border rounded-md">
                    NO_ACTIVE_STAKES
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
