
import { useState } from "react";
import { TokenBasicDetails } from "@/components/token/TokenBasicDetails";
import { TokenSupplyDetails } from "@/components/token/TokenSupplyDetails";
import { TokenSocialDetails } from "@/components/token/TokenSocialDetails";
import { StepTracker } from "@/components/token/StepTracker";
import { TokenCreation } from "@/components/TokenCreation";
import { toast } from "sonner";

export const TokenConfig = () => {
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    logo: null as File | null,
    decimals: "",
    totalSupply: "",
    description: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    creatorName: "",
    creatorWebsite: "",
    modifyCreator: true,
    revokeFreeze: true,
    revokeMint: true,
    revokeUpdate: true
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    setTokenData({ ...tokenData, logo: file });
  };

  const handleNext = () => {
    if (step === 1 && (!tokenData.name || !tokenData.symbol || !tokenData.logo)) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return (
    <div className="space-y-8">
      <StepTracker currentStep={step} />
      
      {step === 1 && (
        <TokenBasicDetails 
          tokenData={tokenData}
          onTokenDataChange={setTokenData}
          onNext={handleNext}
          handleFileChange={handleFileChange}
        />
      )}
      
      {step === 2 && (
        <TokenSupplyDetails 
          tokenData={tokenData}
          onTokenDataChange={setTokenData}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}
      
      {step === 3 && (
        <TokenSocialDetails 
          tokenData={tokenData}
          onTokenDataChange={setTokenData}
          onBack={handleBack}
        />
      )}

      {step === 4 && (
        <TokenCreation />
      )}
    </div>
  );
};
