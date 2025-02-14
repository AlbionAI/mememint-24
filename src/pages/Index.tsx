
import { TokenForm } from "@/components/TokenForm";
import { LaunchStatus } from "@/components/LaunchStatus";
import { Navigation } from "@/components/Navigation";
import { Waves } from "@/components/ui/waves-background";

const Index = () => {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[#2A0134] relative pt-20">
        <Waves 
          lineColor="rgba(255, 255, 255, 0.1)"
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
          className="z-0"
        />
        <div className="container px-4 py-8 mx-auto relative z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white tracking-tight">Launch Tokens</h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">No coding required, launched in seconds.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <TokenForm />
              </div>
              <div className="space-y-6">
                <LaunchStatus />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
