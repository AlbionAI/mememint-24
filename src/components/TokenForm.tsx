import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, 
  Settings, 
  Shield, 
  Coins
} from "lucide-react";

export const TokenForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    supply: "",
    initialPrice: "",
    taxFee: "0",
    liquidityFee: "0",
    maxTxAmount: "",
    maxWalletAmount: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configuration Saved",
      description: "Your token configuration has been saved successfully.",
    });
  };

  return (
    <Card className="p-6 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-white">Token Configuration</h3>
        </div>
        <p className="text-sm text-slate-400">Configure your token parameters</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">Basic Information</span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Token Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter token name"
                value={formData.name}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-slate-300">Token Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                placeholder="Enter token symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supply" className="text-slate-300">Total Supply</Label>
              <Input
                id="supply"
                name="supply"
                type="number"
                placeholder="Enter total supply"
                value={formData.supply}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialPrice" className="text-slate-300">Initial Price (SOL)</Label>
              <Input
                id="initialPrice"
                name="initialPrice"
                type="number"
                step="0.000001"
                placeholder="Enter initial price"
                value={formData.initialPrice}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Settings</span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxFee" className="text-slate-300">Tax Fee (%)</Label>
              <Input
                id="taxFee"
                name="taxFee"
                type="number"
                placeholder="Enter tax fee"
                value={formData.taxFee}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liquidityFee" className="text-slate-300">Liquidity Fee (%)</Label>
              <Input
                id="liquidityFee"
                name="liquidityFee"
                type="number"
                placeholder="Enter liquidity fee"
                value={formData.liquidityFee}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxTxAmount" className="text-slate-300">Max Transaction</Label>
              <Input
                id="maxTxAmount"
                name="maxTxAmount"
                type="number"
                placeholder="Max tokens per tx"
                value={formData.maxTxAmount}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWalletAmount" className="text-slate-300">Max Wallet</Label>
              <Input
                id="maxWalletAmount"
                name="maxWalletAmount"
                type="number"
                placeholder="Max tokens per wallet"
                value={formData.maxWalletAmount}
                onChange={handleChange}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
        >
          <Shield className="w-4 h-4 mr-2 text-white" />
          Deploy Token
        </Button>
      </form>
    </Card>
  );
};
