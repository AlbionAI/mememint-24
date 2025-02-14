
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { toast } from "sonner";

export function WalletConnect() {
  const { connected, connecting, wallet, connect, disconnect } = useWallet();

  useEffect(() => {
    if (connected) {
      toast.success('Wallet connected successfully!');
    }
  }, [connected]);

  const handleConnect = async () => {
    try {
      if (!connected && wallet) {
        await connect();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  return (
    <Card className="p-12 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          Please connect your wallet to continue
        </h2>
        <p className="text-slate-400">
          Connect your Solana wallet to start creating your token
        </p>
      </div>
      
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleConnect}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-2"
        >
          Select Wallet
        </Button>
      </div>
    </Card>
  );
}
