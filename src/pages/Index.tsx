
import { TokenForm } from "@/components/TokenForm";
import { LaunchStatus } from "@/components/LaunchStatus";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  return <>
    <Navigation />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <div className="container px-4 py-8 mx-auto">
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
  </>;
};

export default Index;
