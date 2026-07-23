import { useMemo } from "react";
import {
  useGetProtocolStats,
  useListProtocolActivity,
  useGetCollateralBreakdown,
  useGetHealthDistribution,
} from "@workspace/api-client-react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatCurrency, formatNumber, formatPercentage, formatAddress } from "@/lib/utils";
import { Activity, ShieldAlert, Coins, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── design tokens ─── */
const LIME     = "hsl(79 100% 57%)";
const EMERALD  = "hsl(152 70% 48%)";
const RED      = "hsl(0 84% 60%)";
const AMBER    = "hsl(35 92% 60%)";
const BORDER   = "hsl(0 0% 10%)";
const CARD_BG  = "hsl(0 0% 6%)";
const CARD_BG2 = "hsl(0 0% 8%)";

const PIE_COLORS = [LIME, EMERALD, "hsl(200 80% 52%)", AMBER, RED];

const ACTIVITY_BADGE: Record<string, string> = {
  MINT:      LIME,
  BURN:      RED,
  DEPOSIT:   EMERALD,
  REDEEM:    AMBER,
  STAKE:     EMERALD,
  UNSTAKE:   AMBER,
  CLAIM:     LIME,
  LIQUIDATE: RED,
};

const TOOLTIP_STYLE = {
  backgroundColor: CARD_BG2,
  borderColor: BORDER,
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  borderRadius: "8px",
};

function LBracket({ size = 10, color = `${LIME}30` }: { size?: number; color?: string }) {
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

function LoadingPulse({ label }: { label: string }) {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: `${LIME}18`, border: `1px solid ${LIME}30` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-5 h-5 animate-pulse" style={{ color: LIME }} />
          </div>
        </div>
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 32%)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, sub, icon: Icon, accent, alert,
}: {
  title: string; value: string; sub?: React.ReactNode;
  icon: React.ElementType; accent?: string; alert?: boolean;
}) {
  const color = accent ?? LIME;
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden transition-all"
      style={{
        background: CARD_BG,
        border: alert ? `1px solid ${AMBER}35` : `1px solid ${BORDER}`,
        boxShadow: alert ? `0 0 24px ${AMBER}08` : undefined,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = alert ? `${AMBER}55` : `${LIME}22`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = alert ? `${AMBER}35` : BORDER; }}
    >
      <LBracket color={`${color}20`} />
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 30%)" }}>
          {title}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="font-black text-2xl font-mono mb-1.5" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats,     isLoading: statsLoading }     = useGetProtocolStats();
  const { data: activity,  isLoading: activityLoading }  = useListProtocolActivity();
  const { data: collateral,isLoading: collateralLoading } = useGetCollateralBreakdown();
  const { data: health,    isLoading: healthLoading }     = useGetHealthDistribution();

  if (statsLoading || activityLoading || collateralLoading || healthLoading) {
    return <LoadingPulse label="Syncing protocol state..." />;
  }
  if (!stats || !activity || !collateral || !health) return null;

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDEX Finance · Protocol Layer
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
            Protocol <span style={{ color: LIME }}>Dashboard</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>
            Real-time state overview & risk monitoring
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-mono"
          style={{ background: `${EMERALD}08`, border: `1px solid ${EMERALD}22` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
          <span style={{ color: EMERALD }}>All systems operational</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Locked"
          value={formatCurrency(stats.tvlUsd)}
          sub={<>C-Ratio: <span style={{ color: EMERALD }}>{formatNumber(stats.collateralRatio, 1)}%</span></>}
          icon={Coins}
          accent={LIME}
        />
        <StatCard
          title="USDAX Supply"
          value={formatNumber(stats.usdaxSupply, 0)}
          sub={`${stats.totalPositions} active positions`}
          icon={Activity}
          accent={EMERALD}
        />
        <StatCard
          title="APX Market"
          value={formatCurrency(stats.apxPrice)}
          sub={`MCap: ${formatCurrency(stats.apxMarketCap)} · APY: ${formatPercentage(stats.baseApy)}`}
          icon={TrendingUp}
          accent={LIME}
        />
        <StatCard
          title="At-Risk Positions"
          value={String(stats.atRiskPositions)}
          sub={stats.atRiskPositions > 0 ? "Requires immediate liquidation" : "All positions healthy"}
          icon={stats.atRiskPositions > 0 ? AlertTriangle : ShieldAlert}
          accent={stats.atRiskPositions > 0 ? AMBER : EMERALD}
          alert={stats.atRiskPositions > 0}
        />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Charts column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Collateral pie */}
          <Panel className="p-5">
            <div className="mb-1">
              <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>Collateral Breakdown</div>
              <div className="font-bold text-sm" style={{ color: "hsl(0 0% 78%)" }}>By asset type</div>
            </div>
            <div className="h-[220px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collateral}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={72}
                    paddingAngle={4}
                    dataKey="valueUsd" nameKey="symbol"
                    stroke="none"
                  >
                    {collateral.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: "hsl(0 0% 85%)" }}
                  />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "hsl(0 0% 45%)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Health factor bar */}
          <Panel className="p-5">
            <div className="mb-1">
              <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>Health Factor</div>
              <div className="font-bold text-sm" style={{ color: "hsl(0 0% 78%)" }}>Position distribution</div>
            </div>
            <div className="h-[220px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={health} barCategoryGap="30%">
                  <XAxis dataKey="range" stroke="hsl(0 0% 22%)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(0 0% 22%)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "hsl(0 0% 8%)" }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {health.map((entry, i) => {
                      let color = LIME;
                      if (entry.riskLevel === "critical") color = RED;
                      else if (entry.riskLevel === "warning") color = AMBER;
                      else if (entry.riskLevel === "safe") color = EMERALD;
                      return <Cell key={i} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Activity feed */}
        <Panel className="flex flex-col" style={{ maxHeight: 400 } as React.CSSProperties}>
          <div className="flex items-center gap-2 px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 30%)" }}>Live Activity</span>
          </div>
          <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
            {activity.map((event) => {
              const color = ACTIVITY_BADGE[event.type] ?? LIME;
              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between pb-3"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md flex-shrink-0 tracking-wider uppercase"
                        style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}
                      >
                        {event.type}
                      </span>
                      <span className="font-mono text-[11px] truncate" style={{ color: "hsl(0 0% 35%)" }}>
                        {formatAddress(event.user)}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold" style={{ color: "hsl(0 0% 82%)" }}>
                      {formatNumber(event.amount)} {event.token}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2 space-y-1">
                    <div className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </div>
                    <a
                      href={`https://explorer.robinhood.com/tx/${event.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] hover:underline"
                      style={{ color: `${LIME}80` }}
                    >
                      {formatAddress(event.txHash)}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
