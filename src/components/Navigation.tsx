
import { Link } from "react-router-dom";
import { Home, Rocket, Coins } from "lucide-react";

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-[#0B1120]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              MemeMint
            </Link>
            
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              
              <Link
                to="/promote"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Rocket className="w-4 h-4" />
                <span>Promote</span>
              </Link>
              
              <Link
                to="/liquidity"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Coins className="w-4 h-4" />
                <span>Liquidity</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              Contract
            </button>
            <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              Liquidity
            </button>
            <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
              Trading
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
