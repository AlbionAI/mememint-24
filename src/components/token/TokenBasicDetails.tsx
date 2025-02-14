
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface TokenBasicDetailsProps {
  tokenData: {
    name: string;
    symbol: string;
    logo: File | null;
  };
  onTokenDataChange: (data: any) => void;
  onNext: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TokenBasicDetails = ({ 
  tokenData, 
  onTokenDataChange, 
  onNext,
  handleFileChange 
}: TokenBasicDetailsProps) => {
  return (
    <Card className="p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl">
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Name</label>
            <Input 
              placeholder="The Next DOGE" 
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.name}
              onChange={(e) => onTokenDataChange({ ...tokenData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Symbol</label>
            <Input 
              placeholder="DOGE" 
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.symbol}
              onChange={(e) => onTokenDataChange({ ...tokenData, symbol: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Logo</label>
          <label className="border-2 border-dashed border-slate-700 rounded-lg p-8 hover:border-emerald-500/50 transition-colors cursor-pointer block">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center space-y-2">
              {tokenData.logo ? (
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={URL.createObjectURL(tokenData.logo)} 
                    alt="Token logo preview" 
                    className="w-16 h-16 rounded-full"
                  />
                  <p className="text-sm text-emerald-400">Logo uploaded and resized to 500x500!</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-sm text-slate-400">Drop your token logo here</p>
                  <p className="text-xs text-slate-500">Any size image will be resized to 500x500</p>
                </>
              )}
            </div>
          </label>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
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
