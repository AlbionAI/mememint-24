
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

interface Token {
  name: string;
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
  volume: string;
}

const LoadingSkeleton = () => (
  <>
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
  </>
);

const fetchTrendingTokens = async (): Promise<Token[]> => {
  try {
    const response = await fetch('https://api.raydium.io/v2/main/pairs');
    const data = await response.json();
    
    // Sort by volume and take top 10
    return data
      .sort((a: any, b: any) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
      .slice(0, 10)
      .map((token: any) => ({
        name: token.name || token.tokenSymbol,
        symbol: token.tokenSymbol,
        price: parseFloat(token.price).toFixed(6),
        change: `${parseFloat(token.priceChange24h).toFixed(2)}%`,
        isUp: parseFloat(token.priceChange24h) >= 0,
        volume: `${(parseFloat(token.volume24h) / 1000).toFixed(1)}K`,
      }));
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return [];
  }
};

const Trending = () => {
  const { data: trendingTokens = [], isLoading } = useQuery({
    queryKey: ['trendingTokens'],
    queryFn: fetchTrendingTokens,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 60000, // Keep data in cache for 1 minute (formerly cacheTime)
  });

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
              ) : (
                trendingTokens.map((token, index) => (
                  <Card key={index} className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          {token.isUp ? (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{token.name}</h3>
                          <p className="text-slate-400 text-sm">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${token.price}</p>
                        <p className={`text-sm ${token.isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change}
                        </p>
                      </div>
                      <div className="text-right ml-8">
                        <p className="text-white font-medium">${token.volume}</p>
                        <p className="text-slate-400 text-sm">Volume</p>
                      </div>
                      <div className="flex gap-2 ml-8">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
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
