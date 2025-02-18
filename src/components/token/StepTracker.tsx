
import { CheckCircle2 } from "lucide-react";

interface StepTrackerProps {
  currentStep: number;
}

export const StepTracker = ({ currentStep }: StepTrackerProps) => {
  return (
    <div className="flex items-center justify-center space-x-4 md:space-x-8">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentStep >= 1 
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400/50' 
            : 'bg-slate-800 border border-slate-700'
        }`}>
          {currentStep > 1 ? (
            <CheckCircle2 className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <span className="text-white font-medium">1</span>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-slate-200">Token Details</p>
        </div>
      </div>
      
      <div className={`flex-1 h-0.5 max-w-[100px] ${
        currentStep > 1 
          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20' 
          : 'bg-slate-800'
      }`} />
      
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          currentStep >= 2 
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400/50' 
            : 'bg-slate-800 border border-slate-700'
        }`}>
          {currentStep > 2 ? (
            <CheckCircle2 className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <span className="text-white font-medium">2</span>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-slate-200">Total Supply</p>
        </div>
      </div>
      
      <div className={`flex-1 h-0.5 max-w-[100px] ${
        currentStep > 2 
          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20' 
          : 'bg-slate-800'
      }`} />
      
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentStep >= 3 
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400/50' 
            : 'bg-slate-800 border border-slate-700'
        }`}>
          <span className="text-white font-medium">3</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-slate-200">Social Links</p>
        </div>
      </div>
    </div>
  );
};
