
import { TokenConfig } from "@/components/TokenConfig";
import { Navigation } from "@/components/Navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from '@solana/wallet-adapter-react';

const Index = () => {
  const { connected } = useWallet();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-900 relative">
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundBeams className="opacity-40" />
        </div>
        <div className="relative z-10 pt-20">
          <div className="container px-4 py-8 mx-auto">
            <div className="max-w-6xl mx-auto space-y-8">
              {!connected ? (
                <div className="flex justify-center items-center py-12">
                  <WalletConnect />
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="col-span-2">
                    <TokenConfig />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Index;
