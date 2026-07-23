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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber, formatAddress, getHealthColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Crosshair, AlertOctagon } from "lucide-react";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

export default function Liquidations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: targets, isLoading } = useListLiquidations();

  const liquidateMutation = useExecuteLiquidation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListLiquidationsQueryKey() });
        toast({ 
          title: "Liquidation Successful", 
          description: `Seized ${formatNumber(data.totalCollateralReceived)} collateral with bonus.`
        });
        setTargetPosition(null);
      }
    }
  });

  const [targetPosition, setTargetPosition] = useState<number | null>(null);
  const [debtToCover, setDebtToCover] = useState("");

  const handleLiquidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPosition) return;
    
    liquidateMutation.mutate({
      data: {
        positionId: targetPosition,
        liquidator: WALLET_ADDRESS,
        debtToCover: Number(debtToCover)
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="font-mono text-xl text-primary animate-pulse">SCANNING_FOR_TARGETS...</div>
      </div>
    );
  }

  // Find the selected target object for preview info
  const selectedTarget = targets?.find(t => t.positionId === targetPosition);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
            <Crosshair className="h-8 w-8" />
            Liquidation Hunter
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Execute liquidations on undercollateralized positions for a 10% bonus.
          </p>
        </div>
      </div>

      <Card className="border-destructive/20 bg-background/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-mono text-xs text-muted-foreground">TARGET</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">OWNER</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">COLLATERAL</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">DEBT</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">HEALTH</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">BONUS</TableHead>
              <TableHead className="text-right font-mono text-xs text-muted-foreground">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets?.map((target) => (
              <TableRow key={target.positionId} className="border-border/50 hover:bg-destructive/10 transition-colors">
                <TableCell className="font-mono text-sm">#{target.positionId}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatAddress(target.owner)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatNumber(target.collateralAmount, 4)} {target.collateralToken}
                  <div className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(target.collateralValueUsd)}</div>
                </TableCell>
                <TableCell className="font-mono text-sm text-warning">
                  {formatNumber(target.usdaxDebt, 2)} USDAX
                </TableCell>
                <TableCell>
                  <div className={`font-mono text-sm font-bold flex items-center gap-1 ${getHealthColor(target.healthFactor)}`}>
                    {target.healthFactor < 1.0 && <AlertOctagon className="h-3 w-3 animate-pulse" />}
                    {formatNumber(target.healthFactor)}x
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-safe border-safe bg-safe/10">
                    +{formatNumber(target.liquidationBonus, 1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="font-mono text-xs h-7 shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                    onClick={() => {
                      setTargetPosition(target.positionId);
                      setDebtToCover(target.maxLiquidatable.toString());
                    }}
                  >
                    EXECUTE
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {targets?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center font-mono text-muted-foreground">
                  NO_LIQUIDATABLE_TARGETS_FOUND
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={targetPosition !== null} onOpenChange={(open) => !open && setTargetPosition(null)}>
        <DialogContent className="sm:max-w-[450px] border-destructive bg-card shadow-[0_0_40px_rgba(255,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-destructive font-mono flex items-center gap-2">
              <Crosshair className="h-5 w-5" />
              CONFIRM_LIQUIDATION_EXECUTION
            </DialogTitle>
          </DialogHeader>
          
          {selectedTarget && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-background border border-border rounded font-mono text-sm">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">TARGET_ID</div>
                  <div className="text-primary">#{selectedTarget.positionId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">HEALTH_FACTOR</div>
                  <div className="text-destructive font-bold">{formatNumber(selectedTarget.healthFactor)}x</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">MAX_LIQUIDATABLE</div>
                  <div className="text-warning">{formatNumber(selectedTarget.maxLiquidatable)} USDAX</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">BONUS_RATE</div>
                  <div className="text-safe">+{formatNumber(selectedTarget.liquidationBonus, 1)}%</div>
                </div>
              </div>

              <form onSubmit={handleLiquidate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">DEBT_TO_COVER (USDAX)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    max={selectedTarget.maxLiquidatable}
                    required
                    value={debtToCover}
                    onChange={(e) => setDebtToCover(e.target.value)}
                    className="border-warning focus-visible:ring-warning"
                  />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Must provide USDAX to cover target's debt.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full font-mono bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_rgba(255,0,0,0.4)]"
                  disabled={liquidateMutation.isPending}
                >
                  {liquidateMutation.isPending ? "BROADCASTING_TX..." : "EXECUTE_LIQUIDATION"}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
