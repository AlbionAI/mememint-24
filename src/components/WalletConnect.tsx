
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useRef } from 'react';
import { toast } from "sonner";

export function WalletConnect() {
  const { connected, connecting, disconnect, publicKey, wallet } = useWallet();
  const hasShownToast = useRef(false);

  // Handle connection status changes
  useEffect(() => {
    if (!hasShownToast.current) {
      if (connecting) {
        toast.loading('Connecting wallet...', {
          duration: 1000
        });
      }

      if (connected && publicKey) {
        toast.success('Wallet connected successfully!');
        console.log('Connected wallet address:', publicKey.toBase58());
        hasShownToast.current = true;
      }
    }
  }, [connecting, connected, publicKey]);

  // Reset toast flag when wallet is disconnected
  useEffect(() => {
    if (!connected) {
      hasShownToast.current = false;
    }
  }, [connected]);

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
      ) : (
        <Card className="p-8 space-y-6 w-full max-w-xl mx-auto bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 shadow-xl">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-2xl font-semibold text-white">
                Wallet Connected
              </h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-green-400 font-medium">
                Connected to: {wallet?.adapter.name}
              </p>
              <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 break-all font-mono">
                  {publicKey?.toBase58()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-all duration-200"
            >
              Disconnect
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
