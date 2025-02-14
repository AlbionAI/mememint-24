
import { Link } from "react-router-dom";

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-white hover:text-emerald-500 transition-colors"
          >
            MemeMint
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link
              to="/promote"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Marketing
            </Link>
            <Link
              to="/liquidity"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Liquidity
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">MM</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
