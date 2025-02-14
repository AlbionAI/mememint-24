
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from "sonner";
import { useEffect } from "react";

export function WalletConnect() {
  const { connected, connecting, wallet, connect, disconnect } = useWallet();

  useEffect(() => {
    if (connected) {
      toast.success('Wallet connected successfully!');
    }
  }, [connected]);

  useEffect(() => {
    // Log wallet availability and connection attempts
    const isPhantomAvailable = typeof window !== 'undefined' && 'solana' in window;
    
    console.log('Wallet state:', {
      wallet: wallet?.adapter?.name,
      connected,
      connecting,
      isPhantomAvailable
    });
  }, [wallet, connected, connecting]);

  const handleWalletClick = async () => {
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
        <WalletMultiButton 
          className="wallet-adapter-button-trigger"
          onClick={handleWalletClick}
        />
      </div>
    </Card>
  );
}
