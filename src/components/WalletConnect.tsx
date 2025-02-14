
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';
import { toast } from "sonner";

export function WalletConnect() {
  const { connected, connecting, disconnect, publicKey, wallet } = useWallet();

  // Handle connection status changes
  useEffect(() => {
    if (connecting) {
      toast.loading('Connecting wallet...', {
        duration: 1000
      });
    }

    if (connected && publicKey) {
      toast.success('Wallet connected successfully!');
      console.log('Connected wallet address:', publicKey.toBase58());
    }
  }, [connecting, connected, publicKey]);

  return (
    <Card className="p-12 space-y-6 w-full max-w-xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          {connected 
            ? 'Wallet Connected'
            : 'Please connect your wallet to continue'
          }
        </h2>
        {connected && publicKey ? (
          <div className="space-y-2">
            <p className="text-green-400">
              Connected to: {wallet?.adapter.name}
            </p>
            <p className="text-sm text-slate-400 break-all">
              Address: {publicKey.toBase58()}
            </p>
          </div>
        ) : (
          <p className="text-slate-400">
            Connect your Solana wallet to start creating your token
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <WalletMultiButton 
          className="wallet-adapter-button-trigger !bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all duration-200"
        />
        
        {connected && (
          <button
            onClick={() => disconnect()}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
    </Card>
  );
}
