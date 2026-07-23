import { useState } from "react";
import {
  useListPositions, useCreatePosition, useUpdatePosition, useClosePosition,
  getListPositionsQueryKey,
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
import { formatCurrency, formatNumber, formatAddress } from "@/lib/utils";
import { Plus, Zap, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── design tokens ─── */
const LIME    = "hsl(79 100% 57%)";
const EMERALD = "hsl(152 70% 48%)";
const RED     = "hsl(0 84% 60%)";
const AMBER   = "hsl(35 92% 60%)";
const BORDER  = "hsl(0 0% 10%)";
const CARD_BG = "hsl(0 0% 6%)";
const CARD_BG2= "hsl(0 0% 8%)";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

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
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const { data: positions, isLoading } = useListPositions();

  const createMutation = useCreatePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault created" });
        setIsCreateOpen(false);
      },
    },
  });

  const updateMutation = useUpdatePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault updated" });
        setIsUpdateOpen(false);
      },
    },
  });

  const closeMutation = useClosePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault closed" });
      },
    },
  });

  const [isCreateOpen,     setIsCreateOpen]     = useState(false);
  const [createData,       setCreateData]        = useState({ token: "WETH", amount: "", usdax: "" });
  const [isUpdateOpen,     setIsUpdateOpen]      = useState(false);
  const [selectedPosition, setSelectedPosition]  = useState<number | null>(null);
  const [updateData,       setUpdateData]        = useState({ amount: "", usdax: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        owner: WALLET_ADDRESS,
        collateralToken: createData.token as "WETH" | "WBTC",
        collateralAmount: Number(createData.amount),
        usdaxToMint: Number(createData.usdax),
      },
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;
    updateMutation.mutate({
      id: selectedPosition,
      data: {
        collateralAmount: updateData.amount ? Number(updateData.amount) : undefined,
        usdaxMinted:      updateData.usdax  ? Number(updateData.usdax)  : undefined,
      },
    });
  };

  const handleClose = (id: number) => {
    if (confirm("Close this vault and redeem all collateral?")) closeMutation.mutate({ id });
  };

  const mockPrice           = createData.token === "WETH" ? 3000 : 60000;
  const previewCollVal      = Number(createData.amount) * mockPrice;
  const previewUsdax        = Number(createData.usdax);
  const previewHealth       = previewUsdax > 0 ? previewCollVal / previewUsdax : 0;
  const healthColor         = previewHealth < 1 ? RED : previewHealth < 1.5 ? AMBER : EMERALD;

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

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 0% 30%)" }}>
            ◈ USDEX Finance · Vault System
          </div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tight">
            Vault <span style={{ color: LIME }}>Manager</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 38%)" }}>
            Manage overcollateralized debt positions
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                Initialize Vault
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <FieldGroup label="Collateral Token">
                <Select value={createData.token} onValueChange={(val) => setCreateData({ ...createData, token: val })}>
                  <SelectTrigger style={inputStyle}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WETH">WETH</SelectItem>
                    <SelectItem value="WBTC">WBTC</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Collateral Amount">
                <Input
                  type="number" step="0.000001" required placeholder="0.00"
                  style={inputStyle}
                  value={createData.amount}
                  onChange={(e) => setCreateData({ ...createData, amount: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="USDAX to Mint">
                <Input
                  type="number" step="0.01" required placeholder="0.00"
                  style={inputStyle}
                  value={createData.usdax}
                  onChange={(e) => setCreateData({ ...createData, usdax: e.target.value })}
                />
              </FieldGroup>

              {previewUsdax > 0 && (
                <div
                  className="relative rounded-lg p-3 flex items-center justify-between overflow-hidden"
                  style={{ background: "hsl(0 0% 7%)", border: `1px solid ${healthColor}22` }}
                >
                  <LBracket size={8} color={`${healthColor}35`} />
                  <span className="font-mono text-[11px]" style={{ color: "hsl(0 0% 38%)" }}>Preview Health Factor</span>
                  <span className="font-mono font-black text-sm" style={{ color: healthColor }}>
                    {formatNumber(previewHealth)}x
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-40"
                style={{ background: LIME, color: "hsl(0 0% 4%)" }}
                disabled={createMutation.isPending || (previewUsdax > 0 && previewHealth < 1.5)}
              >
                {createMutation.isPending ? "Broadcasting..." : "Confirm Deposit"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
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
            {positions?.map((pos) => (
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
                <TableCell className="text-right space-x-2">
                  <button
                    className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                    style={{ border: `1px solid ${BORDER}`, color: "hsl(0 0% 40%)" }}
                    disabled={pos.status !== "active"}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)"; (e.currentTarget as HTMLElement).style.borderColor = `${LIME}30`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 40%)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
                    onClick={() => {
                      setSelectedPosition(pos.id);
                      setUpdateData({ amount: pos.collateralAmount.toString(), usdax: pos.usdaxMinted.toString() });
                      setIsUpdateOpen(true);
                    }}
                  >
                    Modify
                  </button>
                  <button
                    className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                    style={{ border: `1px solid ${RED}30`, color: RED, background: `${RED}08` }}
                    disabled={pos.status !== "active" || closeMutation.isPending}
                    onClick={() => handleClose(pos.id)}
                  >
                    Close
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {positions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center font-mono text-sm" style={{ color: "hsl(0 0% 28%)" }}>
                  No active vaults — open one above
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Update dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="sm:max-w-[400px]" style={dialogStyle}>
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-base" style={{ color: LIME }}>
              Modify Vault #{selectedPosition}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <FieldGroup label="New Collateral Amount">
              <Input
                type="number" step="0.000001" placeholder="0.00"
                style={inputStyle}
                value={updateData.amount}
                onChange={(e) => setUpdateData({ ...updateData, amount: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="New Debt (USDAX)">
              <Input
                type="number" step="0.01" placeholder="0.00"
                style={inputStyle}
                value={updateData.usdax}
                onChange={(e) => setUpdateData({ ...updateData, usdax: e.target.value })}
              />
            </FieldGroup>
            <button
              type="submit"
              className="w-full font-black py-2.5 rounded-lg text-sm transition-all disabled:opacity-40"
              style={{ background: LIME, color: "hsl(0 0% 4%)" }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Broadcasting..." : "Update Vault"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
