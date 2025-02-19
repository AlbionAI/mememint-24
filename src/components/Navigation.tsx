
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Rocket, Droplets } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Circle } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const handleLiquidityClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('https://raydium.io/liquidity/create-pool/', '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="mr-8">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">MemeMint</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant={isActive('/') ? "default" : "ghost"} className={isActive('/') ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-200 hover:text-white"}>
                  <Home className={`h-4 w-4 mr-2 ${isActive('/') ? 'text-white' : 'text-emerald-500'}`} />
                  Home
                </Button>
              </Link>
              <Link to="/promote">
                <Button variant={isActive('/promote') ? "default" : "ghost"} className={isActive('/promote') ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-200 hover:text-white"}>
                  <Rocket className={`h-4 w-4 mr-2 ${isActive('/promote') ? 'text-white' : 'text-emerald-500'}`} />
                  Promote
                </Button>
              </Link>
              <Button variant="ghost" className="text-slate-200 hover:text-white" onClick={handleLiquidityClick}>
                <Droplets className="h-4 w-4 mr-2 text-emerald-500" />
                Liquidity
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-slate-300">Contract</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-slate-600" />
              <span className="text-xs text-slate-300">Liquidity</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-slate-600" />
              <span className="text-xs text-slate-300">Trading</span>
            </div>
            <Progress value={0} className="w-24 h-1 bg-slate-700">
              <div className="h-full bg-emerald-600 transition-all duration-500" />
            </Progress>
          </div>
        </div>
      </div>
    </div>
  );
};
