
import { TokenForm } from "@/components/TokenForm";
import { LaunchStatus } from "@/components/LaunchStatus";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Token Launcher
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Launch your token on Raydium DEX with our streamlined process
            </p>
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
  );
};

export default Index;
