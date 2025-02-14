
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';
import { toast } from "sonner";

export function WalletConnect() {
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      toast.success('Wallet connected successfully!');
      console.log('Connected with public key:', publicKey.toBase58());
    }
  }, [connected, publicKey]);

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
          className="wallet-adapter-button-trigger bg-purple-600 hover:bg-purple-700"
        />
      </div>
    </Card>
  );
}
