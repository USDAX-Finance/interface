import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStakingStats,
  getGetStakingStatsQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/privy-auth";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient, createWalletClient, custom, http,
  defineChain, parseUnits, formatUnits,
} from "viem";
import {
  TrendingUp, Users, Coins, Zap, Clock,
  ArrowDownRight, ChevronRight, ExternalLink,
  Loader2, AlertTriangle, Globe, CheckCircle2, Info,
} from "lucide-react";

/* ─── Chain config (mainnet 4663) ─── */
const MAINNET_RPC     = "https://rpc.mainnet.chain.robinhood.com/rpc";
const MAINNET_EXPLORER   = "https://explorer.chain.robinhood.com";
const BLOCKSCOUT_EXPLORER = "https://robinhoodchain.blockscout.com";
const MAINNET_HEX     = "0x1237"; // 4663

const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [MAINNET_RPC] } },
  blockExplorers: { default: { name: "Explorer", url: MAINNET_EXPLORER } },
});

/* ─── Contract addresses ─── */
const APX_TOKEN   = "0x42523E3e454B97ff8651926685aFAD61C950Ab2F" as `0x${string}`;
const APX_STAKING = "0x00b6792ac02caf607d0b6ea4a6f572a83472412f" as `0x${string}`;

/* ─── ABIs ─── */
const ERC20_ABI = [
  { name: "approve",   type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256" }] },
] as const;

const STAKING_ABI = [
  { name: "stake",           type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "startCooldown",   type: "function", stateMutability: "nonpayable",
    inputs: [], outputs: [] },
  { name: "unstake",         type: "function", stateMutability: "nonpayable",
    inputs: [], outputs: [] },
  { name: "claimRewards",    type: "function", stateMutability: "nonpayable",
    inputs: [], outputs: [] },
  { name: "emergencyWithdraw", type: "function", stateMutability: "nonpayable",
    inputs: [], outputs: [] },
  { name: "stakers",         type: "function", stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "staked",             type: "uint256" },
      { name: "cooldownAmount",     type: "uint256" },
      { name: "rewardPerTokenPaid", type: "uint256" },
      { name: "rewards",            type: "uint256" },
      { name: "cooldownEnd",        type: "uint256" },
    ] },
  { name: "earned",          type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "rewardsPool",     type: "function", stateMutability: "view",
    inputs: [], outputs: [{ type: "uint256" }] },
] as const;

/* ─── Public client ─── */
const pubClient = createPublicClient({
  chain: robinhoodMainnet,
  transport: http(MAINNET_RPC, { retryCount: 4, retryDelay: 1_200 }),
  pollingInterval: 4_000,
});

/* ─── Network switch ─── */
async function ensureMainnet(provider: any) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MAINNET_HEX }],
    });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: MAINNET_HEX,
          chainName: "Robinhood Chain",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [MAINNET_RPC],
          blockExplorerUrls: [MAINNET_EXPLORER],
        }],
      });
    } else throw err;
  }
}

/* ─── Design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const AMBER   = "hsl(35 92% 60%)";
const RED     = "hsl(0 84% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG2= "hsl(0 0% 8%)";

/* ─── Types ─── */
interface OnChainPosition {
  staked: bigint;
  cooldownAmount: bigint;
  rewardPerTokenPaid: bigint;
  rewards: bigint;
  cooldownEnd: bigint;
  earned: bigint;
  apxBalance: bigint;
  rewardsPool: bigint;
}

/* ─── Helpers ─── */
function fmt(wei: bigint, decimals = 2): string {
  return formatNumber(Number(formatUnits(wei, 18)), decimals);
}

function fmtCountdown(cooldownEnd: bigint): string {
  const now   = BigInt(Math.floor(Date.now() / 1000));
  const diff  = cooldownEnd - now;
  if (diff <= 0n) return "Ready";
  const d = Number(diff / 86400n);
  const h = Number((diff % 86400n) / 3600n);
  const m = Number((diff % 3600n) / 60n);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

function txLink(hash: string) {
  return `${MAINNET_EXPLORER}/tx/${hash}`;
}

/* ─── Atoms ─── */
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

function StatCard({ label, value, sub, Icon, color }: {
  label: string; value: string; sub: string;
  Icon: React.ElementType; color: string;
}) {
  return (
    <div className="relative rounded-xl p-5 overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <LBracket color={`${color}20`} />
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>{label}</span>
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

/* ─── APY Card with tooltip ─── */
function ApyCard({ apyDisplay, totalStaked, rewardPerYear = 1_000_000 }: {
  apyDisplay: number; totalStaked: number; rewardPerYear?: number;
}) {
  const [show, setShow] = useState(false);

  /* Format APY value — show actual if ≤ 9,999%, cap + note if higher */
  const APY_CAP = 9_999;
  const apyIsHigh = apyDisplay > APY_CAP;
  const apyStr = apyDisplay === 0
    ? "0%"
    : apyIsHigh
      ? `>${APY_CAP.toLocaleString()}%`
      : `${apyDisplay.toFixed(1)}%`;

  /* Projection table */
  const projections = [
    { staked: 10_000,     label: "10K APX" },
    { staked: 100_000,    label: "100K APX" },
    { staked: 1_000_000,  label: "1M APX" },
    { staked: 10_000_000, label: "10M APX" },
  ].map(r => ({
    label: r.label,
    apy: ((rewardPerYear / r.staked) * 100).toFixed(1),
  }));

  return (
    <div className="relative rounded-xl p-5 overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <LBracket color={`${EMERALD}20`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>
          Effective APY
        </span>
        <div className="flex items-center gap-1.5">
          {/* Info button */}
          <button
            onClick={() => setShow(v => !v)}
            className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
            style={{ background: show ? `${EMERALD}20` : "transparent", color: show ? EMERALD : "hsl(0 0% 35%)" }}
            title="How is APY calculated?">
            <Info className="w-3 h-3" />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${EMERALD}12`, border: `1px solid ${EMERALD}20` }}>
            <TrendingUp className="h-3.5 w-3.5" style={{ color: EMERALD }} />
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="font-black text-2xl font-mono mb-1" style={{ color: EMERALD }}>{apyStr}</div>
      <div className="text-[11px] font-mono" style={{ color: "hsl(0 0% 30%)" }}>
        {apyDisplay === 0
          ? "Dynamic · decreases as TVL grows"
          : apyIsHigh
            ? `Early pool · ${totalStaked.toLocaleString()} APX staked`
            : `Live · ${totalStaked.toLocaleString()} APX staked`}
      </div>

      {/* Tooltip panel */}
      {show && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-xl p-4 shadow-2xl"
          style={{ background: "hsl(0 0% 7%)", border: `1px solid ${EMERALD}30`, top: 0 }}>
          <div className="flex items-start justify-between mb-3">
            <span className="font-black text-[11px] uppercase tracking-widest" style={{ color: EMERALD }}>
              How APY works
            </span>
            <button onClick={() => setShow(false)} className="text-[18px] leading-none" style={{ color: "hsl(0 0% 40%)" }}>×</button>
          </div>

          <p className="text-[11px] leading-relaxed mb-3" style={{ color: "hsl(0 0% 50%)" }}>
            APY = Annual rewards ÷ Total staked
            <br />
            <span style={{ color: "hsl(0 0% 65%)" }}>
              1,000,000 APX/yr ÷ {totalStaked > 0 ? `${totalStaked.toLocaleString()} APX` : "..."}
              {totalStaked > 0 && ` = ${apyStr}`}
            </span>
          </p>

          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            APY projections
          </p>
          <div className="space-y-1">
            {projections.map(p => (
              <div key={p.label} className="flex justify-between text-[11px] font-mono">
                <span style={{ color: "hsl(0 0% 45%)" }}>at {p.label} staked</span>
                <span style={{ color: "hsl(0 0% 70%)" }}>{Number(p.apy) > APY_CAP ? `>${APY_CAP.toLocaleString()}%` : `${p.apy}%`}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: "hsl(0 0% 30%)" }}>
            APY auto-adjusts every block. Higher when fewer stake.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Network Banner ─── */
function MainnetBanner() {
  return (
    <div className="relative rounded-xl overflow-hidden px-5 py-4"
      style={{ background: `${EMERALD}06`, border: `1px solid ${EMERALD}30` }}>
      <LBracket color={`${EMERALD}25`} />
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${EMERALD}12`, border: `1px solid ${EMERALD}30` }}>
          <Globe className="w-3.5 h-3.5" style={{ color: EMERALD }} />
        </div>
        <div>
          <div className="font-black text-[13px] mb-0.5" style={{ color: EMERALD }}>
            Staking runs on Robinhood Chain Mainnet (4663)
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 48%)" }}>
            Your wallet will be prompted to switch to mainnet when you interact.
            Vault &amp; Yield remain on Testnet (46630).
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── DexScreener live price hook ─── */
const DS_PAIR = "0x8c82ce618f1fcd05aa0499a231410f0f659bef2d";
const DS_URL  = `https://api.dexscreener.com/latest/dex/pairs/robinhood/${DS_PAIR}`;

interface ApxPrice {
  priceUsd:   number;
  change24h:  number;
  vol24h:     number;
  marketCap:  number;
  liquidity:  number;
}

function useApxPrice() {
  const [data, setData]       = useState<ApxPrice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      try {
        const res = await fetch(DS_URL);
        const json = await res.json();
        const p = json?.pairs?.[0];
        if (!p || cancelled) return;
        setData({
          priceUsd:  parseFloat(p.priceUsd  ?? "0"),
          change24h: parseFloat(p.priceChange?.h24 ?? "0"),
          vol24h:    p.volume?.h24    ?? 0,
          marketCap: p.marketCap      ?? 0,
          liquidity: p.liquidity?.usd ?? 0,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch_();
    const id = setInterval(fetch_, 30_000); // refresh every 30s
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { data, loading };
}

/* ─── APX Price Ticker ─── */
const DEXSCREENER_URL = "https://dexscreener.com/robinhood/0x8c82ce618f1fcd05aa0499a231410f0f659bef2d";
const GMGN_URL        = "https://gmgn.ai/robinhood/token/0x42523e3e454b97ff8651926685afad61c950ab2f";

function ApxPriceTicker() {
  const { data, loading } = useApxPrice();

  const fmtPrice = (n: number) =>
    n < 0.001
      ? `$${n.toFixed(8)}`
      : `$${n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;

  const fmtUsd = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(0)}`;

  const up   = (data?.change24h ?? 0) >= 0;
  const chgColor = up ? EMERALD : RED;

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Left: token identity */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <img src="/apx-logo.png" alt="APX" className="w-7 h-7 rounded-full object-cover" />
        <div>
          <span className="font-black text-sm tracking-tight" style={{ color: "hsl(0 0% 90%)" }}>APX</span>
          <span className="font-mono text-[10px] ml-1.5" style={{ color: "hsl(0 0% 35%)" }}>Robinhood Chain</span>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-7 self-center" style={{ background: BORDER }} />

      {/* Price + change */}
      <div className="flex items-baseline gap-2">
        <span className="font-black text-lg font-mono" style={{ color: loading ? "hsl(0 0% 30%)" : LIME }}>
          {loading ? "···" : fmtPrice(data!.priceUsd)}
        </span>
        {!loading && data && (
          <span className="font-mono text-xs font-bold" style={{ color: chgColor }}>
            {up ? "▲" : "▼"} {Math.abs(data.change24h).toFixed(2)}%
          </span>
        )}
      </div>

      {/* Stats row */}
      {!loading && data && (
        <>
          <div className="hidden sm:block w-px h-7 self-center" style={{ background: BORDER }} />
          <div className="flex gap-4 flex-wrap">
            {[
              { l: "Market Cap", v: fmtUsd(data.marketCap) },
              { l: "Vol 24h",    v: fmtUsd(data.vol24h)    },
              { l: "Liquidity",  v: fmtUsd(data.liquidity)  },
            ].map(({ l, v }) => (
              <div key={l}>
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "hsl(0 0% 30%)" }}>{l}</p>
                <p className="font-mono text-[12px] font-bold" style={{ color: "hsl(0 0% 72%)" }}>{v}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Links — pushed right */}
      <div className="sm:ml-auto flex items-center gap-2 flex-shrink-0">
        <a
          href={DEXSCREENER_URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
          style={{ background: "hsl(0 0% 10%)", color: "hsl(0 0% 65%)", border: `1px solid ${BORDER}` }}
        >
          <ExternalLink className="w-3 h-3" />
          DexScreener
        </a>
        <a
          href={GMGN_URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
          style={{ background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}25` }}
        >
          <ExternalLink className="w-3 h-3" />
          GMGN
        </a>
      </div>
    </div>
  );
}

/* ─── ROI Calculator ─── */
function RoiCalculator({ apy }: { apy: number }) {
  const [amount, setAmount] = useState("");
  const apx     = parseFloat(amount) || 0;
  const daily   = apx * (apy / 100) / 365;
  const monthly = daily * 30;
  const yearly  = apx * (apy / 100);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="rounded-xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "hsl(0 0% 30%)" }}>
        ◈ APX ROI Calculator · {apy > 0 ? `${apy.toFixed(1)}% APY` : "APY loading…"}
      </div>
      <div className="flex gap-3 items-end mb-4 max-w-xs">
        <div className="flex-1">
          <label className="block font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: "hsl(0 0% 30%)" }}>
            APX to Stake
          </label>
          <div className="relative">
            <Input
              type="number" min="0" step="any" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{
                background: "hsl(0 0% 7%)", height: 44, fontSize: 15,
                fontFamily: "var(--font-mono)", fontWeight: 700,
                border: `1px solid ${amount ? LIME + "40" : BORDER}`,
                color: "hsl(0 0% 86%)", paddingRight: 48,
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[11px]" style={{ color: LIME }}>APX</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Daily",   val: daily   },
          { label: "Monthly", val: monthly },
          { label: "Yearly",  val: yearly  },
        ] as const).map(({ label, val }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: "hsl(0 0% 7%)", border: `1px solid ${BORDER}` }}>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "hsl(0 0% 35%)" }}>{label}</p>
            <p className="font-black text-base font-mono" style={{ color: apx > 0 ? LIME : "hsl(0 0% 28%)" }}>
              {apx > 0 ? fmt(val) : "—"}
            </p>
            <p className="text-[10px] mt-0.5 font-mono" style={{ color: "hsl(0 0% 35%)" }}>APX</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Action Panel ─── */
function ActionPanel({
  pos, address, loading, onStake, onStartCooldown, onUnstake, onClaim, onEmergencyWithdraw,
}: {
  pos: OnChainPosition | null;
  address: string;
  loading: boolean;
  onStake: (amount: string) => Promise<void>;
  onStartCooldown: () => Promise<void>;
  onUnstake: () => Promise<void>;
  onClaim: () => Promise<void>;
  onEmergencyWithdraw: () => Promise<void>;
}) {
  const { toast }              = useToast();
  const [tab, setTab]          = useState<"stake" | "unstake">("stake");
  const [amount, setAmount]    = useState("");
  const [busy, setBusy]        = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const now   = BigInt(Math.floor(Date.now() / 1000));
  const hasCooldown   = pos ? pos.cooldownEnd > 0n : false;
  const cooldownReady = pos ? (pos.cooldownEnd > 0n && pos.cooldownEnd <= now) : false;
  const hasStaked     = pos ? pos.staked > 0n : false;
  const hasRewards    = pos ? pos.earned > 0n : false;

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); }
    catch (err: any) {
      const msg = err?.shortMessage ?? err?.details ?? err?.message ?? "Transaction failed or was rejected";
      toast({ title: "❌ Transaction failed", description: msg, variant: "destructive" });
    }
    finally { setBusy(false); }
  };

  const accent = tab === "stake" ? LIME : AMBER;
  const isLocked = !address;

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${accent}22` }}>
      <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `${accent}50` }} />
      <LBracket color={`${accent}25`} />

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {(["stake", "unstake"] as const).map((t) => {
          const a = t === "stake" ? LIME : AMBER;
          const active = tab === t;
          return (
            <button key={t} onClick={() => { setTab(t); setAmount(""); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all"
              style={{
                color:       active ? a : "hsl(0 0% 28%)",
                background:  active ? `${a}08` : "transparent",
                borderBottom: active ? `2px solid ${a}` : "2px solid transparent",
              }}>
              {t === "stake"
                ? <><Zap className="w-3 h-3" /> Stake</>
                : <><ArrowDownRight className="w-3 h-3" /> Unstake</>}
            </button>
          );
        })}
      </div>

      <div className="p-5">

        {/* ── STAKE TAB ── */}
        {tab === "stake" && (
          <>
            <p className="text-[11px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 35%)" }}>
              Deposit APX to earn APX rewards. Minimum 1 APX. Rewards accrue every block.
              {pos && pos.apxBalance > 0n && (
                <span style={{ color: "hsl(0 0% 50%)" }}>
                  {" "}Wallet: <strong style={{ color: LIME }}>{fmt(pos.apxBalance)} APX</strong>
                </span>
              )}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-1.5"
                  style={{ color: "hsl(0 0% 30%)" }}>Amount (APX)</label>
                <div className="relative">
                  <Input
                    type="number" min="1" step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-12"
                    style={{
                      background: CARD_BG2, borderRadius: "10px",
                      border: `1px solid ${amount ? LIME + "40" : BORDER}`,
                      fontFamily: "var(--font-mono)", fontSize: "15px",
                      fontWeight: 700, color: "hsl(0 0% 86%)", height: "44px",
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[11px]"
                    style={{ color: LIME }}>APX</span>
                </div>
                {pos && amount && Number(amount) > Number(formatUnits(pos.apxBalance, 18)) && (
                  <p className="text-[10px] mt-1 font-mono" style={{ color: RED }}>
                    Insufficient balance
                  </p>
                )}
              </div>

              {pos && amount && (
                <div className="rounded-lg px-3 py-2 text-[11px] font-mono"
                  style={{ background: `${LIME}06`, border: `1px solid ${LIME}15` }}>
                  <div className="flex justify-between">
                    <span style={{ color: "hsl(0 0% 40%)" }}>You send</span>
                    <span style={{ color: LIME }}>{amount} APX (approve → stake)</span>
                  </div>
                </div>
              )}

              <button
                disabled={!address || busy || !amount || Number(amount) <= 0}
                onClick={() => wrap(() => onStake(amount))}
                className="w-full font-black py-3 rounded-xl text-[13px] tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${LIME}28`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : "Approve & Stake APX"}
              </button>

              {!address && (
                <p className="text-center text-[11px] font-mono mt-2" style={{ color: "hsl(0 0% 36%)" }}>
                  Connect wallet to stake
                </p>
              )}
            </div>
          </>
        )}

        {/* ── UNSTAKE TAB ── */}
        {tab === "unstake" && (
          <div className="space-y-4">

            {/* State: nothing staked and no cooldown */}
            {!hasStaked && !hasCooldown && (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}>
                  <Coins className="w-4 h-4" style={{ color: "hsl(0 0% 42%)" }} />
                </div>
                <p className="font-mono text-[12px]" style={{ color: "hsl(0 0% 45%)" }}>
                  No active stake to withdraw
                </p>
              </div>
            )}

            {/* State: staked, no cooldown yet */}
            {hasStaked && !hasCooldown && pos && (
              <>
                <div className="rounded-xl p-4" style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}>
                  <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 30%)" }}>
                    Currently Staked
                  </div>
                  <div className="font-black text-xl font-mono" style={{ color: "hsl(0 0% 92%)" }}>
                    {fmt(pos.staked)} <span className="text-sm font-bold" style={{ color: "hsl(0 0% 50%)" }}>APX</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: `${AMBER}08`, border: `1px solid ${AMBER}20` }}>
                  <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: AMBER }} />
                  <p className="text-[10px] font-mono leading-relaxed" style={{ color: AMBER }}>
                    Starting cooldown moves your APX out of rewards accrual immediately. Cannot be cancelled.
                    After 7 days, return here to complete the withdrawal.
                  </p>
                </div>

                <button
                  disabled={busy}
                  onClick={() => wrap(onStartCooldown)}
                  className="w-full font-black py-3 rounded-xl text-[13px] tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: `${AMBER}14`, color: AMBER, border: `1px solid ${AMBER}35` }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : "Start 7-Day Cooldown"}
                </button>
              </>
            )}

            {/* State: cooldown active, not ready */}
            {hasCooldown && !cooldownReady && pos && (
              <>
                <div className="rounded-xl p-4" style={{ background: `${AMBER}06`, border: `1px solid ${AMBER}20` }}>
                  <div className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: AMBER }}>
                    Cooldown In Progress
                  </div>
                  <div className="font-black text-lg font-mono mb-1" style={{ color: "hsl(0 0% 86%)" }}>
                    {fmt(pos.cooldownAmount)} APX
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 flex-shrink-0" style={{ color: AMBER }} />
                    <span className="font-mono text-[11px]" style={{ color: AMBER }}>
                      {fmtCountdown(pos.cooldownEnd)}
                    </span>
                  </div>
                </div>
                <button disabled className="w-full font-black py-3 rounded-xl text-[13px] opacity-40 cursor-not-allowed"
                  style={{ background: `${AMBER}14`, color: AMBER, border: `1px solid ${AMBER}35` }}>
                  Complete Unstake: Waiting for Cooldown
                </button>
              </>
            )}

            {/* State: cooldown complete, ready to unstake */}
            {hasCooldown && cooldownReady && pos && (
              <>
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: `${EMERALD}06`, border: `1px solid ${EMERALD}25` }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: EMERALD }} />
                  <div>
                    <div className="font-black text-[13px] mb-0.5" style={{ color: EMERALD }}>Cooldown Complete</div>
                    <div className="font-mono text-[12px]" style={{ color: "hsl(0 0% 72%)" }}>
                      {fmt(pos.cooldownAmount)} APX ready to withdraw
                    </div>
                  </div>
                </div>

                <button
                  disabled={busy}
                  onClick={() => wrap(onUnstake)}
                  className="w-full font-black py-3 rounded-xl text-[13px] tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: EMERALD, color: "hsl(0 0% 4%)" }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...</> : "Withdraw APX"}
                </button>
              </>
            )}

            {/* ── INSTANT WITHDRAW (Emergency) — shown whenever user has any position ── */}
            {(hasStaked || hasCooldown) && pos && (
              <div className="mt-2 pt-3" style={{ borderTop: `1px solid hsl(0 0% 10%)` }}>
                <button
                  onClick={() => setShowEmergency(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-mono transition-colors"
                  style={{ background: `${RED}08`, border: `1px solid ${RED}20`, color: RED }}>
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Instant Withdraw (Emergency)
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${showEmergency ? "rotate-90" : ""}`} />
                </button>

                {showEmergency && (
                  <div className="mt-2 rounded-xl p-4 space-y-3"
                    style={{ background: `${RED}06`, border: `1px solid ${RED}25` }}>

                    {/* Amount info */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 36%)" }}>
                        You will receive
                      </span>
                      <span className="font-black font-mono text-[14px]" style={{ color: "hsl(0 0% 88%)" }}>
                        {fmt(pos.staked + pos.cooldownAmount)} APX
                      </span>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg"
                      style={{ background: `${RED}10`, border: `1px solid ${RED}30` }}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: RED }} />
                      <p className="text-[10px] font-mono leading-relaxed" style={{ color: RED }}>
                        <strong>Unclaimed rewards will be permanently forfeited.</strong>{" "}
                        Only your staked principal is returned. Rewards are NOT included.
                        This action cannot be undone.
                      </p>
                    </div>

                    {/* Pending rewards if any */}
                    {pos.earned > 0n && (
                      <div className="flex items-center justify-between px-1">
                        <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 36%)" }}>Rewards forfeited</span>
                        <span className="font-mono text-[11px] font-bold" style={{ color: RED }}>
                          −{fmt(pos.earned, 4)} APX
                        </span>
                      </div>
                    )}

                    <button
                      disabled={busy}
                      onClick={() => wrap(onEmergencyWithdraw)}
                      className="w-full font-black py-2.5 rounded-xl text-[12px] tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: `${RED}18`, color: RED, border: `1px solid ${RED}40` }}>
                      {busy
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                        : <><AlertTriangle className="w-3.5 h-3.5" /> Withdraw Now (Forfeit Rewards)</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CLAIM REWARDS (always shown if pending) ── */}
        {hasRewards && pos && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-0.5" style={{ color: "hsl(0 0% 30%)" }}>
                  Pending Rewards
                </div>
                <div className="font-black font-mono text-lg" style={{ color: LIME }}>
                  +{fmt(pos.earned, 4)} APX
                </div>
              </div>
              <button
                disabled={busy}
                onClick={() => wrap(onClaim)}
                className="flex items-center gap-1.5 font-black text-[12px] px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `${LIME}12`, color: LIME, border: `1px solid ${LIME}28` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${LIME}20`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3 h-3" /> Claim</>}
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          {[
            { l: "Cooldown", v: "7 days" }, { l: "Reward Token", v: "APX" },
            { l: "Min. Stake",  v: "1 APX"   }, { l: "Fee", v: "0%" },
          ].map((r) => (
            <div key={r.l}>
              <div className="font-mono text-[9px] tracking-widest uppercase mb-0.5" style={{ color: "hsl(0 0% 42%)" }}>{r.l}</div>
              <div className="font-bold text-[11px] font-mono" style={{ color: "hsl(0 0% 62%)" }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Position Summary Card ─── */
function PositionCard({ pos }: { pos: OnChainPosition }) {
  const now   = BigInt(Math.floor(Date.now() / 1000));
  const hasCooldown   = pos.cooldownEnd > 0n;
  const cooldownReady = hasCooldown && pos.cooldownEnd <= now;
  const hasStaked     = pos.staked > 0n;
  const hasRewards    = pos.earned > 0n;
  const isEmpty       = !hasStaked && !hasCooldown && !hasRewards;

  if (isEmpty) {
    return (
      <div className="relative rounded-xl overflow-hidden h-full flex flex-col items-center justify-center py-16 gap-3"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <LBracket color={`${LIME}15`} />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}>
          <Coins className="w-4 h-4" style={{ color: "hsl(0 0% 42%)" }} />
        </div>
        <p className="font-mono text-[12px]" style={{ color: "hsl(0 0% 45%)" }}>No active position</p>
        <p className="font-mono text-[11px]" style={{ color: "hsl(0 0% 32%)" }}>Stake APX to start earning</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${LIME}20` }}>
      <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `${LIME}40` }} />
      <LBracket color={`${LIME}20`} />

      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>
            Your Position
          </span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full"
            style={{
              background: hasCooldown ? `${AMBER}12` : `${EMERALD}12`,
              color:       hasCooldown ? AMBER : EMERALD,
              border:      `1px solid ${hasCooldown ? AMBER : EMERALD}25`,
            }}>
            {hasCooldown ? (cooldownReady ? "Ready to Withdraw" : "Cooling Down") : "Active"}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Staked */}
        {hasStaked && (
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 30%)" }}>
              Staked (accruing rewards)
            </div>
            <div className="font-black text-2xl font-mono" style={{ color: "hsl(0 0% 92%)" }}>
              {fmt(pos.staked)} <span className="text-sm font-bold" style={{ color: "hsl(0 0% 45%)" }}>APX</span>
            </div>
          </div>
        )}

        {/* Cooldown */}
        {hasCooldown && (
          <div className="rounded-lg px-4 py-3"
            style={{ background: `${AMBER}08`, border: `1px solid ${AMBER}20` }}>
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: AMBER }}>
              In Cooldown
            </div>
            <div className="font-black text-xl font-mono" style={{ color: "hsl(0 0% 86%)" }}>
              {fmt(pos.cooldownAmount)} APX
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-3 h-3" style={{ color: AMBER }} />
              <span className="font-mono text-[11px]" style={{ color: AMBER }}>
                {fmtCountdown(pos.cooldownEnd)}
              </span>
            </div>
          </div>
        )}

        {/* Pending rewards */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "14px" }}>
          <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 30%)" }}>
            Pending Rewards
          </div>
          <div className="font-black text-xl font-mono" style={{ color: hasRewards ? LIME : "hsl(0 0% 30%)" }}>
            +{fmt(pos.earned, 4)} <span className="text-sm font-bold" style={{ color: "hsl(0 0% 45%)" }}>APX</span>
          </div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color: "hsl(0 0% 30%)" }}>
            {hasStaked ? "Accruing in real-time" : "Claim available"}
          </div>
        </div>

        {/* Wallet balance */}
        {pos.apxBalance > 0n && (
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "14px" }}>
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 30%)" }}>
              Wallet Balance
            </div>
            <div className="font-bold font-mono text-base" style={{ color: "hsl(0 0% 55%)" }}>
              {fmt(pos.apxBalance)} APX
            </div>
          </div>
        )}

        {/* Pool info */}
        {pos.rewardsPool > 0n && (
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "14px" }}>
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 30%)" }}>
              Rewards Pool
            </div>
            <div className="font-bold font-mono text-sm" style={{ color: "hsl(0 0% 45%)" }}>
              {fmt(pos.rewardsPool, 0)} APX remaining
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ROOT ─── */
export default function Staking() {
  const queryClient    = useQueryClient();
  const { toast }      = useToast();
  const { authenticated, login } = useAuth();
  const { wallets }    = useWallets();

  /* ── Active address: query eth_accounts from MetaMask directly so we always
     track the CURRENT selected account, not Privy's cached address which goes
     stale when the user switches MetaMask accounts.
     Falls back to embedded wallet if no external wallet is connected.        */
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const externalWallet = wallets.find(w => (w as any).connectorType !== "embedded") ?? wallets[0];
    if (!externalWallet) { setAddress(""); return; }

    let active = true;

    externalWallet.getEthereumProvider().then(provider => {
      if (!active) return;

      /* Get current active account */
      (provider.request({ method: "eth_accounts" }) as Promise<string[]>)
        .then(accts => { if (active) setAddress(accts[0] ?? externalWallet.address ?? ""); })
        .catch(() => { if (active) setAddress(externalWallet.address ?? ""); });

      /* Stay in sync when user switches MetaMask account */
      const onChanged = (accts: string[]) => { if (active) setAddress(accts[0] ?? ""); };
      (provider as any).on?.("accountsChanged", onChanged);

      return () => { (provider as any).removeListener?.("accountsChanged", onChanged); };
    });

    return () => { active = false; };
  }, [wallets]);

  const { data: stats, isLoading: statsLoading } = useGetStakingStats({ query: { queryKey: getGetStakingStatsQueryKey(), refetchInterval: 15_000 } });

  const [pos,     setPos]     = useState<OnChainPosition | null>(null);
  const [posLoading, setPosLoading] = useState(false);

  /* ── On-chain position reader ── */
  const refreshPos = useCallback(async () => {
    if (!address) { setPos(null); return; }
    const addr = address as `0x${string}`;
    try {
      const [stakerResult, earned, apxBalance, rewardsPool] = await Promise.all([
        pubClient.readContract({ address: APX_STAKING, abi: STAKING_ABI, functionName: "stakers", args: [addr] }),
        pubClient.readContract({ address: APX_STAKING, abi: STAKING_ABI, functionName: "earned",  args: [addr] }),
        pubClient.readContract({ address: APX_TOKEN,   abi: ERC20_ABI,   functionName: "balanceOf", args: [addr] }),
        pubClient.readContract({ address: APX_STAKING, abi: STAKING_ABI, functionName: "rewardsPool", args: [] }),
      ]);
      /* viem may return named object or positional array depending on ABI encoding —
         handle both to be safe. */
      const s = stakerResult as any;
      setPos({
        staked:             s.staked             ?? s[0] ?? 0n,
        cooldownAmount:     s.cooldownAmount     ?? s[1] ?? 0n,
        rewardPerTokenPaid: s.rewardPerTokenPaid ?? s[2] ?? 0n,
        rewards:            s.rewards            ?? s[3] ?? 0n,
        cooldownEnd:        s.cooldownEnd        ?? s[4] ?? 0n,
        earned:      earned      as bigint,
        apxBalance:  apxBalance  as bigint,
        rewardsPool: rewardsPool as bigint,
      });
    } catch (_) { /* RPC may fail intermittently */ }
  }, [address]);

  /* Poll every 8s */
  useEffect(() => {
    if (!address) { setPos(null); return; }
    setPosLoading(true);
    refreshPos().finally(() => setPosLoading(false));
    const id = setInterval(refreshPos, 8_000);
    return () => clearInterval(id);
  }, [address, refreshPos]);

  /* ── Wallet client helper ── */
  const getWC = useCallback(async () => {
    /* Use the same activeWallet logic — external (MetaMask) first, embedded fallback */
    const wallet = wallets.find(w => (w as any).connectorType !== "embedded") ?? wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    const provider = await wallet.getEthereumProvider();
    await ensureMainnet(provider);
    return {
      wc: createWalletClient({ chain: robinhoodMainnet, transport: custom(provider) }),
      account: wallet.address as `0x${string}`,
    };
  }, [wallets]);

  /* ── Stake ── */
  const handleStake = useCallback(async (amountStr: string) => {
    const { wc, account } = await getWC();
    const amount = parseUnits(amountStr, 18);

    toast({ title: "Step 1/2: Approving APX…", description: "Confirm in wallet" });
    const approveTx = await wc.writeContract({
      account, address: APX_TOKEN, abi: ERC20_ABI,
      functionName: "approve", args: [APX_STAKING, amount],
    });
    await pubClient.waitForTransactionReceipt({ hash: approveTx, timeout: 60_000 });

    toast({ title: "Step 2/2: Staking APX…", description: "Confirm in wallet" });
    const stakeTx = await wc.writeContract({
      account, address: APX_STAKING, abi: STAKING_ABI,
      functionName: "stake", args: [amount],
    });
    await pubClient.waitForTransactionReceipt({ hash: stakeTx, timeout: 60_000 });

    toast({
      title: "✅ Staked successfully",
      description: (
        <a href={txLink(stakeTx)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 underline" style={{ color: LIME }}>
          View tx <ExternalLink className="w-3 h-3" />
        </a>
      ),
    });

    /* Record in DB (fire-and-forget — don't block UI) */
    fetch(`${import.meta.env.BASE_URL}api/staking/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: account.toLowerCase(),
        amount: Number(formatUnits(amount, 18)),
        type: "STAKE",
        stakeTxHash: stakeTx,
      }),
    }).catch(() => { /* non-critical */ });

    await Promise.all([refreshPos(), queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() })]);
  }, [getWC, refreshPos, queryClient, toast]);

  /* ── Activity recorder (fire-and-forget) ── */
  const recordEvent = useCallback((type: "STAKE" | "UNSTAKE" | "CLAIM" | "COOLDOWN" | "EMERGENCY", account: string, amount: number, txHash: string) => {
    fetch(`${import.meta.env.BASE_URL}api/staking/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: account.toLowerCase(), type, amount, txHash }),
    }).catch(() => { /* non-critical */ });
  }, []);

  /* ── Start Cooldown ── */
  const handleStartCooldown = useCallback(async () => {
    const { wc, account } = await getWC();
    /* Capture staked amount before tx — after cooldown starts, staked becomes 0 */
    const coolingAmount = pos ? Number(formatUnits(pos.staked, 18)) : 0;
    toast({ title: "Starting cooldown…", description: "Confirm in wallet" });
    const tx = await wc.writeContract({
      account, address: APX_STAKING, abi: STAKING_ABI, functionName: "startCooldown", args: [],
    });
    await pubClient.waitForTransactionReceipt({ hash: tx, timeout: 60_000 });
    toast({
      title: "⏳ Cooldown started: 7 days",
      description: (
        <a href={txLink(tx)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 underline" style={{ color: AMBER }}>
          View tx <ExternalLink className="w-3 h-3" />
        </a>
      ),
    });
    recordEvent("COOLDOWN", account, coolingAmount, tx);
    await refreshPos();
  }, [getWC, refreshPos, toast, recordEvent, pos]);

  /* ── Unstake ── */
  const handleUnstake = useCallback(async () => {
    const { wc, account } = await getWC();
    /* Capture cooldownAmount BEFORE tx — contract zeroes it on success */
    const cooledAmount = pos ? Number(formatUnits(pos.cooldownAmount, 18)) : 0;
    toast({ title: "Withdrawing APX…", description: "Confirm in wallet" });
    const tx = await wc.writeContract({
      account, address: APX_STAKING, abi: STAKING_ABI, functionName: "unstake", args: [],
    });
    await pubClient.waitForTransactionReceipt({ hash: tx, timeout: 60_000 });
    toast({
      title: "✅ APX withdrawn to wallet",
      description: (
        <a href={txLink(tx)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 underline" style={{ color: EMERALD }}>
          View tx <ExternalLink className="w-3 h-3" />
        </a>
      ),
    });
    recordEvent("UNSTAKE", account, cooledAmount, tx);
    await Promise.all([refreshPos(), queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() })]);
  }, [getWC, refreshPos, queryClient, toast, recordEvent, pos]);

  /* ── Emergency Withdraw (instant, forfeits unclaimed rewards) ── */
  const handleEmergencyWithdraw = useCallback(async () => {
    const { wc, account } = await getWC();
    /* Capture total principal before tx */
    const totalAmt = pos ? Number(formatUnits(pos.staked + pos.cooldownAmount, 18)) : 0;
    toast({ title: "⚡ Instant Withdraw…", description: "Confirm in wallet, rewards will be forfeited" });
    const tx = await wc.writeContract({
      account, address: APX_STAKING, abi: STAKING_ABI, functionName: "emergencyWithdraw", args: [],
    });
    await pubClient.waitForTransactionReceipt({ hash: tx, timeout: 60_000 });
    toast({
      title: "✅ APX returned to wallet",
      description: (
        <a href={txLink(tx)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 underline" style={{ color: RED }}>
          View tx <ExternalLink className="w-3 h-3" />
        </a>
      ),
    });
    recordEvent("EMERGENCY", account, totalAmt, tx);
    await Promise.all([refreshPos(), queryClient.invalidateQueries({ queryKey: getGetStakingStatsQueryKey() })]);
  }, [getWC, refreshPos, queryClient, toast, recordEvent, pos]);

  /* ── Claim ── */
  const handleClaim = useCallback(async () => {
    const { wc, account } = await getWC();
    /* Read pending rewards before claiming so we can record the exact amount */
    let pendingAmt = 0;
    try {
      const earned = await pubClient.readContract({
        address: APX_STAKING, abi: STAKING_ABI, functionName: "earned", args: [account as `0x${string}`],
      });
      pendingAmt = Number(formatUnits(earned as bigint, 18));
    } catch (_) { /* use 0 if read fails */ }

    toast({ title: "Claiming rewards…", description: "Confirm in wallet" });
    const tx = await wc.writeContract({
      account, address: APX_STAKING, abi: STAKING_ABI, functionName: "claimRewards", args: [],
    });
    await pubClient.waitForTransactionReceipt({ hash: tx, timeout: 60_000 });
    toast({
      title: "✅ APX rewards claimed",
      description: (
        <a href={txLink(tx)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 underline" style={{ color: LIME }}>
          View tx <ExternalLink className="w-3 h-3" />
        </a>
      ),
    });
    recordEvent("CLAIM", account, pendingAmt, tx);
    await refreshPos();
  }, [getWC, refreshPos, toast, recordEvent]);

  if (statsLoading) return <LoadingPulse />;

  const totalStakedAmt = stats?.totalStaked    ?? 0;
  const apyDisplay     = stats?.effectiveApy   ?? 0;
  const rewardsDay     = stats?.rewardRatePerDay ?? 0;
  const stakers        = stats?.activeStakers  ?? 0;

  /* APY display — cap at 9,999% (valid math, just early-staker phase) */
  const APY_CAP = 9_999;
  const apyIsHigh = apyDisplay > APY_CAP;
  const apyStr = apyDisplay === 0
    ? "0%"
    : apyIsHigh
      ? `>${APY_CAP.toLocaleString()}%`
      : `${apyDisplay.toFixed(1)}%`;
  const apySub = apyDisplay === 0
    ? "Dynamic · rises as pool fills"
    : apyIsHigh
      ? `Early staker · ${totalStakedAmt.toLocaleString()} APX staked`
      : `Live · ${totalStakedAmt.toLocaleString()} APX staked`;

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Mainnet notice */}
      <MainnetBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDAX Finance · APX Staking · Mainnet
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
            APX <span style={{ color: LIME }}>Staking</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>
            Stake APX · Earn APX · 10M reward pool funded
          </p>
        </div>

        {!authenticated && (
          <button
            onClick={login}
            className="font-black text-[13px] px-5 py-2.5 rounded-xl"
            style={{ background: LIME, color: "hsl(0 0% 4%)" }}>
            Connect Wallet
          </button>
        )}
      </div>

      {/* APX Live Price */}
      <ApxPriceTicker />

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Staked"
          value={totalStakedAmt > 0 ? `${totalStakedAmt.toLocaleString()} APX` : "0 APX"}
          sub="Across all stakers"
          Icon={Coins} color={LIME}
        />
        <ApyCard
          apyDisplay={apyDisplay}
          totalStaked={totalStakedAmt}
        />
        <StatCard
          label="Reward Rate"
          value={`${rewardsDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} APX`}
          sub="Per day · 1M APX/year"
          Icon={Zap} color={LIME}
        />
        <StatCard
          label="Active Stakers"
          value={String(stakers)}
          sub="On Robinhood Mainnet"
          Icon={Users} color={EMERALD}
        />
      </div>

      {/* ROI Calculator */}
      <RoiCalculator apy={apyDisplay} />

      {/* Body: action + position */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Action panel */}
        <div className="lg:col-span-1">
          <ActionPanel
            pos={pos}
            address={address}
            loading={posLoading}
            onStake={handleStake}
            onStartCooldown={handleStartCooldown}
            onUnstake={handleUnstake}
            onClaim={handleClaim}
            onEmergencyWithdraw={handleEmergencyWithdraw}
          />
        </div>

        {/* Position card */}
        <div className="lg:col-span-2 min-h-[300px]">
          {!authenticated ? (
            <div className="relative rounded-xl overflow-hidden h-full flex flex-col items-center justify-center py-16 gap-4"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <LBracket color={`${LIME}15`} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${LIME}08`, border: `1px solid ${LIME}20` }}>
                <Coins className="w-5 h-5" style={{ color: "hsl(0 0% 50%)" }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-[14px] mb-1" style={{ color: "hsl(0 0% 70%)" }}>Connect to view your position</p>
                <p className="font-mono text-[11px]" style={{ color: "hsl(0 0% 35%)" }}>Your on-chain staking data will appear here</p>
              </div>
              <button onClick={login} className="font-black text-[13px] px-5 py-2.5 rounded-xl"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}>
                Connect Wallet
              </button>
            </div>
          ) : posLoading && !pos ? (
            <div className="relative rounded-xl overflow-hidden h-full flex items-center justify-center py-16"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: LIME }} />
            </div>
          ) : pos ? (
            <PositionCard pos={pos} />
          ) : null}
        </div>
      </div>

      {/* Contract links + live activity */}
      <div className="flex flex-wrap gap-4 pt-2 items-center">
        {[
          { label: "APXStaking Contract", addr: APX_STAKING },
          { label: "APX Token",           addr: APX_TOKEN   },
        ].map((c) => (
          <a key={c.addr} href={`${MAINNET_EXPLORER}/address/${c.addr}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] transition-colors"
            style={{ color: "hsl(0 0% 30%)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 60%)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(0 0% 30%)")}>
            <ExternalLink className="w-3 h-3" />
            {c.label}: {c.addr.slice(0, 8)}…{c.addr.slice(-6)}
          </a>
        ))}

        {/* Blockscout: live staker tx feed */}
        <a href={`${BLOCKSCOUT_EXPLORER}/address/${APX_STAKING}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] transition-colors ml-auto"
          style={{ color: LIME, opacity: 0.75 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}>
          <ExternalLink className="w-3 h-3" />
          View all staker transactions ↗
        </a>
      </div>
    </div>
  );
}
