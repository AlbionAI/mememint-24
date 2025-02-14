
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const TokenForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    supply: "",
    initialPrice: "",
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
    <Card className="p-6 space-y-6 w-full max-w-md mx-auto bg-white/50 backdrop-blur-sm border border-slate-200 shadow-lg transition-all duration-200 hover:shadow-xl">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Token Configuration</h3>
        <p className="text-sm text-slate-500">Configure your token parameters</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter token name"
            value={formData.name}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="symbol">Token Symbol</Label>
          <Input
            id="symbol"
            name="symbol"
            placeholder="Enter token symbol"
            value={formData.symbol}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supply">Total Supply</Label>
          <Input
            id="supply"
            name="supply"
            type="number"
            placeholder="Enter total supply"
            value={formData.supply}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialPrice">Initial Price (SOL)</Label>
          <Input
            id="initialPrice"
            name="initialPrice"
            type="number"
            step="0.000001"
            placeholder="Enter initial price in SOL"
            value={formData.initialPrice}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200"
        >
          Save Configuration
        </Button>
      </form>
    </Card>
  );
};
