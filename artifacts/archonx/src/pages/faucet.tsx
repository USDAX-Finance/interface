import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  FlaskConical, Zap, CheckCircle2, Copy, ExternalLink,
  Loader2, ArrowRight, RefreshCw, Wallet, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/privy-auth";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient, createWalletClient, custom, http,
  defineChain, formatUnits, parseUnits,
} from "viem";

/* ─── Design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const AMBER   = "hsl(35 92% 60%)";
const EMERALD = "hsl(152 70% 48%)";
const RED     = "hsl(0 84% 60%)";
const BG      = "hsl(0 0% 4%)";
const BORDER  = "hsl(0 0% 11%)";
const CARD    = "hsl(0 0% 6%)";
const CARD2   = "hsl(0 0% 8%)";
const MUTED   = "hsl(0 0% 40%)";
const DIM     = "hsl(0 0% 28%)";

/* ─── Chain config ─── */
const RPC      = "https://rpc.testnet.chain.robinhood.com/rpc";
const EXPLORER = "https://explorer.testnet.chain.robinhood.com";
const CHAIN_ID = 46630;
const CHAIN_HEX = "0xb626";

const robinhoodTestnet = defineChain({
  id: CHAIN_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "Robinhood Explorer", url: EXPLORER } },
});

/* ─── Token list (confirmed public mint()) ─── */
const TOKENS = [
  {
    id: "weth",
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc" as `0x${string}`,
    decimals: 18,
    claimAmount: parseUnits("1000", 18),
    claimLabel: "1,000 WETH",
    logo: "/weth.png",
    color: LIME,
    desc: "Primary collateral for USDAX vaults",
  },
  {
    id: "wbtc",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    address: "0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34" as `0x${string}`,
    decimals: 8,
    claimAmount: parseUnits("10", 8),
    claimLabel: "10 WBTC",
    logo: "/wbtc.png",
    color: AMBER,
    desc: "Bitcoin-backed vault collateral",
  },
  {
    id: "steth",
    name: "Staked Ether",
    symbol: "stETH",
    address: "0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e" as `0x${string}`,
    decimals: 18,
    claimAmount: parseUnits("1000", 18),
    claimLabel: "1,000 stETH",
    logo: "/steth.png",
    color: EMERALD,
    desc: "Liquid staked ETH collateral",
  },
] as const;

/* ─── Minimal ABI ─── */
const TOKEN_ABI = [
  {
    name: "mint",
    type: "function",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/* ─── Public read client ─── */
const pubClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(RPC, { retryCount: 5, retryDelay: 1_000 }),
  pollingInterval: 2_000,
});

/* ─── Per-token state ─── */
type TxStatus = "idle" | "switching" | "signing" | "pending" | "success" | "error";
interface TokenState {
  status: TxStatus;
  txHash?: string;
  errorMsg?: string;
  balance?: string;
}

/* ─── Helpers ─── */
function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      style={{ color: copied ? LIME : DIM }}
      className="transition-colors ml-1 hover:opacity-80"
      title="Copy address"
    >
      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Step indicator ─── */
function Step({ n, title, desc, active }: { n: string; title: string; desc: string; active?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[11px] mt-0.5"
        style={{
          background: active ? LIME : "hsl(0 0% 10%)",
          color: active ? "hsl(0 0% 4%)" : DIM,
          border: active ? "none" : `1px solid ${BORDER}`,
        }}
      >
        {n}
      </div>
      <div>
        <p className="text-[13px] font-semibold" style={{ color: active ? "hsl(0 0% 88%)" : "hsl(0 0% 45%)" }}>{title}</p>
        <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: DIM }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─── Token card ─── */
function TokenCard({
  token, state, onClaim, onRefresh, walletReady,
}: {
  token: typeof TOKENS[number];
  state: TokenState;
  onClaim: () => void;
  onRefresh: () => void;
  walletReady: boolean;
}) {
  const { status, txHash, errorMsg, balance } = state;
  const busy = status === "switching" || status === "signing" || status === "pending";

  const btnLabel =
    status === "switching" ? "Switching network…" :
    status === "signing"   ? "Confirm in wallet…" :
    status === "pending"   ? "Broadcasting…"      :
    status === "success"   ? "Claim again"         :
    `Claim ${token.claimLabel}`;

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: `${token.color}10`, border: `1px solid ${token.color}20` }}
          >
            <img src={token.logo} alt={token.symbol} className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="font-black text-[15px]" style={{ color: "hsl(0 0% 90%)" }}>{token.symbol}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>{token.name}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-mono px-2.5 py-1 rounded-full"
          style={{ background: `${token.color}10`, color: token.color, border: `1px solid ${token.color}25` }}
        >
          TESTNET
        </span>
      </div>

      {/* Desc */}
      <p className="text-[12px] leading-relaxed" style={{ color: DIM }}>{token.desc}</p>

      {/* Info rows */}
      <div className="space-y-2 text-[12px]" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
        <div className="flex justify-between items-center">
          <span style={{ color: MUTED }}>Contract</span>
          <span className="flex items-center gap-1 font-mono" style={{ color: "hsl(0 0% 55%)" }}>
            {shortAddr(token.address)}
            <CopyBtn text={token.address} />
            <a href={`${EXPLORER}/address/${token.address}`} target="_blank" rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80" style={{ color: DIM }}>
              <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: MUTED }}>Per claim</span>
          <span className="font-bold font-mono" style={{ color: token.color }}>{token.claimLabel}</span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: MUTED }}>Your balance</span>
          <span className="flex items-center gap-1.5 font-mono" style={{ color: "hsl(0 0% 65%)" }}>
            {balance !== undefined
              ? `${parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol}`
              : <span style={{ color: DIM }}>—</span>
            }
            <button onClick={onRefresh} className="transition-opacity hover:opacity-60" style={{ color: DIM }}>
              <RefreshCw className="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>

      {/* Success banner */}
      {status === "success" && txHash && (
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: `${EMERALD}08`, border: `1px solid ${EMERALD}25` }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: EMERALD }} />
          <div>
            <p className="text-[12px] font-semibold" style={{ color: EMERALD }}>Claimed successfully</p>
            <a
              href={`${EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono flex items-center gap-1 mt-0.5 hover:underline"
              style={{ color: DIM }}
            >
              {shortAddr(txHash)} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* Error banner */}
      {status === "error" && errorMsg && (
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: `${RED}08`, border: `1px solid ${RED}25` }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
          <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 84% 75%)" }}>{errorMsg}</p>
        </div>
      )}

      {/* Claim button */}
      <button
        onClick={onClaim}
        disabled={!walletReady || busy}
        className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
        style={{
          background: walletReady && !busy ? token.color : "hsl(0 0% 10%)",
          color: walletReady && !busy ? "hsl(0 0% 4%)" : "hsl(0 0% 35%)",
          cursor: !walletReady || busy ? "not-allowed" : "pointer",
          boxShadow: walletReady && !busy ? `0 0 20px ${token.color}22` : "none",
        }}
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {btnLabel}
      </button>
    </div>
  );
}

/* ─── Page ─── */
export default function Faucet() {
  const { authenticated, address, login } = useAuth();
  const { wallets } = useWallets();

  const [states, setStates] = useState<Record<string, TokenState>>(
    () => Object.fromEntries(TOKENS.map((t) => [t.id, { status: "idle" }]))
  );

  /* ── Balance fetch ── */
  const fetchBalance = useCallback(async (tokenId: string) => {
    if (!address) return;
    const token = TOKENS.find((t) => t.id === tokenId);
    if (!token) return;
    try {
      const raw = await pubClient.readContract({
        address: token.address, abi: TOKEN_ABI, functionName: "balanceOf", args: [address as `0x${string}`],
      });
      const formatted = formatUnits(raw, token.decimals);
      setStates((prev) => ({ ...prev, [tokenId]: { ...prev[tokenId], balance: formatted } }));
    } catch { /* ignore */ }
  }, [address]);

  /* Fetch balances when wallet connects */
  useEffect(() => {
    if (!address) return;
    TOKENS.forEach((t) => fetchBalance(t.id));
  }, [address, fetchBalance]);

  /* ── Mint handler ── */
  const handleClaim = useCallback(async (tokenId: string) => {
    if (!authenticated || !address) { login(); return; }
    const token = TOKENS.find((t) => t.id === tokenId);
    if (!token) return;

    const wallet = wallets[0];
    if (!wallet) { alert("No wallet found. Please connect first."); return; }

    const set = (patch: Partial<TokenState>) =>
      setStates((prev) => ({ ...prev, [tokenId]: { ...prev[tokenId], ...patch } }));

    try {
      /* 1. Switch to Robinhood Chain Testnet */
      set({ status: "switching", errorMsg: undefined, txHash: undefined });
      const provider = await wallet.getEthereumProvider();

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_HEX }],
        });
      } catch (switchErr: unknown) {
        const err = switchErr as { code?: number };
        if (err?.code === 4902 || err?.code === -32603) {
          /* Network not in wallet — add it */
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: CHAIN_HEX,
              chainName: "Robinhood Chain Testnet",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: [RPC],
              blockExplorerUrls: [EXPLORER],
            }],
          });
        } else {
          throw switchErr;
        }
      }

      /* 2. Build wallet client */
      set({ status: "signing" });
      const walletClient = createWalletClient({
        chain: robinhoodTestnet,
        transport: custom(provider),
      });

      /* 3. Send mint() transaction */
      const [account] = await walletClient.requestAddresses();
      const hash = await walletClient.writeContract({
        account,
        address: token.address,
        abi: TOKEN_ABI,
        functionName: "mint",
        args: [address as `0x${string}`, token.claimAmount],
      });

      /* 4. Wait for on-chain confirmation */
      set({ status: "pending", txHash: hash });
      await pubClient.waitForTransactionReceipt({ hash, timeout: 120_000 });

      set({ status: "success", txHash: hash });
      fetchBalance(tokenId);

    } catch (e: unknown) {
      const err = e as { message?: string; shortMessage?: string; code?: number };
      const isTimeout = err?.message?.includes("Timed out") || err?.message?.includes("timed out");
      const msg =
        err?.code === 4001
          ? "Transaction rejected in wallet."
          : isTimeout
            ? "Confirmation timed out; your transaction may have succeeded. Check the explorer with the tx hash above."
            : err?.shortMessage || err?.message?.slice(0, 140) || "Transaction failed.";
      set({ status: "error", errorMsg: msg });
    }
  }, [authenticated, address, login, wallets, fetchBalance]);

  const walletReady = authenticated && !!address;

  return (
    <div className="min-h-screen" style={{ background: BG, color: "hsl(0 0% 88%)" }}>

      {/* ── Top bar ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 sm:px-8 gap-3 sm:gap-4"
        style={{ background: "hsl(0 0% 3% / 0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}` }}
      >
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img src="/favicon.png" alt="USDAX" className="w-7 h-7 rounded flex-shrink-0" />
            <span className="font-bold text-base tracking-tight whitespace-nowrap" style={{ color: "hsl(0 0% 80%)" }}>
              USDAX <span style={{ color: "hsl(0 0% 35%)" }}>finance</span>
            </span>
          </div>
        </Link>
        <div className="flex-1" />
        <Link href="/docs">
          <button
            className="hidden sm:block text-[12px] px-4 py-2 rounded transition-colors"
            style={{ color: "hsl(0 0% 38%)", border: `1px solid ${BORDER}` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 75%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 38%)"; }}
          >
            Docs
          </button>
        </Link>
        {walletReady ? (
          <div
            className="text-[12px] font-mono px-3 py-1.5 rounded flex items-center gap-1.5"
            style={{ color: LIME, border: `1px solid ${LIME}25`, background: `${LIME}08` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: LIME }} />
            {shortAddr(address)}
          </div>
        ) : (
          <button
            onClick={login}
            className="text-[12px] font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded flex items-center gap-1.5"
            style={{ background: LIME, color: "hsl(0 0% 4%)" }}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect </span>Wallet
          </button>
        )}
      </header>

      {/* ── Testnet banner ── */}
      <div
        className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 py-2 px-4 text-[11px] font-mono text-center"
        style={{ background: `${AMBER}10`, borderBottom: `1px solid ${AMBER}25`, color: AMBER }}
      >
        <FlaskConical className="w-3 h-3 flex-shrink-0" />
        <span className="hidden sm:inline tracking-[0.15em]">TESTNET ONLY: ALL TOKENS ARE VALUELESS TEST TOKENS. DO NOT SEND REAL FUNDS</span>
        <span className="sm:hidden">TESTNET ONLY · TEST TOKENS · NO REAL VALUE</span>
      </div>

      <main className="pt-28 pb-24 px-6 max-w-5xl mx-auto">

        {/* ── Hero ── */}
        <div className="mb-14">
          <div
            className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase mb-5 px-3 py-1.5 rounded-full"
            style={{ background: `${AMBER}08`, border: `1px solid ${AMBER}25`, color: AMBER }}
          >
            <FlaskConical className="w-3 h-3" />
            Robinhood Chain Testnet · Chain ID 46630
          </div>
          <h1
            className="font-black uppercase leading-none tracking-tight mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "hsl(0 0% 97%)" }}
          >
            TESTNET<br />
            <span style={{ color: LIME }}>FAUCET</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl" style={{ color: MUTED }}>
            Claim testnet collateral tokens to try USDAX Finance on Robinhood Chain Testnet.
            These are testnet-only assets; no real funds required.
          </p>
        </div>

        {/* ── Steps ── */}
        <div
          className="rounded-2xl p-6 mb-12"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-6" style={{ color: DIM }}>
            Getting Started: 4 Steps
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <Step n="1" title="Add Robinhood Chain Testnet"
              desc="Chain ID 46630 · RPC: rpc.testnet.chain.robinhood.com/rpc · Currency: ETH" />
            <Step n="2" title="Get ETH for gas"
              desc="Visit thirdweb.com/robinhood-chain-testnet for free testnet ETH (transaction fees)" />
            <Step n="3" title="Claim collateral tokens below" active
              desc="Click Claim on each token; confirms in wallet, mints directly to your address" />
            <Step n="4" title="Open a vault, mint USDAX"
              desc="Deposit collateral in the app, borrow USDAX at ≥150% collateral ratio" />
          </div>
          <div className="flex flex-wrap gap-3 mt-6 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
            <a
              href="https://thirdweb.com/robinhood-chain-testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: `${AMBER}12`, color: AMBER, border: `1px solid ${AMBER}25` }}
            >
              <Zap className="w-3.5 h-3.5" /> Get Testnet ETH (Gas)
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-lg transition-colors"
              style={{ color: DIM, border: `1px solid ${BORDER}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 65%)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = DIM; }}
            >
              Block Explorer <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        </div>

        {/* ── Wallet prompt ── */}
        {!walletReady && (
          <div
            className="rounded-2xl p-8 mb-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
            style={{ background: `${LIME}06`, border: `1px solid ${LIME}20` }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${LIME}12`, border: `1px solid ${LIME}25` }}
            >
              <Wallet className="w-6 h-6" style={{ color: LIME }} />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg mb-1" style={{ color: "hsl(0 0% 90%)" }}>
                Connect your wallet to claim
              </p>
              <p className="text-[13px]" style={{ color: MUTED }}>
                MetaMask, Phantom, or any EVM-compatible wallet. The app will prompt you to switch to Robinhood Chain Testnet automatically.
              </p>
            </div>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm flex-shrink-0"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
            >
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          </div>
        )}

        {/* ── Token cards ── */}
        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          {TOKENS.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              state={states[token.id]}
              walletReady={walletReady}
              onClaim={() => handleClaim(token.id)}
              onRefresh={() => fetchBalance(token.id)}
            />
          ))}
        </div>

        {/* ── Network reference ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ background: CARD2, border: `1px solid ${BORDER}` }}
        >
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-4" style={{ color: DIM }}>
            Network Details: Add to Wallet Manually
          </p>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
            {[
              { label: "Network Name",    val: "Robinhood Chain Testnet" },
              { label: "Chain ID",        val: "46630" },
              { label: "RPC URL",         val: "https://rpc.testnet.chain.robinhood.com/rpc" },
              { label: "Explorer",        val: "https://explorer.testnet.chain.robinhood.com" },
              { label: "Currency Symbol", val: "ETH" },
              { label: "Decimals",        val: "18" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center text-[12px] gap-3">
                <span style={{ color: MUTED }}>{r.label}</span>
                <span className="flex items-center gap-1 font-mono text-right" style={{ color: "hsl(0 0% 62%)" }}>
                  {r.val}
                  <CopyBtn text={r.val} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA — open vault ── */}
        <div
          className="rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6"
          style={{ background: `${LIME}05`, border: `1px solid ${LIME}15` }}
        >
          <div className="flex-1 text-center sm:text-left">
            <p className="font-black text-xl mb-2" style={{ color: "hsl(0 0% 92%)" }}>
              Tokens claimed? Open a vault.
            </p>
            <p className="text-[13px]" style={{ color: MUTED }}>
              Deposit WETH, WBTC, or stETH as collateral and mint USDAX at a minimum 150% collateral ratio.
              Earn 4.20% APY in the savings pool.
            </p>
          </div>
          <Link href="/app">
            <button
              className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-xl text-sm flex-shrink-0 transition-all"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${LIME}40`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              <Zap className="w-4 h-4" /> Launch App <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer
        className="py-8 px-8 text-center text-[11px]"
        style={{ borderTop: `1px solid ${BORDER}`, color: DIM }}
      >
        © 2026 USDAX Finance · usdax.finance ·{" "}
        <Link href="/docs"><span className="hover:underline cursor-pointer">Docs</span></Link> ·{" "}
        <Link href="/audit"><span className="hover:underline cursor-pointer">Audit</span></Link> ·{" "}
        <Link href="/terms"><span className="hover:underline cursor-pointer">Terms</span></Link>
      </footer>
    </div>
  );
}
