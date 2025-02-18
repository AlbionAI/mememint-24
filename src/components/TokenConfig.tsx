
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export const TokenConfig = () => {
  return (
    <Card className="p-8 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Name</label>
            <Input 
              placeholder="Shopdog" 
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Symbol</label>
            <Input 
              placeholder="SD" 
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Logo</label>
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 hover:border-emerald-500/50 transition-colors">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-400">Drop your 500 x 500 token logo here</p>
              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
        >
          Next
        </Button>
      </div>
    </Card>
  );
};
