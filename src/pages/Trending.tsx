
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface Token {
  name: string;
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
  volume: string;
  address: string;
  logoURI?: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  volume: {
    h24: number;
  };
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
}

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="text-center">
      <h2 className="text-xl text-purple-400 animate-pulse">
        Loading Trending Tokens...
      </h2>
    </div>
    {[...Array(10)].map((_, index) => (
      <Card key={index} className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-700"></div>
            <div>
              <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 w-20 bg-slate-700 rounded"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 w-16 bg-slate-700 rounded"></div>
          </div>
          <div className="text-right ml-8">
            <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 w-16 bg-slate-700 rounded"></div>
          </div>
          <div className="flex gap-2 ml-8">
            <div className="h-8 w-8 bg-slate-700 rounded"></div>
            <div className="h-8 w-8 bg-slate-700 rounded"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

const fetchTrendingTokens = async (): Promise<Token[]> => {
  try {
    const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/raydium');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('API Response:', data); // Debug log

    if (!data || !data.pairs || !Array.isArray(data.pairs)) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response from DexScreener API');
    }

    // Sort by volume and take top 10
    return data.pairs
      .filter((pair: DexScreenerPair) => pair.baseToken && pair.baseToken.address) // Filter out invalid pairs
      .sort((a: DexScreenerPair, b: DexScreenerPair) => 
        (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
      )
      .slice(0, 10)
      .map((pair: DexScreenerPair) => {
        // Debug log for each pair
        console.log('Processing pair:', pair);

        const priceNow = parseFloat(pair.priceUsd || '0');
        const priceChange = pair.priceChange?.h24 || 0;
        const volumeUsd = pair.volume?.h24 || 0;

        return {
          name: pair.baseToken.name || 'Unknown Token',
          symbol: pair.baseToken.symbol || 'UNKNOWN',
          price: formatCurrency(priceNow),
          change: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% (1D)`,
          isUp: priceChange >= 0,
          volume: formatCurrency(volumeUsd),
          address: pair.baseToken.address,
          logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${pair.baseToken.address}/logo.png`
        };
      });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return [];
  }
};

const Trending = () => {
  const { toast } = useToast();
  const { data: trendingTokens = [], isLoading, error } = useQuery({
    queryKey: ['trendingTokens'],
    queryFn: fetchTrendingTokens,
    refetchInterval: 30000,
    staleTime: 10000,
    gcTime: 60000,
  });

  // Show error toast if there's an error
  React.useEffect(() => {
    if (error) {
      toast({
        description: "Failed to fetch trending tokens. Please try again later.",
        duration: 3000,
      });
    }
  }, [error, toast]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      description: "Token address copied to clipboard",
      duration: 2000,
    });
  };

  const openRaydiumPage = (symbol: string) => {
    window.open(`https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${symbol}`, '_blank');
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Trending Tokens
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Discover the most popular tokens on Raydium DEX
              </p>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : trendingTokens.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg text-slate-400">
                    No trending tokens available at the moment. Please try again later.
                  </p>
                </div>
              ) : (
                trendingTokens.map((token, index) => (
                  <Card key={index} className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                          {token.logoURI ? (
                            <img 
                              src={token.logoURI} 
                              alt={token.symbol}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = token.isUp ? 
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234ade80' stroke-width='2'%3E%3Cpath d='M23 6l-9.5 9.5-5-5L1 18'/%3E%3Cpath d='M17 6h6v6'/%3E%3C/svg%3E" :
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f87171' stroke-width='2'%3E%3Cpath d='M23 18l-9.5-9.5-5 5L1 6'/%3E%3Cpath d='M17 18h6v-6'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            token.isUp ? (
                              <TrendingUp className="h-5 w-5 text-green-400" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-400" />
                            )
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{token.name}</h3>
                          <p className="text-slate-400 text-sm">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{token.price}</p>
                        <p className={`text-sm ${token.isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change}
                        </p>
                      </div>
                      <div className="text-right ml-8">
                        <p className="text-white font-medium">{token.volume}</p>
                        <p className="text-slate-400 text-sm">Volume</p>
                      </div>
                      <div className="flex gap-2 ml-8">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-white"
                          onClick={() => handleCopyAddress(token.address)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-white"
                          onClick={() => openRaydiumPage(token.symbol)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Trending;
