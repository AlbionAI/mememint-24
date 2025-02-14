
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, Coins, ArrowDownUp, Settings } from "lucide-react";

const Liquidity = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Create Liquidity Pool
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Add liquidity to start trading your token
            </p>
          </div>

          <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Add Liquidity</h3>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Token Amount</Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="0.0"
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 pr-24"
                    />
                    <Button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      MAX
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <ArrowDownUp className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">SOL Amount</Label>
                  <Input 
                    type="number"
                    placeholder="0.0"
                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="pt-4">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pool Share</span>
                  <span className="text-white">0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">LP Tokens</span>
                  <span className="text-white">0</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Liquidity;
