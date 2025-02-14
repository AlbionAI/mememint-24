
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const TokenConfig = () => {
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    logo: null as File | null
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

  const handleSubmit = () => {
    if (!tokenData.name || !tokenData.symbol || !tokenData.logo) {
      toast.error("Please fill in all fields and upload a logo");
      return;
    }
    
    // Save token data for later use
    console.log("Token data saved:", tokenData);
    toast.success("Token configuration saved!");
  };

  return (
    <Card className="p-8 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
          onClick={handleSubmit}
        >
          Next
        </Button>
      </div>
    </Card>
  );
};
