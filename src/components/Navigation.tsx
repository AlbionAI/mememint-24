
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Rocket, Droplets } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLiquidityClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('https://raydium.io/liquidity/create-pool/', '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#2A0134]/90 backdrop-blur-sm border-b border-[#2A0134] z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <Link to="/" className="mr-8">
            <span className="text-2xl font-bold text-white">
              SolMint
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button 
                variant={isActive('/') ? "default" : "ghost"}
                className={isActive('/') ? "bg-[#2A0134] hover:bg-[#2A0134]/80" : "text-slate-200 hover:text-white"}
              >
                <Home className="h-4 w-4 mr-2 text-[#2A0134]" />
                Home
              </Button>
            </Link>
            <Link to="/promote">
              <Button 
                variant={isActive('/promote') ? "default" : "ghost"}
                className={isActive('/promote') ? "bg-[#2A0134] hover:bg-[#2A0134]/80" : "text-slate-200 hover:text-white"}
              >
                <Rocket className="h-4 w-4 mr-2 text-[#2A0134]" />
                Promote
              </Button>
            </Link>
            <Button 
              variant="ghost"
              className="text-slate-200 hover:text-white"
              onClick={handleLiquidityClick}
            >
              <Droplets className="h-4 w-4 mr-2 text-[#2A0134]" />
              Liquidity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
