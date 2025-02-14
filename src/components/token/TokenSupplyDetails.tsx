
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TokenSupplyDetailsProps {
  tokenData: {
    decimals: string;
    totalSupply: string;
    description: string;
  };
  onTokenDataChange: (data: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export const TokenSupplyDetails = ({
  tokenData,
  onTokenDataChange,
  onBack,
  onNext
}: TokenSupplyDetailsProps) => {
  return (
    <Card className="p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Decimals</label>
            <Input 
              type="number"
              placeholder="Enter decimals"
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.decimals}
              onChange={(e) => onTokenDataChange({ ...tokenData, decimals: e.target.value })}
            />
            <p className="text-xs text-slate-400">Enter a value between 0 and 18 decimals</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Total Supply</label>
            <Input 
              type="text"
              placeholder="Enter total supply"
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.totalSupply}
              onChange={(e) => onTokenDataChange({ ...tokenData, totalSupply: e.target.value })}
            />
            <p className="text-xs text-slate-400">Common supply is 1 billion</p>
            <p className="text-xs text-slate-400">With commas: 1,000,000,000</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Description</label>
          <Textarea 
            placeholder="Describe your token's purpose and vision..."
            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
            value={tokenData.description}
            onChange={(e) => onTokenDataChange({ ...tokenData, description: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button 
          variant="outline"
          className="px-8"
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </Card>
  );
};
