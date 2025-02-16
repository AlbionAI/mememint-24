
import { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { StepTracker } from "./token/StepTracker";

export const TokenConfig = () => {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    supply: "",
    website: "",
    twitter: "",
    telegram: ""
  });

  const handleCreateToken = async () => {
    if (!publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletPublicKey: publicKey.toString(),
          ...formData,
          addMetadata: true,
          mintAuthority: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create token');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Token created successfully!",
      });
      
      // Reset form
      setFormData({
        name: "",
        symbol: "",
        description: "",
        supply: "",
        website: "",
        twitter: "",
        telegram: ""
      });
      setCurrentStep(1);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-6">
      <StepTracker currentStep={currentStep} />
      
      {currentStep === 1 && (
        <TokenBasicDetails
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep(2)}
        />
      )}
      
      {currentStep === 2 && (
        <TokenSupplyDetails
          formData={formData}
          setFormData={setFormData}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      )}
      
      {currentStep === 3 && (
        <TokenSocialDetails
          formData={formData}
          setFormData={setFormData}
          onBack={() => setCurrentStep(2)}
          isCreating={isCreating}
          onSubmit={handleCreateToken}
        />
      )}
    </Card>
  );
};
