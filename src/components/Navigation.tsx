
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Rocket, Droplets, Wallet } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const Navigation = () => {
  const location = useLocation();
  const { connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const isActive = (path: string) => location.pathname === path;

  const handleLiquidityClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open('https://raydium.io/liquidity/create-pool/', '_blank');
  };

  const handleWalletClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="mr-8">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                SolMint
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button 
                  variant={isActive('/') ? "default" : "ghost"}
                  className={isActive('/') ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-200 hover:text-white"}
                >
                  <Home className={`h-4 w-4 mr-2 ${isActive('/') ? 'text-white' : 'text-emerald-500'}`} />
                  Home
                </Button>
              </Link>
              <Link to="/promote">
                <Button 
                  variant={isActive('/promote') ? "default" : "ghost"}
                  className={isActive('/promote') ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-200 hover:text-white"}
                >
                  <Rocket className={`h-4 w-4 mr-2 ${isActive('/promote') ? 'text-white' : 'text-emerald-500'}`} />
                  Promote
                </Button>
              </Link>
              <Button 
                variant="ghost"
                className="text-slate-200 hover:text-white"
                onClick={handleLiquidityClick}
              >
                <Droplets className="h-4 w-4 mr-2 text-emerald-500" />
                Liquidity
              </Button>
            </div>
          </div>
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            onClick={handleWalletClick}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {connected ? 'Disconnect' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    </div>
  );
};
