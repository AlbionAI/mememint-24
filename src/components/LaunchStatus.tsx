
import { Progress } from "@/components/ui/progress";
import { Circle, Lock } from "lucide-react";

export const LaunchStatus = () => {
  return (
    <div className="bg-slate-900/95 border-b border-slate-700 backdrop-blur-sm py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-end space-x-6">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-300">Contract Deployment</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-300">Liquidity</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-300">Trading</span>
          </div>
          <Progress value={0} className="w-32 h-1.5 bg-slate-700">
            <div className="h-full bg-emerald-600 transition-all duration-500" />
          </Progress>
        </div>
      </div>
    </div>
  );
};
