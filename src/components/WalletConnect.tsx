
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from "sonner";
import { useEffect } from "react";

export const WalletConnect = () => {
  const { connected, connecting } = useWallet();

  useEffect(() => {
    if (connected) {
      toast.success('Wallet connected successfully!');
    }
  }, [connected]);

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
        <WalletMultiButton 
          className="px-8 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 rounded-md flex items-center"
        >
          <Wallet className="w-5 h-5 mr-2" />
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </WalletMultiButton>
      </div>
    </Card>
  );
};
