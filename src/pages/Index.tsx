
import { TokenConfig } from "@/components/TokenConfig";
import { Navigation } from "@/components/Navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { connected } = useWallet();
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
              {!connected || !session ? (
                <>
                  <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                      Launch a Meme Coin At Lightning Speed!
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                      No coding required, launched in seconds the professional way.
                    </p>
                  </div>
                  <div className="flex justify-center items-center py-12">
                    <WalletConnect />
                  </div>
                  {connected && !session && (
                    <div className="text-center">
                      <p className="text-red-400">
                        Please sign in to create your token. Your session may have expired.
                      </p>
                    </div>
                  )}
                </>
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
