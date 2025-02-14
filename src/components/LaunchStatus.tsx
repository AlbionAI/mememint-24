
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock } from "lucide-react";

export const LaunchStatus = () => {
  return (
    <Card className="p-6 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#9b87f5]" />
          Launch Status
        </h3>
        <p className="text-sm text-slate-400">Track your token launch progress</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-[#9b87f5]" />
              <span className="text-slate-300">Contract Deployment</span>
            </div>
            <span className="text-slate-400 font-medium">Pending</span>
          </div>
          <Progress value={0} className="h-2 bg-slate-700">
            <div className="h-full bg-[#8B5CF6] transition-all duration-500" />
          </Progress>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-slate-600" />
              <span className="text-slate-300">Liquidity Addition</span>
            </div>
            <span className="text-slate-400 font-medium">Not Started</span>
          </div>
          <Progress value={0} className="h-2 bg-slate-700">
            <div className="h-full bg-[#8B5CF6] transition-all duration-500" />
          </Progress>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-slate-600" />
              <span className="text-slate-300">Trading Enabled</span>
            </div>
            <span className="text-slate-400 font-medium">Not Started</span>
          </div>
          <Progress value={0} className="h-2 bg-slate-700">
            <div className="h-full bg-[#8B5CF6] transition-all duration-500" />
          </Progress>
        </div>
      </div>
    </Card>
  );
};
