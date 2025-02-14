
import { useState } from "react";
import { toast } from "sonner";
import { StepTracker } from "./token/StepTracker";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";

export const TokenConfig = () => {
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    logo: null as File | null,
    decimals: "9",
    totalSupply: "1000000000",
    description: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    creatorName: "MemeMint",
    creatorWebsite: "https://mememint.co",
    modifyCreator: false,
    revokeFreeze: false,
    revokeMint: false,
    revokeUpdate: false
  });

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(img.src);
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, 500, 500);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(img.src);
            reject(new Error('Could not convert canvas to blob'));
            return;
          }
          
          const resizedFile = new File([blob], file.name, {
            type: 'image/png',
            lastModified: Date.now(),
          });
          
          URL.revokeObjectURL(img.src);
          resolve(resizedFile);
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Error loading image'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("File must be an image");
      return;
    }

    try {
      const resizedFile = await resizeImage(file);
      setTokenData(prev => ({ ...prev, logo: resizedFile }));
      toast.success("Logo uploaded and resized successfully!");
    } catch (error) {
      toast.error("Error processing image");
      console.error(error);
    }
  };

  const handleNext = () => {
    if (!tokenData.name || !tokenData.symbol || !tokenData.logo) {
      toast.error("Please fill in all fields and upload a logo");
      return;
    }
    setStep(2);
  };

  return (
    <div className="space-y-8">
      <StepTracker currentStep={step} />

      <div>
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
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <TokenSocialDetails 
            tokenData={tokenData}
            onTokenDataChange={setTokenData}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
};
