import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetStakingStats, getGetStakingStatsQueryKey } from "@workspace/api-client-react";
import {
  Copy, CheckCircle2, ExternalLink, RefreshCw,
  ArrowUpRight, ArrowDownLeft, Zap, Users, Coins,
  TrendingUp, Shield, ScrollText, BarChart2, Clock, AlertTriangle,
} from "lucide-react";
import {
  formatCompactNum, formatAddress, formatTimeAgoUTC,
} from "@/lib/utils";

/* ─── Design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const VIOLET  = "hsl(262 83% 68%)";
const BORDER  = "hsl(0 0% 11%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 8%)";
const MUTED   = "hsl(0 0% 40%)";
const DIM     = "hsl(0 0% 28%)";

/* Mainnet blockscout — staking is on chain 4663 */
const MAINNET_EXPLORER = "https://robinhoodchain.blockscout.com";
const APX_STAKING      = "0x00b6792ac02caf607d0b6ea4a6f572a83472412f";

/* ─── Chain event type ─── */
interface ChainEvent {
  type:        "STAKE" | "UNSTAKE" | "CLAIM" | "COOLDOWN" | "EMERGENCY";
  user:        string;
  amount:      number;
  txHash:      string;
  blockNumber: number;
  timestamp:   string;
}

interface ChainEventsResponse {
  events:        ChainEvent[];
  totalVolume:   number;
  totalClaimed:  number;
  uniqueStakers: number;
}

/* ─── Tx-type config ─── */
const TX_META: Record<string, {
  label: string; color: string; bg: string; icon: React.ElementType; dir: "in" | "out" | "neutral";
}> = {
  STAKE:     { label: "STAKE",     color: VIOLET,              bg: `${VIOLET}12`,              icon: ArrowUpRight,  dir: "in"      },
  UNSTAKE:   { label: "UNSTAKE",   color: AMBER,               bg: `${AMBER}12`,               icon: ArrowDownLeft, dir: "out"     },
  CLAIM:     { label: "CLAIM",     color: LIME,                bg: `${LIME}12`,                icon: Zap,           dir: "neutral" },
  COOLDOWN:  { label: "COOLDOWN",  color: AMBER,               bg: `${AMBER}08`,               icon: Clock,         dir: "neutral" },
  EMERGENCY: { label: "EMERGENCY", color: "hsl(0 84% 60%)",    bg: "hsl(0 84% 60% / 0.12)",   icon: AlertTriangle, dir: "out"     },
};

/* ─── CopyBtn ─── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="transition-colors ml-1 flex-shrink-0"
      style={{ color: copied ? LIME : DIM }}
      title="Copy"
    >
      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Stat card ─── */
function StatCard({
  label, value, sub, color = LIME, icon: Icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl px-5 py-4"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: DIM }}>
          {label}
        </span>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
      </div>
      <span className="font-black text-xl font-mono leading-none" style={{ color }}>{value}</span>
      {sub && <span className="text-[11px] font-mono" style={{ color: MUTED }}>{sub}</span>}
    </div>
  );
}

/* ─── Tx row ─── */
function TxRow({ event, index }: { event: ChainEvent; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 18);
    return () => clearTimeout(t);
  }, [index]);

  const meta = TX_META[event.type];
  if (!meta) return null;
  const Icon = meta.icon;
  const hash = event.txHash ?? "";

  const rowStyle = {
    borderBottom: `1px solid ${BORDER}`,
    opacity:   visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(4px)",
    transition: "opacity 0.3s, transform 0.3s",
    background: "transparent",
  };

  const TypeBadge = () => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-wider flex-shrink-0"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}25` }}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </div>
  );

  const amountStr = Number(event.amount).toLocaleString(undefined, { maximumFractionDigits: 4 });
  const sign = meta.dir === "out" ? "−" : meta.dir === "in" ? "+" : "";

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-1 px-4 py-3" style={rowStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TypeBadge />
            <div className="flex items-center gap-1 font-mono text-[11px] truncate" style={{ color: "hsl(0 0% 60%)" }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: VIOLET }} />
              {formatAddress(event.user)}
            </div>
          </div>
          <div className="font-black font-mono text-[12px] flex-shrink-0" style={{ color: meta.color }}>
            {sign}{amountStr}
            <span className="font-normal text-[10px] ml-1" style={{ color: MUTED }}>APX</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px]" style={{ color: DIM }}>
            {formatTimeAgoUTC(event.timestamp)}
          </span>
          {hash ? (
            <div className="flex items-center gap-1 font-mono text-[10px]" style={{ color: DIM }}>
              <span>{`${hash.slice(0, 6)}…${hash.slice(-4)}`}</span>
              <a href={`${MAINNET_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70" style={{ color: DIM }}>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ) : <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 20%)" }}></span>}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid items-center gap-3 px-5 py-3.5" style={{
          ...rowStyle,
          gridTemplateColumns: "100px 1fr 150px 80px 90px 160px",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        <TypeBadge />
        <div className="flex items-center gap-1 font-mono text-[12px]" style={{ color: "hsl(0 0% 65%)" }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: VIOLET }} />
          {formatAddress(event.user)}
          <CopyBtn text={event.user} />
        </div>
        <div className="font-black font-mono text-[13px] text-right" style={{ color: meta.color }}>
          {sign}{amountStr}
        </div>
        <div className="font-mono text-[11px] font-bold" style={{ color: MUTED }}>APX</div>
        <div className="font-mono text-[11px]" style={{ color: DIM }}>
          {formatTimeAgoUTC(event.timestamp)}
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]" style={{ color: DIM }}>
          <span>{hash ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : ""}</span>
          {hash && (
            <>
              <CopyBtn text={hash} />
              <a href={`${MAINNET_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                className="transition-colors hover:opacity-80 flex-shrink-0" style={{ color: DIM }}
                title="View on Blockscout" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main page ─── */
export default function StakingActivityPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown]   = useState(30);
  const [filter, setFilter]         = useState<string>("ALL");

  /* Chain events — real on-chain data via backend getLogs */
  const {
    data: chainData,
    refetch: refetchChain,
    isLoading: chainLoading,
  } = useQuery<ChainEventsResponse>({
    queryKey: ["staking-chain-events"],
    queryFn: async () => {
      const r = await fetch(`${import.meta.env.BASE_URL}api/staking/chain-events`);
      if (!r.ok) throw new Error("chain-events fetch failed");
      return r.json();
    },
    refetchInterval: 30_000,
    staleTime:       25_000,
  });

  /* Staking stats for TVL + pool */
  const { data: stats, refetch: refetchStats } = useGetStakingStats({
    query: { queryKey: getGetStakingStatsQueryKey(), refetchInterval: 30_000 },
  });

  const events: ChainEvent[] = chainData?.events ?? [];
  const STAKING_TYPES = ["STAKE", "UNSTAKE", "CLAIM", "COOLDOWN", "EMERGENCY"];
  const displayed = filter === "ALL"
    ? events.filter((e) => STAKING_TYPES.includes(e.type))
    : events.filter((e) => e.type === filter);

  const typeCounts: Record<string, number> = {};
  events.forEach((e) => { typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1; });
  const totalEvents = events.filter((e) => (STAKING_TYPES as string[]).includes(e.type)).length;

  /* Auto-refresh every 30 s */
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchChain(), refetchStats()]);
    setCountdown(30);
    setTimeout(() => setRefreshing(false), 600);
  }, [refetchChain, refetchStats]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { doRefresh(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [doRefresh]);

  const FILTERS = ["ALL", "STAKE", "UNSTAKE", "COOLDOWN", "CLAIM", "EMERGENCY"];

  /* Derived metrics from chain events */
  const totalVolume  = chainData?.totalVolume  ?? 0;
  const totalClaimed = chainData?.totalClaimed ?? 0;
  const tvl          = stats?.totalStaked      ?? 0;
  const poolRemain   = (stats as any)?.rewardsPool as number | undefined;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase mb-4 px-3 py-1.5 rounded-full"
            style={{ background: `${VIOLET}10`, border: `1px solid ${VIOLET}30`, color: VIOLET }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: VIOLET }} />
            Robinhood Chain Mainnet · APX Staking · Live Feed
          </div>
          <h1 className="font-black uppercase leading-none tracking-tight mb-2"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "hsl(0 0% 97%)" }}>
            STAKING <span style={{ color: LIME }}>ACTIVITY</span>
          </h1>
          <p className="text-[14px]" style={{ color: MUTED }}>
            All APX staking interactions on Robinhood Chain Mainnet (Chain ID 4663) in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          {refreshing && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: LIME }} />}
          {!refreshing && (
            <span className="font-mono text-[10px]" style={{ color: DIM }}>
              refresh in {countdown}s
            </span>
          )}
          <a href={`${MAINNET_EXPLORER}/address/${APX_STAKING}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: LIME, border: `1px solid ${LIME}25`, background: `${LIME}08` }}>
            <ExternalLink className="w-3 h-3" />
            Blockscout ↗
          </a>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="TVL (APX Staked)"
          value={chainLoading && tvl === 0 ? "…" : `${tvl.toLocaleString()} APX`}
          sub="Live on mainnet"
          color={VIOLET}
          icon={Coins}
        />
        <StatCard
          label="TX Volume (all-time)"
          value={chainLoading ? "…" : `${formatCompactNum(totalVolume)} APX`}
          sub={`${typeCounts["STAKE"] ?? 0} stake tx${(typeCounts["STAKE"] ?? 0) !== 1 ? "s" : ""}`}
          color={LIME}
          icon={BarChart2}
        />
        <StatCard
          label="APX Claimed"
          value={chainLoading ? "…" : totalClaimed > 0
            ? `${formatCompactNum(totalClaimed)} APX`
            : "0"}
          sub={`${typeCounts["CLAIM"] ?? 0} claim tx${(typeCounts["CLAIM"] ?? 0) !== 1 ? "s" : ""}`}
          color={EMERALD}
          icon={Zap}
        />
        <StatCard
          label="Pool Remaining"
          value={
            poolRemain != null && !isNaN(Number(poolRemain))
              ? `${Number(poolRemain).toLocaleString(undefined, { maximumFractionDigits: 0 })} APX`
              : "~10M APX"
          }
          sub={
            poolRemain != null && !isNaN(Number(poolRemain))
              ? `${((Number(poolRemain) / 10_000_000) * 100).toFixed(1)}% of 10M pool`
              : "~10 yr runway at current rate"
          }
          color={AMBER}
          icon={Shield}
        />
      </div>

      {/* ── Transaction table ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}>

        {/* Table header + filter chips */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase" style={{ color: DIM }}>
              Live Staking Feed
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full ml-1"
              style={{ background: `${LIME}10`, color: LIME, border: `1px solid ${LIME}20` }}>
              {displayed.length} events
            </span>
            {chainLoading && (
              <RefreshCw className="w-3 h-3 animate-spin ml-1" style={{ color: DIM }} />
            )}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f;
              const count  = f === "ALL" ? totalEvents : (typeCounts[f] ?? 0);
              const meta   = f === "ALL" ? null : TX_META[f];
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: active ? (meta ? `${meta.color}15` : `${LIME}15`) : "hsl(0 0% 9%)",
                    color:      active ? (meta ? meta.color : LIME) : DIM,
                    border:     active ? `1px solid ${meta ? meta.color : LIME}30` : `1px solid ${BORDER}`,
                  }}>
                  {f}{count > 0 && <span className="opacity-60 ml-0.5">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column headers — desktop */}
        <div className="hidden md:grid px-5 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase"
          style={{
            gridTemplateColumns: "100px 1fr 150px 80px 90px 160px",
            color: DIM, borderBottom: `1px solid ${BORDER}`, background: CARD2,
          }}>
          <span>Type</span>
          <span>Wallet</span>
          <span className="text-right">Amount</span>
          <span>Token</span>
          <span>Time</span>
          <span>Tx Hash</span>
        </div>

        {/* Column headers — mobile */}
        <div className="md:hidden grid grid-cols-2 px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase"
          style={{ color: DIM, borderBottom: `1px solid ${BORDER}`, background: CARD2 }}>
          <span>Type · Wallet</span>
          <span className="text-right">Amount</span>
        </div>

        {/* Rows */}
        {chainLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: DIM }} />
            <p className="font-mono text-[12px]" style={{ color: MUTED }}>Fetching on-chain events…</p>
          </div>
        ) : displayed.length > 0 ? (
          <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
            {displayed.map((event, i) => (
              <TxRow key={`${event.txHash}-${event.type}`} event={event} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${VIOLET}08`, border: `1px dashed ${VIOLET}20` }}>
              <ScrollText className="w-5 h-5" style={{ color: DIM }} />
            </div>
            <p className="font-mono text-[13px]" style={{ color: MUTED }}>No staking events yet</p>
            <p className="font-mono text-[11px]" style={{ color: DIM }}>
              Stake, unstake, or claim APX to see events appear here
            </p>
          </div>
        )}
      </div>

      {/* ── Network reference strip ── */}
      <div className="rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center"
        style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: VIOLET }} />
          <span className="font-mono text-[11px] font-bold" style={{ color: VIOLET }}>
            Robinhood Chain Mainnet
          </span>
          <span className="font-mono text-[11px]" style={{ color: DIM }}>Chain ID 4663</span>
        </div>
        {[
          { label: "Explorer",   href: "https://explorer.chain.robinhood.com",        val: "explorer.chain.robinhood.com" },
          { label: "Blockscout", href: "https://robinhoodchain.blockscout.com",        val: "robinhoodchain.blockscout.com" },
          { label: "RPC",        href: "https://rpc.mainnet.chain.robinhood.com/rpc",  val: "rpc.mainnet.chain.robinhood.com/rpc" },
        ].map((r) => (
          <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ color: DIM }}>
            <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "hsl(0 0% 35%)" }}>{r.label}</span>
            <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 50%)" }}>{r.val}</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ))}
        <a href={`${MAINNET_EXPLORER}/address/${APX_STAKING}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80 ml-auto font-mono text-[11px]"
          style={{ color: LIME }}>
          <TrendingUp className="w-3 h-3" />
          APXStaking: 0x00b679…2412f
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </div>
  );
}
