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

const PIE_COLORS = [
  "hsl(263 70% 62%)",
  "hsl(186 80% 50%)",
  "hsl(142 71% 45%)",
  "hsl(35 92% 60%)",
  "hsl(0 84% 60%)",
];

const ACTIVITY_BADGE: Record<string, string> = {
  MINT:      "hsl(263 70% 62%)",
  BURN:      "hsl(0 84% 60%)",
  DEPOSIT:   "hsl(186 80% 50%)",
  REDEEM:    "hsl(35 92% 60%)",
  STAKE:     "hsl(142 71% 45%)",
  UNSTAKE:   "hsl(35 92% 60%)",
  CLAIM:     "hsl(142 71% 45%)",
  LIQUIDATE: "hsl(0 84% 60%)",
};

function LoadingPulse({ label }: { label: string }) {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div
          className="w-10 h-10 rounded-xl mx-auto animate-pulse"
          style={{ background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))" }}
        />
        <div className="font-mono text-sm text-muted-foreground animate-pulse">{label}</div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  alert,
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ElementType;
  accent?: string;
  alert?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 card-hover"
      style={{
        background: "hsl(232 18% 7%)",
        border: alert
          ? "1px solid hsl(35 92% 60% / 0.35)"
          : "1px solid hsl(263 20% 13%)",
        boxShadow: alert ? "0 0 20px hsl(35 92% 60% / 0.08)" : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent ?? "hsl(263 70% 62%)"}18` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: accent ?? "hsl(263 70% 62%)" }} />
        </div>
      </div>
      <div
        className="text-2xl font-bold font-mono mb-1"
        style={{ color: accent ?? "hsl(0 0% 98%)" }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProtocolStats();
  const { data: activity, isLoading: activityLoading } = useListProtocolActivity();
  const { data: collateral, isLoading: collateralLoading } = useGetCollateralBreakdown();
  const { data: health, isLoading: healthLoading } = useGetHealthDistribution();

  if (statsLoading || activityLoading || collateralLoading || healthLoading) {
    return <LoadingPulse label="Syncing protocol state..." />;
  }

  if (!stats || !activity || !collateral || !health) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Protocol{" "}
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time state overview & risk monitoring
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono"
          style={{
            background: "hsl(142 71% 45% / 0.08)",
            border: "1px solid hsl(142 71% 45% / 0.2)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          <span className="text-safe/80">All systems operational</span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Locked"
          value={formatCurrency(stats.tvlUsd)}
          sub={<>Collateral Ratio: <span className="text-safe">{formatNumber(stats.collateralRatio, 1)}%</span></>}
          icon={Coins}
          accent="hsl(263 70% 62%)"
        />
        <StatCard
          title="USDAX Supply"
          value={formatNumber(stats.usdaxSupply, 0)}
          sub={`${stats.totalPositions} active positions`}
          icon={Activity}
          accent="hsl(186 80% 50%)"
        />
        <StatCard
          title="APX Market"
          value={formatCurrency(stats.apxPrice)}
          sub={`MCap: ${formatCurrency(stats.apxMarketCap)} · APY: ${formatPercentage(stats.baseApy)}`}
          icon={TrendingUp}
          accent="hsl(263 70% 62%)"
        />
        <StatCard
          title="At-Risk Positions"
          value={String(stats.atRiskPositions)}
          sub={stats.atRiskPositions > 0 ? "Requires immediate liquidation" : "All positions healthy"}
          icon={stats.atRiskPositions > 0 ? AlertTriangle : ShieldAlert}
          accent={stats.atRiskPositions > 0 ? "hsl(35 92% 60%)" : "hsl(142 71% 45%)"}
          alert={stats.atRiskPositions > 0}
        />
      </div>

      {/* CHARTS + ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Charts column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Collateral pie */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "hsl(232 18% 7%)", border: "1px solid hsl(263 20% 13%)" }}
            >
              <h3 className="text-sm font-medium mb-1">Collateral Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">By asset type</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collateral}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="valueUsd"
                      nameKey="symbol"
                      stroke="none"
                    >
                      {collateral.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        backgroundColor: "hsl(232 18% 9%)",
                        borderColor: "hsl(263 20% 16%)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(0 0% 95%)" }}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Health factor bar */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "hsl(232 18% 7%)", border: "1px solid hsl(263 20% 13%)" }}
            >
              <h3 className="text-sm font-medium mb-1">Health Factor</h3>
              <p className="text-xs text-muted-foreground mb-4">Position distribution</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={health} barCategoryGap="30%">
                    <XAxis
                      dataKey="range"
                      stroke="hsl(240 8% 35%)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(240 8% 35%)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(263 20% 12%)" }}
                      contentStyle={{
                        backgroundColor: "hsl(232 18% 9%)",
                        borderColor: "hsl(263 20% 16%)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {health.map((entry, index) => {
                        let color = "hsl(263 70% 62%)";
                        if (entry.riskLevel === "critical") color = "hsl(0 84% 60%)";
                        else if (entry.riskLevel === "warning") color = "hsl(35 92% 60%)";
                        else if (entry.riskLevel === "safe") color = "hsl(142 71% 45%)";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{
            background: "hsl(232 18% 7%)",
            border: "1px solid hsl(263 20% 13%)",
            maxHeight: 400,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <h3 className="text-sm font-medium">Live Activity</h3>
          </div>
          <div className="flex-1 overflow-auto space-y-3 pr-1">
            {activity.map((event) => {
              const color = ACTIVITY_BADGE[event.type] ?? "hsl(263 70% 62%)";
              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between pb-3 border-b last:border-0 last:pb-0"
                  style={{ borderColor: "hsl(263 20% 11%)" }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                      >
                        {event.type}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground truncate">
                        {formatAddress(event.user)}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-foreground">
                      {formatNumber(event.amount)} {event.token}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2 space-y-1">
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                    <a
                      href={`https://explorer.robinhood.com/tx/${event.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] hover:underline"
                      style={{ color: "hsl(263 70% 65%)" }}
                    >
                      {formatAddress(event.txHash)}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
