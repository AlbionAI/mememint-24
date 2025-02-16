
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useRef } from 'react';
import { toast } from "sonner";

export function WalletConnect() {
  const { connected, connecting, disconnect, publicKey, wallet } = useWallet();
  const initialRender = useRef(true);

  // Handle connection status changes
  useEffect(() => {
    // Only show connecting toast on initial connection attempt
    if (connecting && initialRender.current) {
      toast.loading('Connecting wallet...', {
        duration: 1000
      });
    }

    if (connected && publicKey && initialRender.current) {
      toast.success('Wallet connected successfully!');
      console.log('Connected wallet address:', publicKey.toBase58());
      initialRender.current = false;
    }
  }, [connecting, connected, publicKey]);

  return (
    <div className="space-y-6">
      {!connected ? (
        <Card className="p-8 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Connect Your Wallet
            </h2>
            <p className="text-slate-400">
              Connect your Solana wallet to start creating your token
            </p>
          </div>
          
          <div className="flex justify-center">
            <WalletMultiButton 
              className="wallet-adapter-button-trigger !bg-emerald-600 hover:!bg-emerald-700 transition-colors duration-200"
              style={{
                backgroundColor: '#059669',
              }}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
};
