
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { toast } from "sonner";

export function WalletConnect() {
  const { connected, connecting, disconnect, publicKey, wallet } = useWallet();
  const [hasWallet, setHasWallet] = useState<boolean>(false);

  // Check for Phantom
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      
      if (provider?.isPhantom) {
        return provider;
      }
    }
    
    window.open('https://phantom.app/', '_blank');
    return null;
  };

  // Handle direct Phantom connection
  const connectPhantom = async () => {
    try {
      const provider = getProvider();
      if (provider) {
        const response = await provider.connect();
        const publicKey = response.publicKey.toString();
        console.log('Connected with Phantom:', publicKey);
        toast.success('Phantom wallet connected successfully!');
      }
    } catch (err) {
      console.error("Error connecting to Phantom:", err);
      toast.error('Failed to connect Phantom wallet');
    }
  };

  // Check for wallet existence
  useEffect(() => {
    const checkWallet = () => {
      const isPhantomAvailable = window?.phantom?.solana?.isPhantom || false;
      const isSolflareAvailable = window?.solflare?.isSolflare || false;
      setHasWallet(isPhantomAvailable || isSolflareAvailable);
      
      if (!isPhantomAvailable && !isSolflareAvailable) {
        toast.error('No Solana wallet found! Please install Phantom or Solflare.');
      }
    };

    checkWallet();
  }, []);

  // Handle connection status changes with timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (connecting) {
      toast.loading('Connecting wallet...', {
        duration: 1000
      });
      
      timeoutId = setTimeout(() => {
        if (connecting && !connected) {
          toast.error('Connection attempt timed out. Please try again.');
          disconnect();
        }
      }, 5000);
    }

    if (connected && publicKey) {
      toast.success('Wallet connected successfully!');
      console.log('Connected wallet address:', publicKey.toBase58());
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [connecting, connected, publicKey, disconnect]);

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect();
      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
      }
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

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
            {hasWallet 
              ? 'Connect your Solana wallet to start creating your token'
              : 'Please install Phantom or Solflare wallet to continue'
            }
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-4">
        {window.phantom?.solana?.isPhantom ? (
          <button
            onClick={connectPhantom}
            className="px-8 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
          >
            Connect with Phantom
          </button>
        ) : (
          <WalletMultiButton 
            className="wallet-adapter-button-trigger bg-purple-600 hover:bg-purple-700"
          />
        )}
        
        {connected && (
          <button
            onClick={handleDisconnect}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
    </Card>
  );
}
