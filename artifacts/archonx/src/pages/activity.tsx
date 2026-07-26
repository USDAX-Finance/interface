import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProtocolActivity,
  useGetProtocolStats,
  useGetNetworkStats,
  getListProtocolActivityQueryKey,
  getGetProtocolStatsQueryKey,
  getGetNetworkStatsQueryKey,
} from "@workspace/api-client-react";
import {
  Activity, Copy, CheckCircle2, ExternalLink,
  RefreshCw, Users, TrendingUp, Coins, Zap,
  ArrowUpRight, ArrowDownLeft, Flame, Menu, X,
} from "lucide-react";
import {
  formatCurrency, formatCompactNum, formatCompact,
  formatAddress, formatTimeAgoUTC,
} from "@/lib/utils";

/* ─── Design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const RED     = "hsl(0 84% 60%)";
const VIOLET  = "hsl(262 83% 68%)";
const BG      = "hsl(0 0% 4%)";
const BORDER  = "hsl(0 0% 11%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 8%)";
const MUTED   = "hsl(0 0% 40%)";
const DIM     = "hsl(0 0% 28%)";

const EXPLORER         = "https://explorer.testnet.chain.robinhood.com";
const MAINNET_EXPLORER = "https://robinhoodchain.blockscout.com";

/* Events that come from Mainnet (4663) APX staking contracts */
const MAINNET_TYPES = new Set(["STAKE", "UNSTAKE", "CLAIM", "EMERGENCY", "COOLDOWN"]);
const explorerFor   = (type: string) => MAINNET_TYPES.has(type) ? MAINNET_EXPLORER : EXPLORER;
const chainLabelFor = (type: string) => MAINNET_TYPES.has(type) ? "Mainnet 4663" : "Testnet 46630";
const chainColorFor = (type: string) => MAINNET_TYPES.has(type) ? VIOLET : EMERALD;

/* ─── Tx-type config ─── */
const TX_META: Record<string, {
  label: string; color: string; bg: string; icon: React.ElementType; dir: "in" | "out" | "neutral";
}> = {
  MINT:      { label: "MINT",      color: LIME,    bg: `${LIME}10`,    icon: ArrowUpRight,   dir: "in"      },
  BURN:      { label: "BURN",      color: RED,     bg: `${RED}10`,     icon: ArrowDownLeft,  dir: "out"     },
  DEPOSIT:   { label: "DEPOSIT",   color: EMERALD, bg: `${EMERALD}10`, icon: ArrowUpRight,   dir: "in"      },
  REDEEM:    { label: "REDEEM",    color: AMBER,   bg: `${AMBER}10`,   icon: ArrowDownLeft,  dir: "out"     },
  STAKE:     { label: "STAKE",     color: VIOLET,  bg: `${VIOLET}10`,  icon: ArrowUpRight,   dir: "in"      },
  UNSTAKE:   { label: "UNSTAKE",   color: AMBER,   bg: `${AMBER}10`,   icon: ArrowDownLeft,  dir: "out"     },
  CLAIM:     { label: "CLAIM",     color: VIOLET,  bg: `${VIOLET}10`,  icon: Zap,            dir: "neutral" },
  LIQUIDATE: { label: "LIQUIDATE", color: RED,     bg: `${RED}12`,     icon: Flame,          dir: "neutral" },
  EMERGENCY: { label: "EMERGENCY", color: RED,     bg: `${RED}10`,     icon: Flame,          dir: "out"     },
  COOLDOWN:  { label: "COOLDOWN",  color: AMBER,   bg: `${AMBER}10`,   icon: ArrowDownLeft,  dir: "neutral" },
};

/* ─── Helpers ─── */
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

function StatPill({
  label, value, sub, color = LIME, icon: Icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl px-5 py-4"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: DIM }}>
          {label}
        </span>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}
        >
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
      </div>
      <span className="font-black text-xl font-mono leading-none" style={{ color }}>{value}</span>
      {sub && <span className="text-[11px] font-mono" style={{ color: MUTED }}>{sub}</span>}
    </div>
  );
}

/* ─── Row ticker — fade-in on mount ─── */
function TxRow({ event, index }: { event: any; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 18);
    return () => clearTimeout(t);
  }, [index]);

  const meta = TX_META[event.type] ?? TX_META.MINT;
  const Icon = meta.icon;
  const hash: string = event.txHash ?? "";

  const fadeStyle = {
    borderBottom: `1px solid ${BORDER}`,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(4px)",
    transition: "opacity 0.3s, transform 0.3s",
    background: "transparent",
  };

  const TypeBadge = () => (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-wider flex-shrink-0"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}25` }}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </div>
  );

  return (
    <>
      {/* ── Mobile layout (< md) ── */}
      <div
        className="md:hidden flex flex-col gap-1 px-4 py-3"
        style={fadeStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        {/* Row 1: badge + wallet + amount */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <TypeBadge />
            <div className="flex items-center gap-1 font-mono text-[11px] truncate" style={{ color: "hsl(0 0% 60%)" }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: EMERALD }} />
              {formatAddress(event.user)}
            </div>
          </div>
          <div className="font-black font-mono text-[12px] flex-shrink-0" style={{ color: meta.color }}>
            {meta.dir === "out" ? "−" : "+"}{Number(event.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="font-normal text-[10px] ml-1" style={{ color: MUTED }}>{event.token}</span>
          </div>
        </div>
        {/* Row 2: time + chain + hash */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]" style={{ color: DIM }}>
              {formatTimeAgoUTC(event.timestamp)}
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: `${chainColorFor(event.type)}10`, color: chainColorFor(event.type), border: `1px solid ${chainColorFor(event.type)}25` }}>
              {chainLabelFor(event.type)}
            </span>
          </div>
          {hash ? (
            <div className="flex items-center gap-1 font-mono text-[10px]" style={{ color: DIM }}>
              <span>{`${hash.slice(0, 6)}…${hash.slice(-4)}`}</span>
              <a href={`${explorerFor(event.type)}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70" style={{ color: DIM }}>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ) : (
            <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 20%)" }}></span>
          )}
        </div>
      </div>

      {/* ── Desktop layout (md+) ── */}
      <div
        className="hidden md:grid items-center gap-3 px-5 py-3.5"
        style={{
          ...fadeStyle,
          gridTemplateColumns: "100px 1fr 130px 80px 75px 140px",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(0 0% 7%)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        {/* Type badge */}
        <div className="flex items-center gap-1.5">
          <TypeBadge />
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-1 font-mono text-[12px]" style={{ color: "hsl(0 0% 65%)" }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: EMERALD }} />
          {formatAddress(event.user)}
          <CopyBtn text={event.user} />
        </div>

        {/* Amount */}
        <div className="font-black font-mono text-[13px] text-right" style={{ color: meta.color }}>
          {meta.dir === "out" ? "−" : "+"}{Number(event.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>

        {/* Token */}
        <div className="font-mono text-[11px] font-bold" style={{ color: MUTED }}>
          {event.token}
        </div>

        {/* Time + chain */}
        <div className="space-y-0.5">
          <div className="font-mono text-[11px]" style={{ color: DIM }}>
            {formatTimeAgoUTC(event.timestamp)}
          </div>
          <div className="font-mono text-[9px] px-1.5 py-0.5 rounded-full inline-block"
            style={{ background: `${chainColorFor(event.type)}10`, color: chainColorFor(event.type), border: `1px solid ${chainColorFor(event.type)}25` }}>
            {chainLabelFor(event.type)}
          </div>
        </div>

        {/* Tx hash */}
        <div className="flex items-center gap-1 font-mono text-[11px]" style={{ color: DIM }}>
          <span>{hash ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : ""}</span>
          {hash && (
            <>
              <CopyBtn text={hash} />
              <a
                href={`${explorerFor(event.type)}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:opacity-80 flex-shrink-0"
                style={{ color: DIM }}
                title={`View on ${MAINNET_TYPES.has(event.type) ? "Blockscout (Mainnet)" : "Explorer (Testnet)"}`}
                onClick={(e) => e.stopPropagation()}
              >
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
export default function ActivityPage() {
  const qc = useQueryClient();
  const [countdown, setCountdown] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const { data: activity = [] } = useListProtocolActivity();
  const { data: stats }         = useGetProtocolStats();
  const { data: net }           = useGetNetworkStats();

  /* Filter state */
  const [filter, setFilter] = useState<string>("ALL");
  const filters = ["ALL", "MINT", "BURN", "DEPOSIT", "REDEEM", "STAKE", "UNSTAKE", "LIQUIDATE"];
  const displayed = filter === "ALL"
    ? activity
    : activity.filter((e: any) => e.type === filter);

  /* Auto-refresh every 30 s */
  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListProtocolActivityQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetProtocolStatsQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetNetworkStatsQueryKey() }),
    ]);
    setCountdown(30);
    setTimeout(() => setRefreshing(false), 600);
  }, [qc]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { doRefresh(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [doRefresh]);

  /* Counts per type for filter badges */
  const typeCounts: Record<string, number> = {};
  activity.forEach((e: any) => {
    typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: BG, color: "hsl(0 0% 88%)" }}>

      {/* ── Top bar ── */}
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{ background: "hsl(0 0% 3% / 0.95)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="h-14 flex items-center px-4 sm:px-8 gap-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src="/favicon.png" alt="USDAX" className="w-7 h-7 rounded" />
              <span className="font-bold text-base tracking-tight" style={{ color: "hsl(0 0% 80%)" }}>
                USDAX <span style={{ color: "hsl(0 0% 35%)" }}>finance</span>
              </span>
            </div>
          </Link>
          <div className="flex-1" />
          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/faucet">
              <span className="text-[12px] px-3 py-1.5 rounded transition-colors" style={{ color: LIME, border: `1px solid ${LIME}25` }}>
                Faucet
              </span>
            </Link>
            <Link href="/docs">
              <span className="text-[12px] px-3 py-1.5 rounded transition-colors" style={{ color: "hsl(0 0% 40%)", border: `1px solid ${BORDER}` }}>
                Docs
              </span>
            </Link>
            <Link href="/app">
              <button
                className="text-[12px] font-bold px-4 py-1.5 rounded flex items-center gap-1.5"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              >
                <Zap className="w-3.5 h-3.5" /> Launch App
              </button>
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg"
            style={{ color: "hsl(0 0% 55%)" }}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="sm:hidden px-4 pb-3 space-y-1" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Link href="/faucet">
              <div className="block px-3 py-2.5 text-[14px] font-medium cursor-pointer" style={{ color: LIME }}
                onClick={() => setMobileNavOpen(false)}>Faucet</div>
            </Link>
            <Link href="/docs">
              <div className="block px-3 py-2.5 text-[14px] font-medium cursor-pointer" style={{ color: "hsl(0 0% 55%)" }}
                onClick={() => setMobileNavOpen(false)}>Docs</div>
            </Link>
            <div className="pt-1">
              <Link href="/app">
                <button className="w-full flex items-center justify-center gap-2 font-bold px-4 py-2 rounded text-[13px]"
                  style={{ background: LIME, color: "hsl(0 0% 4%)" }}
                  onClick={() => setMobileNavOpen(false)}>
                  <Zap className="w-3.5 h-3.5" /> Launch App
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">

        {/* ── Hero ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-4">
          <div>
            <div
              className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase mb-4 px-3 py-1.5 rounded-full"
              style={{ background: `${EMERALD}08`, border: `1px solid ${EMERALD}25`, color: EMERALD }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
              Testnet 46630 + Mainnet 4663 · Live Feed
            </div>
            <h1
              className="font-black uppercase leading-none tracking-tight mb-2"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "hsl(0 0% 97%)" }}
            >
              PROTOCOL <span style={{ color: LIME }}>ACTIVITY</span>
            </h1>
            <p className="text-[14px]" style={{ color: MUTED }}>
              Vault activity (MINT, BURN, DEPOSIT, REDEEM, LIQUIDATE) on Testnet 46630 — APX staking (STAKE, UNSTAKE, CLAIM) on Mainnet 4663. Each tx links to the correct chain explorer.
            </p>
          </div>

          {/* Silent auto-refresh indicator — visible only while actually refreshing */}
          {refreshing && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0">
              <RefreshCw className="w-3 h-3 animate-spin" style={{ color: LIME }} />
            </div>
          )}
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatPill
            label="TVL"
            value={stats ? formatCompact(stats.tvlUsd) : ""}
            sub="Total collateral locked"
            color={LIME}
            icon={Coins}
          />
          <StatPill
            label="USDAX Supply"
            value={stats ? formatCompactNum(stats.usdaxSupply) : ""}
            sub="Stablecoin in circulation"
            color={EMERALD}
            icon={Activity}
          />
          <StatPill
            label={net && net.volume24hUsd > 0 ? "Vol 24h" : "Vol Total"}
            value={net ? formatCompact(net.volume24hUsd > 0 ? net.volume24hUsd : net.totalVolumeUsd) : ""}
            sub={net && net.volume24hUsd > 0 ? "Mint + burn · last 24h" : "Mint + burn · all-time"}
            color={LIME}
            icon={TrendingUp}
          />
          <StatPill
            label="Txns 24h"
            value={net ? String(net.transactions24h) : ""}
            sub="Protocol interactions"
            color={AMBER}
            icon={Zap}
          />
          <StatPill
            label="Unique Wallets"
            value={net ? String(net.uniqueUsers) : ""}
            sub="Distinct addresses"
            color={VIOLET}
            icon={Users}
          />
          <StatPill
            label="Total Txns"
            value={net ? formatCompactNum(net.totalTransactions) : ""}
            sub="Lifetime interactions"
            color={EMERALD}
            icon={Activity}
          />
        </div>

        {/* ── Activity table ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          {/* Table header + filter row */}
          <div
            className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase" style={{ color: DIM }}>
                Live Transaction Feed
              </span>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full ml-1"
                style={{ background: `${LIME}10`, color: LIME, border: `1px solid ${LIME}20` }}
              >
                {displayed.length} events
              </span>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => {
                const active = filter === f;
                const count = f === "ALL" ? activity.length : (typeCounts[f] ?? 0);
                const meta = f === "ALL" ? null : TX_META[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: active
                        ? (meta ? `${meta.color}15` : `${LIME}15`)
                        : "hsl(0 0% 9%)",
                      color: active
                        ? (meta ? meta.color : LIME)
                        : DIM,
                      border: active
                        ? `1px solid ${meta ? meta.color : LIME}30`
                        : `1px solid ${BORDER}`,
                    }}
                  >
                    {f} {count > 0 && <span className="opacity-60 ml-0.5">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column headers — desktop */}
          <div
            className="hidden md:grid px-5 py-2.5 text-[10px] font-mono tracking-[0.15em] uppercase"
            style={{
              gridTemplateColumns: "100px 1fr 130px 80px 75px 140px",
              color: DIM,
              borderBottom: `1px solid ${BORDER}`,
              background: CARD2,
            }}
          >
            <span>Type</span>
            <span>Wallet</span>
            <span className="text-right">Amount</span>
            <span>Token</span>
            <span>Time</span>
            <span>Tx Hash</span>
          </div>
          {/* Column headers — mobile */}
          <div
            className="md:hidden grid grid-cols-2 px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase"
            style={{ color: DIM, borderBottom: `1px solid ${BORDER}`, background: CARD2 }}
          >
            <span>Type · Wallet</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Rows */}
          {displayed.length > 0 ? (
            <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
              {displayed.map((event: any, i: number) => (
                <TxRow key={event.id} event={event} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}
              >
                <Activity className="w-5 h-5" style={{ color: DIM }} />
              </div>
              <p className="font-mono text-[13px]" style={{ color: MUTED }}>No activity yet</p>
              <p className="font-mono text-[11px]" style={{ color: DIM }}>
                Interact with the protocol to see transactions appear here
              </p>
            </div>
          )}
        </div>

        {/* ── Network reference strip ── */}
        <div
          className="mt-6 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center"
          style={{ background: CARD2, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: EMERALD }} />
              <span className="font-mono text-[11px] font-bold" style={{ color: EMERALD }}>Testnet</span>
              <span className="font-mono text-[11px]" style={{ color: DIM }}>Chain 46630 · Vault / USDAX</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: VIOLET }} />
              <span className="font-mono text-[11px] font-bold" style={{ color: VIOLET }}>Mainnet</span>
              <span className="font-mono text-[11px]" style={{ color: DIM }}>Chain 4663 · APX Staking</span>
            </div>
          </div>
          {[
            { label: "Testnet Explorer", href: EXPLORER,         val: "explorer.testnet.chain.robinhood.com" },
            { label: "Mainnet Explorer", href: MAINNET_EXPLORER, val: "robinhoodchain.blockscout.com" },
            { label: "RPC",              href: "https://rpc.testnet.chain.robinhood.com/rpc", val: "rpc.testnet.chain.robinhood.com/rpc" },
          ].map((r) => (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
              style={{ color: DIM }}
            >
              <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "hsl(0 0% 35%)" }}>{r.label}</span>
              <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 50%)" }}>{r.val}</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          ))}
          {net?.lastUpdated && (
            <span className="font-mono text-[10px] ml-auto" style={{ color: DIM }}>
              Updated {formatTimeAgoUTC(net.lastUpdated)}
            </span>
          )}
        </div>

      </main>

      {/* ── Footer ── */}
      <footer
        className="py-6 px-8 text-center text-[11px] font-mono"
        style={{ borderTop: `1px solid ${BORDER}`, color: DIM }}
      >
        © 2026 USDAX Finance ·{" "}
        <Link href="/"><span className="hover:underline cursor-pointer">Home</span></Link> ·{" "}
        <Link href="/faucet"><span className="hover:underline cursor-pointer">Faucet</span></Link> ·{" "}
        <Link href="/docs"><span className="hover:underline cursor-pointer">Docs</span></Link> ·{" "}
        <Link href="/app"><span className="hover:underline cursor-pointer">Launch App</span></Link>
      </footer>
    </div>
  );
}
