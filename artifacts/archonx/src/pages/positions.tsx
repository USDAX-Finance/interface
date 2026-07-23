import { useState } from "react";
import {
  useListPositions,
  useCreatePosition,
  useUpdatePosition,
  useClosePosition,
  getListPositionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber, formatAddress, getHealthColor } from "@/lib/utils";
import { Layers, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

function HealthBar({ value }: { value: number }) {
  const pct = Math.min((value / 3) * 100, 100);
  const color =
    value < 1.0
      ? "hsl(0 84% 60%)"
      : value < 1.5
      ? "hsl(35 92% 60%)"
      : "hsl(142 71% 45%)";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 flex-1 rounded-full overflow-hidden"
        style={{ background: "hsl(263 20% 12%)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color }}>
        {formatNumber(value)}x
      </span>
    </div>
  );
}

export default function Positions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: positions, isLoading } = useListPositions();

  const createMutation = useCreatePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault created successfully" });
        setIsCreateOpen(false);
      },
    },
  });

  const updateMutation = useUpdatePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault updated successfully" });
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({ token: "WETH", amount: "", usdax: "" });
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [updateData, setUpdateData] = useState({ amount: "", usdax: "" });

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
        usdaxMinted: updateData.usdax ? Number(updateData.usdax) : undefined,
      },
    });
  };

  const handleClose = (id: number) => {
    if (confirm("Close this vault and redeem all collateral?")) closeMutation.mutate({ id });
  };

  const mockPrice = createData.token === "WETH" ? 3000 : 60000;
  const previewCollateralValue = Number(createData.amount) * mockPrice;
  const previewUsdax = Number(createData.usdax);
  const previewHealth = previewUsdax > 0 ? previewCollateralValue / previewUsdax : 0;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 rounded-xl mx-auto animate-pulse"
            style={{ background: "linear-gradient(135deg,hsl(263 70% 55%),hsl(186 80% 45%))" }}
          />
          <div className="font-mono text-sm text-muted-foreground">Loading vaults...</div>
        </div>
      </div>
    );
  }

  const panelStyle = {
    background: "hsl(232 18% 7%)",
    border: "1px solid hsl(263 20% 13%)",
    borderRadius: "1rem",
  };

  const dialogStyle = {
    background: "hsl(232 18% 7%)",
    border: "1px solid hsl(263 20% 16%)",
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Vault <span className="gradient-text">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage overcollateralized debt positions
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <button
              className="btn-gradient flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Open Vault
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]" style={dialogStyle}>
            <DialogHeader>
              <DialogTitle className="gradient-text-purple font-bold">
                Initialize Vault
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Collateral Token</Label>
                <Select
                  value={createData.token}
                  onValueChange={(val) => setCreateData({ ...createData, token: val })}
                >
                  <SelectTrigger className="font-mono rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WETH">WETH</SelectItem>
                    <SelectItem value="WBTC">WBTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Collateral Amount</Label>
                <Input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="0.00"
                  className="rounded-xl font-mono"
                  value={createData.amount}
                  onChange={(e) => setCreateData({ ...createData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">USDAX to Mint</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="rounded-xl font-mono"
                  value={createData.usdax}
                  onChange={(e) => setCreateData({ ...createData, usdax: e.target.value })}
                />
              </div>

              {previewUsdax > 0 && (
                <div
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: "hsl(232 20% 9%)", border: "1px solid hsl(263 20% 14%)" }}
                >
                  <span className="text-xs text-muted-foreground">Preview Health Factor</span>
                  <span
                    className="font-mono font-bold text-sm"
                    style={{
                      color:
                        previewHealth < 1
                          ? "hsl(0 84% 60%)"
                          : previewHealth < 1.5
                          ? "hsl(35 92% 60%)"
                          : "hsl(142 71% 45%)",
                    }}
                  >
                    {formatNumber(previewHealth)}x
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn-gradient w-full text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                disabled={
                  createMutation.isPending || (previewUsdax > 0 && previewHealth < 1.5)
                }
              >
                {createMutation.isPending ? "Broadcasting..." : "Confirm Deposit"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div style={panelStyle} className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow
              style={{ borderColor: "hsl(263 20% 11%)" }}
              className="hover:bg-transparent"
            >
              {["ID", "Collateral", "Debt (USDAX)", "Health", "Status", ""].map((h) => (
                <TableHead
                  key={h}
                  className={`text-xs text-muted-foreground font-medium ${h === "" ? "text-right" : ""}`}
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
                style={{ borderColor: "hsl(263 20% 10%)" }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <TableCell
                  className="font-mono text-sm font-semibold"
                  style={{ color: "hsl(263 70% 70%)" }}
                >
                  #{pos.id}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div>{formatNumber(pos.collateralAmount, 4)} {pos.collateralToken}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(pos.collateralValueUsd)}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatNumber(pos.usdaxMinted, 2)}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatNumber(pos.collateralRatio, 1)}% ratio
                  </div>
                </TableCell>
                <TableCell className="w-36">
                  <HealthBar value={pos.healthFactor} />
                </TableCell>
                <TableCell>
                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase"
                    style={
                      pos.status === "active"
                        ? {
                            background: "hsl(142 71% 45% / 0.12)",
                            color: "hsl(142 71% 55%)",
                            border: "1px solid hsl(142 71% 45% / 0.25)",
                          }
                        : {
                            background: "hsl(240 8% 15%)",
                            color: "hsl(240 8% 55%)",
                          }
                    }
                  >
                    {pos.status}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <button
                    className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all hover:bg-white/5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    style={{ border: "1px solid hsl(263 20% 16%)" }}
                    disabled={pos.status !== "active"}
                    onClick={() => {
                      setSelectedPosition(pos.id);
                      setUpdateData({
                        amount: pos.collateralAmount.toString(),
                        usdax: pos.usdaxMinted.toString(),
                      });
                      setIsUpdateOpen(true);
                    }}
                  >
                    Modify
                  </button>
                  <button
                    className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    style={{ border: "1px solid hsl(0 84% 60% / 0.3)" }}
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
                <TableCell
                  colSpan={6}
                  className="h-32 text-center font-mono text-muted-foreground text-sm"
                >
                  No active vaults found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Update dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="sm:max-w-[420px]" style={dialogStyle}>
          <DialogHeader>
            <DialogTitle className="gradient-text-purple font-bold">
              Modify Vault #{selectedPosition}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">New Collateral Amount</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.00"
                className="rounded-xl font-mono"
                value={updateData.amount}
                onChange={(e) => setUpdateData({ ...updateData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">New Debt (USDAX)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="rounded-xl font-mono"
                value={updateData.usdax}
                onChange={(e) => setUpdateData({ ...updateData, usdax: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="btn-gradient w-full text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
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
