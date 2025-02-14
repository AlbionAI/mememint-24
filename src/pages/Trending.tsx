import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

const Trending = () => {
  const trendingTokens = [
    {
      name: "Sample Token 1",
      symbol: "ST1",
      price: "0.000234",
      change: "+15.2%",
      isUp: true,
      volume: "123.4K",
    },
    {
      name: "Sample Token 2",
      symbol: "ST2",
      price: "0.000567",
      change: "-5.8%",
      isUp: false,
      volume: "89.2K",
    },
  ];

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
              {trendingTokens.map((token, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Trending;
