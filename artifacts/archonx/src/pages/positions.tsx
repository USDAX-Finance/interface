import { useState, useCallback } from "react";
import { HelpButton, HelpModal, HSection, Formula, Badge, RefTable } from "@/components/help-modal";
import {
  useMyPositions, getMyPositionsQueryKey,
  useCreatePosition,
  useMyActivity,
  type PositionInputCollateralToken,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber, formatAddress, formatTimeAgoUTC } from "@/lib/utils";
import { Plus, Layers, Loader2, ExternalLink, Clock } from "lucide-react";
import { useAuth } from "@/contexts/privy-auth";
import { useWallets } from "@privy-io/react-auth";
import { useToast } from "@/hooks/use-toast";
import {
  createPublicClient, createWalletClient, custom, http,
  defineChain, parseUnits,
} from "viem";

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const RED     = "hsl(0 84% 60%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";

/* ─── Chain config (Robinhood Chain Testnet) ─── */
const RPC        = "https://rpc.testnet.chain.robinhood.com/rpc";
const EXPLORER   = "https://explorer.testnet.chain.robinhood.com";
const CHAIN_HEX  = "0xb626";
const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "Robinhood Explorer", url: EXPLORER } },
});

/* ─── Contract addresses ─── */
const VAULT_ENGINE = "0xB5d971d69728B0C31b19A8f184d31813F29EEA20" as `0x${string}`;

/* ─── Token configs ─── */
const TOKEN_CONFIGS: Record<string, { address: `0x${string}`; decimals: number }> = {
  WETH:  { address: "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc", decimals: 18 },
  WBTC:  { address: "0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34", decimals: 8  },
  stETH: { address: "0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e", decimals: 18 },
};

/* ─── Per-token max LTV (basis-point / 100, from VaultEngine) ─── */
const TOKEN_LTV: Record<string, number> = {
  WETH:  80,   // WETH_LTV  = 8000 bps → 80%
  WBTC:  75,   // WBTC_LTV  = 7500 bps → 75%
  stETH: 75,   // STETH_LTV = 7500 bps → 75%
};
const MINT_FEE_PCT = 0.5; // 0.5% mint fee (MINT_FEE_BPS = 50 in VaultEngine)

/* ─── Minimal ABIs ─── */
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "allowance",
    type: "function",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/** Poll on-chain allowance until it reaches `needed` or we give up after ~10 s */
async function waitForAllowance(
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
  needed: bigint,
  maxAttempts = 12,
  intervalMs = 900,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const current = await pubClient.readContract({
      address: token, abi: ERC20_ABI, functionName: "allowance", args: [owner, spender],
    });
    if ((current as bigint) >= needed) return;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  // Give up after timeout — proceed anyway; worst case wallet shows the warning
}

const VAULT_ABI = [
  {
    name: "depositCollateral",
    type: "function",
    inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "mintUsdax",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "repayUsdax",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "withdrawCollateral",
    type: "function",
    inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "debt",
    type: "function",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "collateralDeposits",
    type: "function",
    inputs: [{ name: "", type: "address" }, { name: "", type: "address" }],
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

/* ─── Helper: switch / add chain ─── */
async function ensureChain(provider: any) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
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
    } else throw err;
  }
}

/* ─── Step type for open-vault flow ─── */
type OpenStep = "idle" | "switching" | "approving" | "depositing" | "minting" | "confirming";
const OPEN_STEP_LABEL: Record<OpenStep, string> = {
  idle:       "Open Vault",
  switching:  "Switching network...",
  approving:  "Approving token... (1/3)",
  depositing: "Depositing collateral... (2/3)",
  minting:    "Minting USDAX... (3/3)",
  confirming: "Confirming...",
};

type CloseStep = "idle" | "switching" | "repaying" | "withdrawing";
const CLOSE_STEP_LABEL: Record<CloseStep, string> = {
  idle:       "Close",
  switching:  "Switching...",
  repaying:   "Repaying...",
  withdrawing:"Withdrawing...",
};

/* ─── UI helpers ─── */
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

function HealthBar({ value }: { value: number }) {
  const pct   = Math.min((value / 3) * 100, 100);
  const color = value < 1.0 ? RED : value < 1.5 ? AMBER : EMERALD;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color }}>{formatNumber(value)}x</span>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: `${LIME}12`, border: `1px solid ${LIME}28` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Layers className="w-5 h-5 animate-pulse" style={{ color: LIME }} />
          </div>
        </div>
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 32%)" }}>
          Loading vaults...
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 32%)" }}>
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function Positions() {
  const queryClient      = useQueryClient();
  const { toast }        = useToast();
  const { address, authenticated, login } = useAuth();
  const { wallets }      = useWallets();
  const { data: positions, isLoading } = useMyPositions(address);
  const { data: myActivity }           = useMyActivity(address);

  /* ── DB mutations (record-keeping after on-chain success) ── */
  const createMutation = useCreatePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getMyPositionsQueryKey(address) });
        setIsCreateOpen(false);
      },
    },
  });

  /* ── UI state ── */
  const [isCreateOpen,  setIsCreateOpen]  = useState(false);
  const [createData,    setCreateData]    = useState({ token: "WETH", amount: "", usdax: "" });
  const [openStep,      setOpenStep]      = useState<OpenStep>("idle");
  const [closeSteps,    setCloseSteps]    = useState<Record<number, CloseStep>>({});
  const [showHelp,      setShowHelp]      = useState(false);

  /* ── Price preview (local estimates for health-factor preview only) ── */
  const PREVIEW_PRICES: Record<string, number> = {
    WETH: 3500, WBTC: 97000, stETH: 3480,
  };
  const mockPrice      = PREVIEW_PRICES[createData.token] ?? 1;
  const previewCollVal = Number(createData.amount) * mockPrice;
  const previewUsdax   = Number(createData.usdax);
  const previewHealth  = previewUsdax > 0 ? previewCollVal / previewUsdax : 0;
  const healthColor    = previewHealth < 1 ? RED : previewHealth < 1.5 ? AMBER : EMERALD;
  const ltvPct         = TOKEN_LTV[createData.token] ?? 75;
  const previewMaxUsdax = previewCollVal * (ltvPct / 100);              // max protocol allows
  const safeSuggest    = Math.floor(previewMaxUsdax * 0.50 * 100) / 100; // 50% of max → ~200% ratio
  const maxSuggest     = Math.floor(previewMaxUsdax * 0.95 * 100) / 100; // 95% of max

  /* ── Open Vault: approve → depositCollateral → mintUsdax ── */
  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated || !address) { login(); return; }

    const tokenCfg = TOKEN_CONFIGS[createData.token];
    if (!tokenCfg) return;

    const wallet = wallets[0];
    if (!wallet) {
      toast({ title: "No wallet", description: "Connect a wallet first.", variant: "destructive" });
      return;
    }

    const collateralWei = parseUnits(createData.amount, tokenCfg.decimals);
    const usdaxWei      = parseUnits(createData.usdax, 18);

    // Minimum 10 USDAX (contract MIN_DEBT)
    if (usdaxWei < parseUnits("10", 18)) {
      toast({ title: "Minimum 10 USDAX", description: "The protocol requires at least 10 USDAX per vault.", variant: "destructive" });
      return;
    }

    try {
      /* 1. Switch chain */
      setOpenStep("switching");
      const provider = await wallet.getEthereumProvider();
      await ensureChain(provider);

      const wc        = createWalletClient({ chain: robinhoodTestnet, transport: custom(provider) });
      const [account] = await wc.requestAddresses();

      /* 1b. Balance pre-check — catch insufficient funds before any tx */
      const balance = await pubClient.readContract({
        address: tokenCfg.address, abi: ERC20_ABI, functionName: "balanceOf", args: [account],
      }) as bigint;
      if (balance < collateralWei) {
        const have = Number(balance) / 10 ** tokenCfg.decimals;
        const need = Number(collateralWei) / 10 ** tokenCfg.decimals;
        toast({
          title: `Insufficient ${createData.token}`,
          description: `You have ${have.toFixed(4)} ${createData.token} but need ${need.toFixed(4)}. Claim more from the Faucet.`,
          variant: "destructive",
        });
        setOpenStep("idle");
        return;
      }

      /* 2. Approve collateral token → VaultEngine */
      setOpenStep("approving");
      const approveHash = await wc.writeContract({
        account,
        address: tokenCfg.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT_ENGINE, collateralWei],
      });
      setOpenStep("confirming");
      await pubClient.waitForTransactionReceipt({ hash: approveHash, timeout: 120_000 });

      /* 2b. Wait for allowance to propagate across RPC nodes before depositing.
             Phantom simulates with its own RPC — if it hasn't seen the approve yet,
             safeTransferFrom will revert and show "Network fee: Unavailable". */
      await waitForAllowance(tokenCfg.address, account, VAULT_ENGINE, collateralWei);

      /* 3. Deposit collateral */
      setOpenStep("depositing");
      const depositHash = await wc.writeContract({
        account,
        address: VAULT_ENGINE,
        abi: VAULT_ABI,
        functionName: "depositCollateral",
        args: [tokenCfg.address, collateralWei],
      });
      setOpenStep("confirming");
      await pubClient.waitForTransactionReceipt({ hash: depositHash, timeout: 120_000 });

      /* 4. Mint USDAX */
      setOpenStep("minting");
      const mintHash = await wc.writeContract({
        account,
        address: VAULT_ENGINE,
        abi: VAULT_ABI,
        functionName: "mintUsdax",
        args: [usdaxWei],
      });
      setOpenStep("confirming");
      await pubClient.waitForTransactionReceipt({ hash: mintHash, timeout: 120_000 });

      /* 5. Record in API DB — pass real on-chain tx hashes */
      await createMutation.mutateAsync({
        data: {
          owner:            address.toLowerCase(),
          collateralToken:  createData.token as PositionInputCollateralToken,
          collateralAmount: Number(createData.amount),
          usdaxToMint:      Number(createData.usdax),
          depositTxHash:    depositHash,
          mintTxHash:       mintHash,
        },
      });

      setOpenStep("idle");
      setCreateData({ token: "WETH", amount: "", usdax: "" });
      queryClient.invalidateQueries({ queryKey: getMyPositionsQueryKey(address) });

      toast({
        title: "Vault opened ✓",
        description: (
          <span>
            {createData.amount} {createData.token} deposited · {createData.usdax} USDAX minted.{" "}
            <a
              href={`${EXPLORER}/tx/${mintHash}`}
              target="_blank" rel="noopener noreferrer"
              className="underline"
            >
              View tx
            </a>
          </span>
        ),
      });

    } catch (e: any) {
      setOpenStep("idle");
      const msg =
        e?.code === 4001
          ? "Transaction rejected in wallet."
          : e?.shortMessage || e?.message?.slice(0, 160) || "Transaction failed.";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    }
  }, [authenticated, address, login, wallets, createData, createMutation, queryClient, toast]);

  /* ── Close Vault: repayUsdax → withdrawCollateral ── */
  const handleClose = useCallback(async (posId: number, token: string, collateralAmount: number) => {
    if (!confirm("Close this vault on-chain? This will repay all your USDAX debt and return your collateral.")) return;

    if (!authenticated || !address) { login(); return; }

    const tokenCfg = TOKEN_CONFIGS[token];
    if (!tokenCfg) return;

    const wallet = wallets[0];
    if (!wallet) {
      toast({ title: "No wallet", description: "Connect a wallet first.", variant: "destructive" });
      return;
    }

    const setStep = (s: CloseStep) => setCloseSteps(prev => ({ ...prev, [posId]: s }));

    try {
      /* 1. Switch chain */
      setStep("switching");
      const provider = await wallet.getEthereumProvider();
      await ensureChain(provider);

      const wc        = createWalletClient({ chain: robinhoodTestnet, transport: custom(provider) });
      const [account] = await wc.requestAddresses();

      /* 2. Read on-chain state (source of truth) */
      const [onChainDebt, onChainCollateral] = await Promise.all([
        pubClient.readContract({
          address: VAULT_ENGINE, abi: VAULT_ABI,
          functionName: "debt", args: [account],
        }),
        pubClient.readContract({
          address: VAULT_ENGINE, abi: VAULT_ABI,
          functionName: "collateralDeposits", args: [account, tokenCfg.address],
        }),
      ]);

      /* 3. Repay all USDAX debt */
      let repayHash: `0x${string}` | undefined;
      if ((onChainDebt as bigint) > 0n) {
        setStep("repaying");
        repayHash = await wc.writeContract({
          account,
          address: VAULT_ENGINE,
          abi: VAULT_ABI,
          functionName: "repayUsdax",
          args: [onChainDebt as bigint],
        });
        await pubClient.waitForTransactionReceipt({ hash: repayHash, timeout: 120_000 });
      }

      /* 4. Withdraw all collateral */
      let withdrawHash: `0x${string}` | undefined;
      if ((onChainCollateral as bigint) > 0n) {
        setStep("withdrawing");
        withdrawHash = await wc.writeContract({
          account,
          address: VAULT_ENGINE,
          abi: VAULT_ABI,
          functionName: "withdrawCollateral",
          args: [tokenCfg.address, onChainCollateral as bigint],
        });
        await pubClient.waitForTransactionReceipt({ hash: withdrawHash, timeout: 120_000 });
      }

      /* 5. Mark closed in API DB — pass real on-chain tx hashes as query params */
      const closeParams = new URLSearchParams();
      if (repayHash)    closeParams.set("burnTxHash",   repayHash);
      if (withdrawHash) closeParams.set("redeemTxHash", withdrawHash);
      await fetch(`/api/positions/${posId}?${closeParams.toString()}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getMyPositionsQueryKey(address) });

      setCloseSteps(prev => { const n = { ...prev }; delete n[posId]; return n; });
      toast({ title: "Vault closed ✓", description: `${collateralAmount} ${token} returned to your wallet.` });

    } catch (e: any) {
      setCloseSteps(prev => { const n = { ...prev }; delete n[posId]; return n; });
      const msg =
        e?.code === 4001
          ? "Transaction rejected in wallet."
          : e?.shortMessage || e?.message?.slice(0, 160) || "Transaction failed.";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    }
  }, [authenticated, address, login, wallets, toast, queryClient]);

  if (isLoading) return <LoadingPulse />;

  const dialogStyle = {
    background: "hsl(0 0% 5%)",
    border: `1px solid ${LIME}20`,
  };

  const inputStyle = {
    background: "hsl(0 0% 7%)",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    fontFamily: "var(--font-mono)",
    color: "hsl(0 0% 82%)",
  };

  const isOpening = openStep !== "idle";

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDAX Finance · Vaults
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight flex items-center gap-3">
            Vault <span style={{ color: LIME }}>Manager</span>
            <HelpButton onClick={() => setShowHelp(true)} />
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>
            Deposit collateral → mint USDAX to your wallet → use it anywhere
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(v) => { if (!isOpening) setIsCreateOpen(v); }}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-lg transition-all"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${LIME}30`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              <Plus className="h-4 w-4" /> Open Vault
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]" style={dialogStyle}>
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-base" style={{ color: LIME }}>
                Open Vault
              </DialogTitle>
            </DialogHeader>

            {/* Step indicator */}
            {isOpening && (
              <div className="flex items-center gap-2 text-xs font-mono mt-1" style={{ color: "hsl(0 0% 45%)" }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: LIME }} />
                {OPEN_STEP_LABEL[openStep]}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <FieldGroup label="Collateral Token">
                <Select
                  value={createData.token}
                  onValueChange={(val) => setCreateData({ ...createData, token: val })}
                  disabled={isOpening}
                >
                  <SelectTrigger style={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WETH">WETH</SelectItem>
                    <SelectItem value="WBTC">WBTC</SelectItem>
                    <SelectItem value="stETH">stETH</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Collateral Amount">
                <Input
                  type="number" step="0.000001" required placeholder="0.00"
                  style={inputStyle}
                  disabled={isOpening}
                  value={createData.amount}
                  onChange={(e) => setCreateData({ ...createData, amount: e.target.value })}
                />
              </FieldGroup>
              {/* Max mintable hint shown once collateral amount is entered */}
              {previewCollVal > 0 && (
                <div className="rounded-lg px-3 py-2.5 text-[11px] font-mono flex items-center justify-between"
                  style={{ background: "hsl(0 0% 7%)", border: `1px solid ${BORDER}` }}>
                  <span style={{ color: "hsl(0 0% 38%)" }}>Max mintable ({ltvPct}% LTV)</span>
                  <span className="font-black" style={{ color: LIME }}>
                    {previewMaxUsdax > 0 ? previewMaxUsdax.toFixed(0) : "0"} USDAX
                  </span>
                </div>
              )}

              <FieldGroup label={`USDAX to Mint (0.5% mint fee applies)`}>
                <Input
                  type="number" step="0.01" required placeholder="min 10 USDAX"
                  style={inputStyle}
                  disabled={isOpening}
                  value={createData.usdax}
                  onChange={(e) => setCreateData({ ...createData, usdax: e.target.value })}
                />
                {previewCollVal > 0 && (
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      disabled={isOpening || safeSuggest < 10}
                      onClick={() => setCreateData({ ...createData, usdax: String(safeSuggest) })}
                      className="flex-1 text-[10px] font-mono font-black py-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ background: `${EMERALD}12`, color: EMERALD, border: `1px solid ${EMERALD}25` }}>
                      SAFE ({safeSuggest.toFixed(0)})
                    </button>
                    <button
                      type="button"
                      disabled={isOpening || maxSuggest < 10}
                      onClick={() => setCreateData({ ...createData, usdax: String(maxSuggest) })}
                      className="flex-1 text-[10px] font-mono font-black py-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ background: `${AMBER}10`, color: AMBER, border: `1px solid ${AMBER}25` }}>
                      MAX ({maxSuggest.toFixed(0)})
                    </button>
                  </div>
                )}
                <p className="text-[11px] font-mono mt-1.5" style={{ color: "hsl(152 70% 48% / 0.7)" }}>
                  USDAX is created fresh; you do not need to own any first.
                  A 0.5% fee is taken from the minted amount and funds the savings pool.
                </p>
              </FieldGroup>

              {previewUsdax >= 10 && (
                <div
                  className="relative rounded-lg p-3 flex items-center justify-between overflow-hidden"
                  style={{ background: "hsl(0 0% 7%)", border: `1px solid ${healthColor}22` }}
                >
                  <LBracket size={8} color={`${healthColor}35`} />
                  <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 38%)" }}>Est. Health Factor</span>
                  <span className="font-mono font-black text-sm" style={{ color: healthColor }}>
                    {formatNumber(previewHealth)}x
                  </span>
                </div>
              )}

              <p className="text-[11px] font-mono" style={{ color: "hsl(0 0% 35%)" }}>
                3 wallet signatures required: Approve → Deposit → Mint. Minimum 10 USDAX.
              </p>

              <button
                type="submit"
                className="w-full font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
                disabled={isOpening || (previewUsdax > 0 && previewUsdax < 10) || (previewUsdax > 0 && previewHealth < 1.5)}
              >
                {isOpening && <Loader2 className="w-4 h-4 animate-spin" />}
                {OPEN_STEP_LABEL[openStep]}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Protocol Flow Banner */}
      <div className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "hsl(0 0% 30%)" }}>
          How It Works
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {[
            { step: "1", label: "Get Testnet Tokens", desc: "Claim WETH, WBTC, or stETH from the Faucet for free", color: LIME,    href: "/faucet" },
            { step: "2", label: "Open a Vault",       desc: "Deposit collateral → the protocol mints USDAX to your wallet", color: EMERALD, href: null },
            { step: "3", label: "Earn with Yield",    desc: "Deposit USDAX into Savings to earn 4.20% APY", color: AMBER,   href: "/app/yield" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-start gap-3 flex-1 min-w-0">
              {i > 0 && (
                <div className="hidden sm:block text-[18px] font-black self-center flex-shrink-0" style={{ color: "hsl(0 0% 18%)" }}>
                  {">"}
                </div>
              )}
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-black text-[11px]"
                  style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                  {s.step}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-[12px] mb-0.5" style={{ color: "hsl(0 0% 82%)" }}>{s.label}</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: "hsl(0 0% 38%)" }}>{s.desc}</div>
                  {s.href && (
                    <a href={s.href} className="text-[10px] font-mono mt-1 inline-block transition-opacity hover:opacity-70"
                      style={{ color: s.color }}>
                      Go to {s.label.split(" ").slice(-1)[0]} →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-mono" style={{ borderTop: `1px solid ${BORDER}`, color: "hsl(0 0% 32%)" }}>
          <span>Mint fee: <span style={{ color: "hsl(0 0% 55%)" }}>0.5%</span> on each vault</span>
          <span>This fee funds the <span style={{ color: LIME }}>4.20% APY</span> in the Yield savings pool</span>
          <span>To close a vault: repay USDAX debt first, then collateral is returned</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
      <div className="relative rounded-xl overflow-hidden" style={{ background: CARD_BG, minWidth: 560 }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: BORDER }} className="hover:bg-transparent">
              {["ID", "Collateral", "Debt (USDAX)", "Health Factor", "Status", ""].map((h) => (
                <TableHead
                  key={h}
                  className={`font-mono text-[10px] tracking-widest uppercase ${h === "" ? "text-right" : ""}`}
                  style={{ color: "hsl(0 0% 28%)" }}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions?.map((pos) => {
              const closeStep = closeSteps[pos.id] ?? "idle";
              const isClosing = closeStep !== "idle";
              return (
                <TableRow
                  key={pos.id}
                  style={{ borderColor: BORDER }}
                  className="hover:bg-white/[0.015] transition-colors"
                >
                  <TableCell className="font-mono text-sm font-black" style={{ color: `${LIME}90` }}>
                    #{pos.id}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div style={{ color: "hsl(0 0% 82%)" }}>{formatNumber(pos.collateralAmount, 4)} {pos.collateralToken}</div>
                    <div className="text-xs mt-0.5" style={{ color: "hsl(0 0% 32%)" }}>{formatCurrency(pos.collateralValueUsd)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div style={{ color: "hsl(0 0% 82%)" }}>{formatNumber(pos.usdaxMinted, 2)}</div>
                    <div className="text-xs mt-0.5" style={{ color: "hsl(0 0% 32%)" }}>{formatNumber(pos.collateralRatio, 1)}% ratio</div>
                  </TableCell>
                  <TableCell className="w-36">
                    <HealthBar value={pos.healthFactor} />
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={
                        pos.status === "active"
                          ? { background: `${EMERALD}12`, color: EMERALD, border: `1px solid ${EMERALD}25` }
                          : { background: "hsl(0 0% 10%)", color: "hsl(0 0% 38%)", border: "1px solid hsl(0 0% 14%)" }
                      }
                    >
                      {pos.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 flex items-center gap-1.5 ml-auto"
                      style={{ border: `1px solid ${RED}30`, color: isClosing ? AMBER : RED, background: `${RED}08` }}
                      disabled={pos.status !== "active" || isClosing}
                      onClick={() => handleClose(pos.id, pos.collateralToken, pos.collateralAmount)}
                    >
                      {isClosing && <Loader2 className="w-3 h-3 animate-spin" />}
                      {isClosing ? CLOSE_STEP_LABEL[closeStep] : "Close Vault"}
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
            {positions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `${LIME}08`, border: `1px dashed ${LIME}20` }}>
                      <Layers className="w-6 h-6" style={{ color: "hsl(0 0% 42%)" }} />
                    </div>
                    <div className="text-center">
                      <div className="font-black text-[15px] mb-1" style={{ color: "hsl(0 0% 42%)" }}>
                        No vaults open yet
                      </div>
                      <div className="font-mono text-[12px]" style={{ color: "hsl(0 0% 44%)" }}>
                        Deposit collateral and mint USDAX to open your first vault
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      {/* ── My Transaction History ── */}
      {authenticated && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: CARD_BG }}>
          {/* header */}
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 38%)" }} />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "hsl(0 0% 38%)" }}>
                My Transactions
              </span>
            </div>
            {myActivity && myActivity.length > 0 && (
              <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 30%)" }}>
                {myActivity.length} events
              </span>
            )}
          </div>

          {/* body */}
          {!myActivity || myActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Clock className="w-5 h-5" style={{ color: "hsl(0 0% 22%)" }} />
              <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 30%)" }}>
                No transactions yet
              </span>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {myActivity.map((ev) => {
                const typeColors: Record<string, string> = {
                  MINT:      LIME,
                  DEPOSIT:   EMERALD,
                  BURN:      RED,
                  REDEEM:    AMBER,
                  STAKE:     EMERALD,
                  UNSTAKE:   AMBER,
                  CLAIM:     LIME,
                  LIQUIDATE: RED,
                };
                const accent = typeColors[ev.type] ?? "hsl(0 0% 55%)";
                return (
                  <div key={ev.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    {/* left: badge + amount */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0"
                        style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}28` }}
                      >
                        {ev.type}
                      </span>
                      <span className="font-mono text-sm font-semibold truncate" style={{ color: "hsl(0 0% 88%)" }}>
                        {ev.type === "MINT" || ev.type === "BURN" || ev.type === "CLAIM"
                          ? `${formatNumber(ev.amount, 2)} ${ev.token}`
                          : `${formatNumber(ev.amount, 4)} ${ev.token}`}
                      </span>
                    </div>

                    {/* right: tx hash + time */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {ev.txHash ? (
                        <a
                          href={`${EXPLORER}/tx/${ev.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-[11px] transition-opacity hover:opacity-70"
                          style={{ color: "hsl(0 0% 40%)" }}
                        >
                          {formatAddress(ev.txHash)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 25%)" }}>—</span>
                      )}
                      <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 28%)" }}>
                        {formatTimeAgoUTC(ev.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Vault Guide Modal ── */}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} title="Vault Guide: How to Open a CDP">
        <HSection title="What is a Vault?">
          <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
            A Vault is a <strong style={{ color: "hsl(0 0% 90%)" }}>Collateralized Debt Position (CDP)</strong>.
            You lock collateral (WETH, WBTC, or stETH) and mint USDAX against it.
            As long as your collateral value stays above the minimum ratio, your vault is safe.
          </p>
        </HSection>
        <HSection title="Collateral Ratio Formula">
          <Formula>{`C-Ratio = (Collateral Amount × Token Price)
          ÷ USDAX Minted × 100%

Minimum required : 150%   ← liquidated below this
Recommended      : 200%+  ← safe zone
Ideal for testing: 250%   ← comfortable buffer`}</Formula>
        </HSection>
        <HSection title="On-Chain Oracle Prices (testnet)">
          <RefTable
            headers={["Token", "Price", "Decimals"]}
            rows={[
              ["WETH",  "$2,000",  "18"],
              ["WBTC",  "$65,000", "8"],
              ["stETH", "$1,980",  "18"],
            ]}
          />
        </HSection>
        <HSection title="Recommended Test: 1 WETH">
          <Formula>{`Deposit  :  1 WETH
Mint     :  800 USDAX   ← recommended

Verify   :  (1 × $2,000) ÷ 800 × 100% = 250% ✅`}</Formula>
        </HSection>
        <HSection title="Quick Reference (1 WETH = $2,000)">
          <RefTable
            headers={["USDAX to Mint", "C-Ratio", "Status"]}
            rows={[
              ["500 USDAX",   "400%", <Badge color="hsl(79 100% 57%)">Very Safe</Badge>],
              ["800 USDAX",   "250%", <Badge color="hsl(79 100% 57%)">✅ Recommended</Badge>],
              ["1,000 USDAX", "200%", <Badge color="hsl(79 100% 57%)">Safe</Badge>],
              ["1,200 USDAX", "167%", <Badge color="hsl(35 92% 60%)">⚠ Caution</Badge>],
              ["1,333 USDAX", "150%", <Badge color="hsl(0 84% 60%)">🔴 Minimum</Badge>],
            ]}
          />
        </HSection>
        <HSection title="Step-by-Step">
          <div className="space-y-1.5 text-[12px]" style={{ color: "hsl(0 0% 60%)" }}>
            {[
              ["1", "Click 'Open Vault' button top-right"],
              ["2", "Select collateral token (WETH recommended)"],
              ["3", "Enter amount: 1 WETH"],
              ["4", "Enter USDAX to mint: 800"],
              ["5", "Tx 1: Approve token spend → Confirm in wallet"],
              ["6", "Tx 2: Deposit + Mint → Confirm in wallet"],
              ["7", "Wait ~15s → vault appears with SAFE 250% label"],
            ].map(([n, s]) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="font-mono font-black text-[10px] w-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(79 100% 57%)" }}>{n}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </HSection>
        <HSection title="To Close a Vault">
          <Formula>{`Tx 1 : Approve USDAX repayment
Tx 2 : Repay debt → collateral returned to wallet

⚠ You must hold at least the same USDAX amount
  you minted in order to repay and close the vault.`}</Formula>
        </HSection>
      </HelpModal>
    </div>
  );
}
