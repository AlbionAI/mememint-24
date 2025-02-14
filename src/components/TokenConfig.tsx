
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from '@solana/wallet-adapter-react';

export const TokenConfig = () => {
  const { publicKey, wallet, disconnect } = useWallet();
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    logo: null as File | null,
    decimals: "9",
    totalSupply: "1000000000",
    description: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("File must be an image");
      return;
    }

    // Create an image object to check dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width !== 500 || img.height !== 500) {
        toast.error("Image must be 500x500 pixels");
        URL.revokeObjectURL(img.src);
        return;
      }
      
      setTokenData(prev => ({ ...prev, logo: file }));
      toast.success("Logo uploaded successfully!");
      URL.revokeObjectURL(img.src);
    };
  };

  const handleNext = () => {
    if (!tokenData.name || !tokenData.symbol || !tokenData.logo) {
      toast.error("Please fill in all fields and upload a logo");
      return;
    }
    setStep(2);
  };

  return (
    <div className="space-y-8">
      {step === 1 && (
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Token Name</label>
                  <Input 
                    placeholder="The Next DOGE" 
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                    value={tokenData.name}
                    onChange={(e) => setTokenData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Token Symbol</label>
                  <Input 
                    placeholder="DOGE" 
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                    value={tokenData.symbol}
                    onChange={(e) => setTokenData(prev => ({ ...prev, symbol: e.target.value }))}
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
                        <p className="text-sm text-emerald-400">Logo uploaded!</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400" />
                        <p className="text-sm text-slate-400">Drop your 500 x 500 token logo here</p>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          </Card>

          <Card className="p-8 space-y-6 h-fit bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-2xl font-semibold text-white">
                  Wallet Connected
                </h2>
              </div>
              
              <div className="space-y-3">
                <p className="text-green-400 font-medium">
                  Connected to: {wallet?.adapter.name}
                </p>
                <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300 break-all font-mono">
                    {publicKey?.toBase58()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-all duration-200"
              >
                Disconnect
              </button>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
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
                  onChange={(e) => setTokenData(prev => ({ ...prev, decimals: e.target.value }))}
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
                  onChange={(e) => setTokenData(prev => ({ ...prev, totalSupply: e.target.value }))}
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
                onChange={(e) => setTokenData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline"
              className="px-8"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button 
              className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              Create Token
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
