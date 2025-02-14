
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Rocket, Droplets } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16 gap-2">
          <Link to="/">
            <Button 
              variant={isActive('/') ? "default" : "ghost"}
              className={isActive('/') ? "bg-purple-600 hover:bg-purple-700" : "text-slate-400 hover:text-white"}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link to="/trending">
            <Button 
              variant={isActive('/trending') ? "default" : "ghost"}
              className={isActive('/trending') ? "bg-purple-600 hover:bg-purple-700" : "text-slate-400 hover:text-white"}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </Button>
          </Link>
          <Link to="/promote">
            <Button 
              variant={isActive('/promote') ? "default" : "ghost"}
              className={isActive('/promote') ? "bg-purple-600 hover:bg-purple-700" : "text-slate-400 hover:text-white"}
            >
              <Rocket className="h-4 w-4 mr-2" />
              Promote
            </Button>
          </Link>
          <Link to="/liquidity">
            <Button 
              variant={isActive('/liquidity') ? "default" : "ghost"}
              className={isActive('/liquidity') ? "bg-purple-600 hover:bg-purple-700" : "text-slate-400 hover:text-white"}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Liquidity
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
