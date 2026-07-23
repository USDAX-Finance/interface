import { useMemo } from "react";
import {
  useGetProtocolStats,
  useListProtocolActivity,
  useGetCollateralBreakdown,
  useGetHealthDistribution,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatNumber, formatPercentage, formatAddress } from "@/lib/utils";
import { Activity, ShieldAlert, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProtocolStats();
  const { data: activity, isLoading: activityLoading } = useListProtocolActivity();
  const { data: collateral, isLoading: collateralLoading } = useGetCollateralBreakdown();
  const { data: health, isLoading: healthLoading } = useGetHealthDistribution();

  if (statsLoading || activityLoading || collateralLoading || healthLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="font-mono text-xl text-primary animate-pulse">LOADING_SYSTEM_DATA...</div>
      </div>
    );
  }

  if (!stats || !activity || !collateral || !health) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Protocol Command</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Global state overview & risk monitoring
          </p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(stats.tvlUsd)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Collateral Ratio: <span className="text-safe">{formatNumber(stats.collateralRatio, 1)}%</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">USDAX Supply</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatNumber(stats.usdaxSupply, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Across {stats.totalPositions} active positions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AKX Market</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(stats.akxPrice)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              MCap: {formatCurrency(stats.akxMarketCap)} | Base APY: {formatPercentage(stats.baseApy)}
            </p>
          </CardContent>
        </Card>
        <Card className={stats.atRiskPositions > 0 ? "border-warning/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Positions</CardTitle>
            {stats.atRiskPositions > 0 ? (
              <AlertTriangle className="h-4 w-4 text-warning animate-pulse" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${stats.atRiskPositions > 0 ? 'text-warning' : 'text-primary'}`}>
              {stats.atRiskPositions}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {stats.atRiskPositions > 0 ? "Requires immediate liquidation" : "All positions healthy"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Collateral Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collateral}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="valueUsd"
                      nameKey="symbol"
                      stroke="none"
                    >
                      {collateral.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'var(--font-mono)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Health Factor Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={health}>
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'var(--font-mono)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {health.map((entry, index) => {
                        let color = "hsl(var(--primary))";
                        if (entry.riskLevel === 'critical') color = "hsl(var(--destructive))";
                        else if (entry.riskLevel === 'warning') color = "hsl(var(--warning))";
                        else if (entry.riskLevel === 'safe') color = "hsl(var(--safe))";
                        
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <Card className="flex flex-col h-[400px] lg:h-auto">
          <CardHeader>
            <CardTitle className="text-sm">Live Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2">
            <div className="space-y-4">
              {activity.map((event) => (
                <div key={event.id} className="flex items-start justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 h-4">
                        {event.type}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatAddress(event.user)}
                      </span>
                    </div>
                    <div className="font-mono text-sm">
                      {formatNumber(event.amount)} {event.token}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                    <a 
                      href={`https://explorer.robinhood.com/tx/${event.txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono text-[10px] text-primary hover:underline"
                    >
                      {formatAddress(event.txHash)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
