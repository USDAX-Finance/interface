import { useState, useCallback } from "react";
import { HelpButton, HelpModal, HSection, Formula, Badge, RefTable } from "@/components/help-modal";
import {
  useListLiquidations, useExecuteLiquidation, getListLiquidationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber, formatAddress, formatCompact } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/privy-auth";
import { useWallets } from "@privy-io/react-auth";
import { Crosshair, AlertOctagon, Zap, TrendingDown, Shield, Loader2 } from "lucide-react";
import {
  createPublicClient, createWalletClient, custom, http,
  defineChain, parseUnits,
} from "viem";

/* ─── Chain config ─── */
const RPC       = "https://rpc.testnet.chain.robinhood.com/rpc";
const EXPLORER  = "https://explorer.testnet.chain.robinhood.com";
const CHAIN_HEX = "0xb626";
const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "Robinhood Explorer", url: EXPLORER } },
});

/* ─── Contract addresses ─── */
const VAULT_ENGINE = "0xB5d971d69728B0C31b19A8f184d31813F29EEA20" as `0x${string}`;
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  WETH:  "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc",
  WBTC:  "0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34",
  stETH: "0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e",
};

const VAULT_ABI = [
  {
    name: "liquidate",
    type: "function",
    inputs: [
      { name: "vaultOwner", type: "address" },
      { name: "debtToRepay", type: "uint256" },
      { name: "collToken",   type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const pubClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(RPC, { retryCount: 5, retryDelay: 1_000 }),
  pollingInterval: 2_000,
});

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

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const RED     = "hsl(0 84% 60%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG2= "hsl(0 0% 8%)";


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

function HealthPill({ value }: { value: number }) {
  const critical = value < 1.0;
  const warning  = value < 1.2;
  const color    = critical ? RED : warning ? AMBER : LIME;
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-xs font-black"
      style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}
    >
      {critical && <AlertOctagon className="h-3 w-3 animate-pulse" />}
      {formatNumber(value)}x
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: `${RED}12`, border: `1px solid ${RED}28` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Crosshair className="w-5 h-5 animate-pulse" style={{ color: RED }} />
          </div>
        </div>
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse" style={{ color: "hsl(0 0% 32%)" }}>
          Scanning targets...
        </div>
      </div>
    </div>
  );
}

type LiqStep = "idle" | "switching" | "liquidating" | "confirming";

export default function Liquidations() {
  const queryClient  = useQueryClient();
  const { toast }    = useToast();
  const { address, authenticated, login } = useAuth();
  const { wallets }  = useWallets();
  const { data: targets, isLoading } = useListLiquidations();

  const liquidateMutation = useExecuteLiquidation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLiquidationsQueryKey() });
        setTargetPosition(null);
      },
    },
  });

  const [targetPosition, setTargetPosition] = useState<number | null>(null);
  const [debtToCover,    setDebtToCover]     = useState("");
  const [liqStep,        setLiqStep]         = useState<LiqStep>("idle");
  const [showHelp,       setShowHelp]        = useState(false);

  const handleLiquidate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPosition) return;

    const selectedTarget = targets?.find((t) => t.positionId === targetPosition);
    if (!selectedTarget) return;

    if (!authenticated || !address) { login(); return; }

    const wallet = wallets[0];
    if (!wallet) {
      toast({ title: "No wallet", description: "Connect a wallet first.", variant: "destructive" });
      return;
    }

    const tokenAddress = TOKEN_ADDRESSES[selectedTarget.collateralToken];
    if (!tokenAddress) {
      toast({ title: "Unsupported token", description: selectedTarget.collateralToken, variant: "destructive" });
      return;
    }

    const debtWei = parseUnits(debtToCover, 18);

    try {
      /* 1. Switch chain */
      setLiqStep("switching");
      const provider = await wallet.getEthereumProvider();
      await ensureChain(provider);

      const wc = createWalletClient({ chain: robinhoodTestnet, transport: custom(provider) });
      const [account] = await wc.requestAddresses();

      /* 2. Call VaultEngine.liquidate() — no approval needed (VaultEngine burns USDAX directly) */
      setLiqStep("liquidating");
      const txHash = await wc.writeContract({
        account,
        address: VAULT_ENGINE,
        abi: VAULT_ABI,
        functionName: "liquidate",
        args: [selectedTarget.owner as `0x${string}`, debtWei, tokenAddress],
      });

      setLiqStep("confirming");
      await pubClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });

      /* 3. Update DB via API — pass real on-chain tx hash */
      await liquidateMutation.mutateAsync({
        data: { positionId: targetPosition, liquidator: address, debtToCover: Number(debtToCover), txHash },
      });

      setLiqStep("idle");
      toast({
        title: "Liquidation executed ✓",
        description: (
          <span>
            Seized collateral + 10% bonus.{" "}
            <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">
              View tx
            </a>
          </span>
        ),
      });

    } catch (e: any) {
      setLiqStep("idle");
      const msg = e?.code === 4001 ? "Rejected in wallet." : e?.shortMessage || e?.message?.slice(0, 160) || "Transaction failed.";
      toast({ title: "Liquidation failed", description: msg, variant: "destructive" });
    }
  }, [targetPosition, targets, authenticated, address, login, wallets, debtToCover, liquidateMutation, toast]);

  if (isLoading) return <LoadingPulse />;

  const selectedTarget = targets?.find((t) => t.positionId === targetPosition);
  const criticalCount  = targets?.filter((t) => t.healthFactor < 1.0).length ?? 0;

  const inputStyle = {
    background: "hsl(0 0% 7%)",
    border: `1px solid ${RED}35`,
    borderRadius: "8px",
    fontFamily: "var(--font-mono)",
    color: "hsl(0 0% 82%)",
  };

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDAX Finance · Liquidations
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${RED}12`, border: `1px solid ${RED}28` }}
            >
              <Crosshair className="h-5 w-5 animate-pulse" style={{ color: RED }} />
            </div>
            <span>
              Liquidation{" "}
              <span style={{ color: RED }}>Hunter</span>
            </span>
            <HelpButton onClick={() => setShowHelp(true)} />
          </h1>
          <p className="text-sm mt-1 ml-12" style={{ color: "hsl(0 0% 38%)" }}>
            Repay underwater debt · earn 5% collateral bonus
          </p>
        </div>

        {criticalCount > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: `${RED}08`, border: `1px solid ${RED}28`, color: RED }}
          >
            <AlertOctagon className="h-4 w-4 animate-pulse" />
            {criticalCount} critical position{criticalCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: TrendingDown, label: "Liquidation Threshold", value: "HF < 1.0", color: RED     },
          { icon: Zap,          label: "Bonus for Liquidators",  value: "+5%",      color: EMERALD },
          { icon: Shield,       label: "Max Per Liquidation",    value: "100% of debt", color: LIME },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="relative rounded-xl p-4 flex items-center gap-4 overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <LBracket size={8} color={`${c.color}20`} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${c.color}12`, border: `1px solid ${c.color}22` }}>
                <Icon className="h-5 w-5" style={{ color: c.color }} />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 28%)" }}>{c.label}</div>
                <div className="font-black font-mono text-lg" style={{ color: c.color }}>{c.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Liquidation Guide Modal ── */}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} title="Liquidation Guide: How to Hunt Vaults" accent="hsl(0 84% 60%)">
        <HSection title="What is a Liquidation?">
          <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
            When a vault&apos;s Health Factor drops below <strong style={{ color: "hsl(0 84% 60%)" }}>1.0</strong>, it is
            eligible for liquidation. Anyone can repay part of the borrower&apos;s USDAX debt
            and receive their collateral at a <strong style={{ color: "hsl(79 100% 57%)" }}>5% discount</strong>.
            No USDAX approval needed; VaultEngine burns directly from your wallet.
          </p>
        </HSection>
        <HSection title="Health Factor Formula">
          <Formula>{`Health Factor (HF) =
  (Collateral Value × Liquidation Threshold)
  ÷ USDAX Debt

HF ≥ 1.0  →  SAFE, cannot be liquidated
HF < 1.0  →  UNDERWATER, open for liquidation

Example (WETH, liqThreshold = 85%):
  Collateral : 1 WETH × $3,250 × 0.85 = $2,762.50
  Debt       : 3,000 USDAX
  HF         = $2,762.50 ÷ $3,000 = 0.921 → LIQUIDATABLE`}</Formula>
        </HSection>
        <HSection title="Liquidator Profit Formula">
          <Formula>{`You repay   : X USDAX of the borrower's debt
You receive : Collateral worth (X × 105%)
Your profit : 5% of X in collateral value

Example: repay 500 USDAX:
  You receive collateral worth $525
  Your profit: ~$25 per tx`}</Formula>
        </HSection>
        <HSection title="Rules & Limits">
          <RefTable
            headers={["Parameter", "Value"]}
            rows={[
              ["Trigger threshold",     "HF < 1.0"],
              ["Max debt per call",     "100% of total vault debt"],
              ["Liquidator bonus",      "+5% collateral value"],
              ["USDAX approval needed", "No; VaultEngine burns directly"],
              ["Who can liquidate",     "Any connected wallet"],
            ]}
          />
        </HSection>
        <HSection title="Step-by-Step">
          <div className="space-y-1.5 text-[12px]" style={{ color: "hsl(0 0% 60%)" }}>
            {[
              ["1", "Wait for a vault to appear in this table (HF < 1.0)"],
              ["2", "Click 'Liquidate' on the target row"],
              ["3", "Enter USDAX to repay (up to 100% of their debt)"],
              ["4", "Click 'Execute Liquidation'"],
              ["5", "1 on-chain tx: VaultEngine.liquidate() then confirm in wallet"],
              ["6", "Collateral + 5% bonus arrives in your wallet automatically"],
            ].map(([n, s]) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="font-mono font-black text-[10px] w-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(0 84% 60%)" }}>{n}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </HSection>
        <HSection title="When Will Targets Appear?">
          <p className="text-[12px] leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
            Prices are set on-chain by the protocol oracle (WETH ~$3,250, WBTC ~$97,000, stETH ~$3,190).
            A vault becomes liquidatable when its Health Factor falls below 1.0. For example,
            a WETH vault minting <strong style={{ color: "hsl(0 0% 85%)" }}>2,762 USDAX</strong> against 1 WETH ($3,250)
            is at HF = 1.0 exactly (liquidation edge).
          </p>
        </HSection>
      </HelpModal>

      {/* Targets table */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: BORDER }} className="hover:bg-transparent">
              {["#", "Owner", "Collateral", "Debt (USDAX)", "Health", "Bonus", ""].map((h) => (
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
            {targets?.map((target) => {
              const critical = target.healthFactor < 1.0;
              return (
                <TableRow
                  key={target.positionId}
                  style={{
                    borderColor: BORDER,
                    background: critical ? `${RED}04` : undefined,
                  }}
                  className="hover:bg-white/[0.015] transition-colors"
                >
                  <TableCell className="font-mono text-sm font-black" style={{ color: critical ? RED : `${LIME}90` }}>
                    #{target.positionId}
                  </TableCell>
                  <TableCell className="font-mono text-xs" style={{ color: "hsl(0 0% 35%)" }}>
                    {formatAddress(target.owner)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div style={{ color: "hsl(0 0% 82%)" }}>{formatNumber(target.collateralAmount, 4)} {target.collateralToken}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "hsl(0 0% 30%)" }}>{formatCurrency(target.collateralValueUsd)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-bold" style={{ color: AMBER }}>
                    {formatNumber(target.usdaxDebt, 2)} USDAX
                  </TableCell>
                  <TableCell>
                    <HealthPill value={target.healthFactor} />
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-mono font-black px-2 py-0.5 rounded-md"
                      style={{ background: `${EMERALD}12`, color: EMERALD, border: `1px solid ${EMERALD}25` }}
                    >
                      +{formatCompact(target.liquidationBonus)} USDAX
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="text-xs font-black px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: `${RED}12`,
                        color: RED,
                        border: `1px solid ${RED}30`,
                        boxShadow: critical ? `0 0 12px ${RED}20` : undefined,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${RED}22`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${RED}12`; }}
                      onClick={() => {
                        setTargetPosition(target.positionId);
                        setDebtToCover(target.maxLiquidatable.toString());
                      }}
                    >
                      Execute
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
            {targets?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center font-mono text-sm" style={{ color: "hsl(0 0% 48%)" }}>
                  No liquidatable targets. All positions are healthy
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={targetPosition !== null} onOpenChange={(open) => !open && setTargetPosition(null)}>
        <DialogContent
          className="sm:max-w-[440px]"
          style={{
            background: "hsl(0 0% 5%)",
            border: `1px solid ${RED}30`,
            boxShadow: `0 0 48px ${RED}10`,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black uppercase" style={{ color: RED }}>
              <Crosshair className="h-5 w-5" />
              Confirm Liquidation
            </DialogTitle>
          </DialogHeader>

          {selectedTarget && (
            <div className="space-y-4 mt-2">
              <div
                className="relative grid grid-cols-2 gap-3 rounded-xl p-4 font-mono text-sm overflow-hidden"
                style={{ background: CARD_BG2, border: `1px solid ${BORDER}` }}
              >
                <LBracket size={8} color={`${RED}30`} />
                {[
                  { label: "Target ID",       value: `#${selectedTarget.positionId}`,                   color: `${LIME}90` },
                  { label: "Health Factor",   value: `${formatNumber(selectedTarget.healthFactor)}x`,   color: RED         },
                  { label: "Max Liquidatable",value: `${formatNumber(selectedTarget.maxLiquidatable)} USDAX`, color: AMBER },
                  { label: "Bonus Rate",      value: `+${formatNumber(selectedTarget.liquidationBonus, 1)}%`, color: EMERALD },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "hsl(0 0% 28%)" }}>
                      {row.label}
                    </div>
                    <div className="font-black text-sm" style={{ color: row.color }}>{row.value}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleLiquidate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "hsl(0 0% 32%)" }}>
                    Debt to Cover (USDAX)
                  </Label>
                  <Input
                    type="number" step="0.01" required
                    max={selectedTarget.maxLiquidatable}
                    value={debtToCover}
                    onChange={(e) => setDebtToCover(e.target.value)}
                    style={inputStyle}
                  />
                  <p className="text-[10px] font-mono" style={{ color: "hsl(0 0% 30%)" }}>
                    You will receive collateral + 5% bonus instantly.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={liqStep !== "idle"}
                  className="w-full font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: RED, color: "white", boxShadow: `0 0 24px ${RED}30` }}
                  onMouseEnter={(e) => { if (liqStep === "idle") (e.currentTarget as HTMLElement).style.boxShadow = `0 0 36px ${RED}50`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${RED}30`; }}
                >
                  {liqStep !== "idle" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {liqStep === "idle"       && "Execute Liquidation"}
                  {liqStep === "switching"  && "Switching network..."}
                  {liqStep === "liquidating"&& "Liquidating on-chain..."}
                  {liqStep === "confirming" && "Confirming..."}
                </button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
