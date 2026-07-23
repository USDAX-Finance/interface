import { useState } from "react";
import {
  useListLiquidations,
  useExecuteLiquidation,
  getListLiquidationsQueryKey,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber, formatAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Crosshair, AlertOctagon, Zap, TrendingDown, Shield } from "lucide-react";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

function HealthPill({ value }: { value: number }) {
  const critical = value < 1.0;
  const warning = value < 1.2;
  const color = critical
    ? "hsl(0 84% 60%)"
    : warning
    ? "hsl(35 92% 60%)"
    : "hsl(263 70% 62%)";
  const bg = critical
    ? "hsl(0 84% 60% / 0.12)"
    : warning
    ? "hsl(35 92% 60% / 0.12)"
    : "hsl(263 70% 62% / 0.12)";
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-xs font-bold"
      style={{ background: bg, color, border: `1px solid ${color}30` }}
    >
      {critical && <AlertOctagon className="h-3 w-3 animate-pulse" />}
      {formatNumber(value)}x
    </div>
  );
}

export default function Liquidations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: targets, isLoading } = useListLiquidations();

  const liquidateMutation = useExecuteLiquidation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListLiquidationsQueryKey() });
        toast({
          title: "Liquidation executed",
          description: `Seized ${formatNumber(data.totalCollateralReceived)} collateral + 10% bonus.`,
        });
        setTargetPosition(null);
      },
    },
  });

  const [targetPosition, setTargetPosition] = useState<number | null>(null);
  const [debtToCover, setDebtToCover] = useState("");

  const handleLiquidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPosition) return;
    liquidateMutation.mutate({
      data: { positionId: targetPosition, liquidator: WALLET_ADDRESS, debtToCover: Number(debtToCover) },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 rounded-xl mx-auto animate-pulse"
            style={{ background: "linear-gradient(135deg,hsl(0 84% 55%),hsl(263 70% 55%))" }}
          />
          <div className="font-mono text-sm text-muted-foreground">Scanning targets...</div>
        </div>
      </div>
    );
  }

  const selectedTarget = targets?.find((t) => t.positionId === targetPosition);
  const criticalCount = targets?.filter((t) => t.healthFactor < 1.0).length ?? 0;

  const panelStyle = {
    background: "hsl(232 18% 7%)",
    border: "1px solid hsl(263 20% 13%)",
    borderRadius: "1rem",
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(0 84% 60% / 0.12)", border: "1px solid hsl(0 84% 60% / 0.25)" }}
            >
              <Crosshair className="h-5 w-5" style={{ color: "hsl(0 84% 60%)" }} />
            </div>
            Liquidation{" "}
            <span style={{ background: "linear-gradient(135deg,hsl(0 84% 65%),hsl(263 70% 65%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Hunter
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 ml-12">
            Repay underwater debt · earn 10% collateral bonus
          </p>
        </div>

        {criticalCount > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "hsl(0 84% 60% / 0.08)",
              border: "1px solid hsl(0 84% 60% / 0.25)",
              color: "hsl(0 84% 65%)",
            }}
          >
            <AlertOctagon className="h-4 w-4 animate-pulse" />
            {criticalCount} critical position{criticalCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingDown,
            label: "Liquidation Threshold",
            value: "HF < 1.0",
            color: "hsl(0 84% 60%)",
          },
          {
            icon: Zap,
            label: "Bonus for Liquidators",
            value: "+10%",
            color: "hsl(142 71% 45%)",
          },
          {
            icon: Shield,
            label: "Max Per Liquidation",
            value: "50% of debt",
            color: "hsl(263 70% 62%)",
          },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl p-4 flex items-center gap-3" style={panelStyle}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${c.color}18` }}
              >
                <Icon className="h-4 w-4" style={{ color: c.color }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="font-bold font-mono text-sm" style={{ color: c.color }}>
                  {c.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Targets table */}
      <div style={panelStyle} className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: "hsl(263 20% 11%)" }} className="hover:bg-transparent">
              {["#", "Owner", "Collateral", "Debt", "Health", "Bonus", ""].map((h) => (
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
            {targets?.map((target) => {
              const critical = target.healthFactor < 1.0;
              return (
                <TableRow
                  key={target.positionId}
                  style={{
                    borderColor: "hsl(263 20% 10%)",
                    background: critical ? "hsl(0 84% 60% / 0.03)" : undefined,
                  }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell
                    className="font-mono text-sm font-semibold"
                    style={{ color: critical ? "hsl(0 84% 65%)" : "hsl(263 70% 70%)" }}
                  >
                    #{target.positionId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatAddress(target.owner)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div>
                      {formatNumber(target.collateralAmount, 4)} {target.collateralToken}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {formatCurrency(target.collateralValueUsd)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm" style={{ color: "hsl(35 92% 60%)" }}>
                    {formatNumber(target.usdaxDebt, 2)} USDAX
                  </TableCell>
                  <TableCell>
                    <HealthPill value={target.healthFactor} />
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                      style={{
                        background: "hsl(142 71% 45% / 0.12)",
                        color: "hsl(142 71% 55%)",
                        border: "1px solid hsl(142 71% 45% / 0.25)",
                      }}
                    >
                      +{formatNumber(target.liquidationBonus, 1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: "hsl(0 84% 60% / 0.12)",
                        color: "hsl(0 84% 65%)",
                        border: "1px solid hsl(0 84% 60% / 0.3)",
                        boxShadow: critical ? "0 0 12px hsl(0 84% 60% / 0.2)" : undefined,
                      }}
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
                <TableCell
                  colSpan={7}
                  className="h-32 text-center font-mono text-sm text-muted-foreground"
                >
                  No liquidatable targets — all positions are healthy
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
            background: "hsl(232 18% 7%)",
            border: "1px solid hsl(0 84% 60% / 0.3)",
            boxShadow: "0 0 40px hsl(0 84% 60% / 0.1)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 font-bold"
              style={{ color: "hsl(0 84% 65%)" }}
            >
              <Crosshair className="h-5 w-5" />
              Confirm Liquidation
            </DialogTitle>
          </DialogHeader>

          {selectedTarget && (
            <div className="space-y-4 mt-2">
              <div
                className="grid grid-cols-2 gap-3 rounded-xl p-4 font-mono text-sm"
                style={{ background: "hsl(232 20% 9%)", border: "1px solid hsl(263 20% 13%)" }}
              >
                {[
                  { label: "Target ID", value: `#${selectedTarget.positionId}`, color: "hsl(263 70% 70%)" },
                  { label: "Health Factor", value: `${formatNumber(selectedTarget.healthFactor)}x`, color: "hsl(0 84% 65%)" },
                  { label: "Max Liquidatable", value: `${formatNumber(selectedTarget.maxLiquidatable)} USDAX`, color: "hsl(35 92% 60%)" },
                  { label: "Bonus Rate", value: `+${formatNumber(selectedTarget.liquidationBonus, 1)}%`, color: "hsl(142 71% 55%)" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="text-[10px] text-muted-foreground mb-1">{row.label}</div>
                    <div className="font-bold text-sm" style={{ color: row.color }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleLiquidate} className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Debt to Cover (USDAX)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    max={selectedTarget.maxLiquidatable}
                    required
                    value={debtToCover}
                    onChange={(e) => setDebtToCover(e.target.value)}
                    className="rounded-xl font-mono"
                    style={{ borderColor: "hsl(0 84% 60% / 0.4)" }}
                  />
                  <p className="text-[10px] font-mono text-muted-foreground">
                    You will receive collateral + 10% bonus instantly.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={liquidateMutation.isPending}
                  className="w-full font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                  style={{
                    background: "hsl(0 84% 55%)",
                    color: "white",
                    boxShadow: "0 0 20px hsl(0 84% 60% / 0.3)",
                  }}
                >
                  {liquidateMutation.isPending ? "Broadcasting..." : "Execute Liquidation"}
                </button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
