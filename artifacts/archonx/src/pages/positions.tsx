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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WALLET_ADDRESS = "0x71C724E627B0e336338bE5f8a00B32E880B3656F";

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
    }
  });

  const updateMutation = useUpdatePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault updated successfully" });
        setIsUpdateOpen(false);
      },
    }
  });

  const closeMutation = useClosePosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPositionsQueryKey() });
        toast({ title: "Vault closed successfully" });
      },
    }
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
      }
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
      }
    });
  };

  const handleClose = (id: number) => {
    if (confirm("Are you sure you want to close this vault and redeem collateral?")) {
      closeMutation.mutate({ id });
    }
  };

  // Preview health factor for creation
  const mockPrice = createData.token === "WETH" ? 3000 : 60000;
  const previewCollateralValue = Number(createData.amount) * mockPrice;
  const previewUsdax = Number(createData.usdax);
  const previewHealth = previewUsdax > 0 ? previewCollateralValue / previewUsdax : 0;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="font-mono text-xl text-primary animate-pulse">LOADING_VAULTS...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Vault Manager</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Manage overcollateralized debt positions
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono bg-primary text-primary-foreground">
              <Layers className="mr-2 h-4 w-4" />
              NEW_VAULT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary font-mono">INITIALIZE_VAULT</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground">COLLATERAL_TOKEN</Label>
                <Select value={createData.token} onValueChange={(val) => setCreateData({ ...createData, token: val })}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WETH" className="font-mono">WETH</SelectItem>
                    <SelectItem value="WBTC" className="font-mono">WBTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground">COLLATERAL_AMOUNT</Label>
                <Input 
                  type="number" 
                  step="0.000001" 
                  required 
                  value={createData.amount}
                  onChange={(e) => setCreateData({ ...createData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs text-muted-foreground">USDAX_TO_MINT</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={createData.usdax}
                  onChange={(e) => setCreateData({ ...createData, usdax: e.target.value })}
                />
              </div>
              
              <div className="p-3 bg-background border border-border rounded flex justify-between items-center">
                <span className="font-mono text-xs text-muted-foreground">PREVIEW_HEALTH_FACTOR</span>
                <span className={`font-mono font-bold ${getHealthColor(previewHealth)}`}>
                  {previewHealth > 0 ? `${formatNumber(previewHealth)}x` : "---"}
                </span>
              </div>
              
              <Button 
                type="submit" 
                className="w-full font-mono bg-primary text-primary-foreground"
                disabled={createMutation.isPending || (previewUsdax > 0 && previewHealth < 1.5)}
              >
                {createMutation.isPending ? "PROCESSING..." : "EXECUTE_TX"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-mono text-xs text-muted-foreground">ID</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">COLLATERAL</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">DEBT (USDAX)</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">HEALTH</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-right font-mono text-xs text-muted-foreground">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions?.map((pos) => (
              <TableRow key={pos.id} className="border-border/50 hover:bg-accent/50">
                <TableCell className="font-mono text-sm text-primary">#{pos.id}</TableCell>
                <TableCell className="font-mono text-sm">
                  {formatNumber(pos.collateralAmount, 4)} {pos.collateralToken}
                  <div className="text-xs text-muted-foreground">{formatCurrency(pos.collateralValueUsd)}</div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatNumber(pos.usdaxMinted, 2)}
                </TableCell>
                <TableCell>
                  <div className={`font-mono text-sm font-bold ${getHealthColor(pos.healthFactor)}`}>
                    {formatNumber(pos.healthFactor)}x
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {formatNumber(pos.collateralRatio, 1)}% Ratio
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={pos.status === 'active' ? 'outline' : 'secondary'} className="font-mono text-[10px] uppercase">
                    {pos.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-mono text-xs h-7"
                    disabled={pos.status !== 'active'}
                    onClick={() => {
                      setSelectedPosition(pos.id);
                      setUpdateData({ amount: pos.collateralAmount.toString(), usdax: pos.usdaxMinted.toString() });
                      setIsUpdateOpen(true);
                    }}
                  >
                    MODIFY
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="font-mono text-xs h-7"
                    disabled={pos.status !== 'active' || closeMutation.isPending}
                    onClick={() => handleClose(pos.id)}
                  >
                    CLOSE
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {positions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center font-mono text-muted-foreground">
                  NO_ACTIVE_POSITIONS_FOUND
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary font-mono">MODIFY_VAULT #{selectedPosition}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">NEW_COLLATERAL_AMOUNT</Label>
              <Input 
                type="number" 
                step="0.000001" 
                value={updateData.amount}
                onChange={(e) => setUpdateData({ ...updateData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">NEW_DEBT_AMOUNT (USDAX)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={updateData.usdax}
                onChange={(e) => setUpdateData({ ...updateData, usdax: e.target.value })}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full font-mono bg-primary text-primary-foreground"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "PROCESSING..." : "UPDATE_VAULT"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
