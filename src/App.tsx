
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Promote from "./pages/Promote";
import Liquidity from "./pages/Liquidity";
import NotFound from "./pages/NotFound";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

const App = () => {
  // Use devnet cluster for development
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  
  // Initialize all the wallets you want to support
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network: 'devnet' }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/promote" element={<Promote />} />
                  <Route path="/liquidity" element={<Liquidity />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
