
import { TokenConfig } from "@/components/TokenConfig";
import { Navigation } from "@/components/Navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from "framer-motion";

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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center space-y-4">
                    <motion.h1 
                      className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      Launch a Meme Coin At Lightning Speed
                    </motion.h1>
                    <motion.p 
                      className="text-lg text-slate-400 max-w-2xl mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      No coding required, launched in seconds the professional way.
                    </motion.p>
                  </div>
                  <motion.div 
                    className="flex justify-center items-center py-12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <WalletConnect />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  className="grid gap-8 md:grid-cols-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="col-span-2">
                    <TokenConfig />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Index;
