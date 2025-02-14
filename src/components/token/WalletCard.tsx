
import { Card } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';

export const WalletCard = () => {
  const { publicKey, wallet, disconnect } = useWallet();

  return (
    <Card className="p-8 space-y-6 h-fit bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl">
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
  );
};
