
import { useState } from "react";
import { StepTracker } from "./token/StepTracker";
import { TokenDetailsStep } from "./token/TokenDetailsStep";
import { TokenSupplyStep } from "./token/TokenSupplyStep";
import { TokenSocialStep } from "./token/TokenSocialStep";
import { WalletCard } from "./token/WalletCard";
import { TokenData } from "@/types/token";

export const TokenConfig = () => {
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState<TokenData>({
    name: "",
    symbol: "",
    logo: null,
    decimals: "9",
    totalSupply: "1000000000",
    description: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    creatorName: "CoinFast",
    creatorWebsite: "https://coinfast.fun",
    revokeFreeze: false,
    revokeMint: false,
    revokeUpdate: false
  });

  return (
    <div className="space-y-8">
      <StepTracker currentStep={step} />

      {step === 1 && (
        <div className="grid gap-8 md:grid-cols-2">
          <TokenDetailsStep 
            tokenData={tokenData}
            setTokenData={setTokenData}
            onNext={() => setStep(2)}
          />
          <WalletCard />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-8 md:grid-cols-2">
          <TokenSupplyStep 
            tokenData={tokenData}
            setTokenData={setTokenData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
          <WalletCard />
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-8 md:grid-cols-2">
          <TokenSocialStep 
            tokenData={tokenData}
            setTokenData={setTokenData}
            onBack={() => setStep(2)}
            onSubmit={() => console.log('Creating token:', tokenData)}
          />
          <WalletCard />
        </div>
      )}
    </div>
  );
};
