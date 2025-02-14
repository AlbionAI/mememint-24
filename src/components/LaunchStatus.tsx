
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const LaunchStatus = () => {
  return (
    <Card className="p-6 space-y-6 w-full max-w-md mx-auto bg-white/50 backdrop-blur-sm border border-slate-200 shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Launch Status</h3>
        <p className="text-sm text-slate-500">Track your token launch progress</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Contract Deployment</span>
            <span className="text-slate-900 font-medium">Pending</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Liquidity Addition</span>
            <span className="text-slate-900 font-medium">Not Started</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Trading Enabled</span>
            <span className="text-slate-900 font-medium">Not Started</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
      </div>
    </Card>
  );
};
