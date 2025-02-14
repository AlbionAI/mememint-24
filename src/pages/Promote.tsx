
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Rocket, Award, Zap, ChevronRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";

const Promote = () => {
  const promotionPlans = [
    {
      title: "Basic Promotion",
      price: "0.1 SOL",
      features: [
        "24 Hour Trending List",
        "Social Media Share",
        "Community Notification"
      ],
      icon: Rocket
    },
    {
      title: "Premium Promotion",
      price: "0.5 SOL",
      features: [
        "7 Days Trending List",
        "Featured Token Badge",
        "Social Media Campaign",
        "Priority Support"
      ],
      icon: Award
    }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[#0B1120] relative">
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundBeams className="opacity-50" />
        </div>
        <div className="relative z-10 pt-20">
          <div className="container px-4 py-8 mx-auto">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  Promote Your Token
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Boost your token's visibility and reach more investors
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {promotionPlans.map((plan, index) => (
                  <Card key={index} className="p-6 bg-[#0F172A]/50 backdrop-blur-sm border border-slate-800 hover:border-[#9D8DF4]/50 transition-all duration-300">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-[#151F38] flex items-center justify-center">
                          <plan.icon className="h-6 w-6 text-[#9D8DF4]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{plan.title}</h3>
                          <p className="text-[#9D8DF4] font-medium">{plan.price}</p>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-2 text-slate-300">
                            <Zap className="h-4 w-4 text-[#9D8DF4]" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className="w-full bg-[#9D8DF4] hover:bg-[#8B7BE3] text-white font-medium transition-colors"
                      >
                        Select Plan
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 bg-[#0F172A]/50 backdrop-blur-sm border border-slate-800">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Token Details</h3>
                    <p className="text-sm text-slate-400">Enter your token information for promotion</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Token Address</Label>
                      <Input 
                        placeholder="Enter token address" 
                        className="bg-[#0B1120]/80 border-slate-800 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Contact Email</Label>
                      <Input 
                        type="email"
                        placeholder="Enter your email" 
                        className="bg-[#0B1120]/80 border-slate-800 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Promote;
