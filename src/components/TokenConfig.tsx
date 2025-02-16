
import { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { StepTracker } from "./token/StepTracker";
import { BACKEND_URL } from "@/config/env";

type TokenData = {
  name: string;
  symbol: string;
  logo: File | null;
  decimals: string;
  totalSupply: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
  creatorName: string;
  creatorWebsite: string;
  modifyCreator: boolean;
  revokeFreeze: boolean;
  revokeMint: boolean;
  revokeUpdate: boolean;
}

export const TokenConfig = () => {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
    creatorName: "",
    creatorWebsite: "",
    modifyCreator: true,
    revokeFreeze: true,
    revokeMint: true,
    revokeUpdate: true
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTokenData({ ...tokenData, logo: e.target.files[0] });
    }
  };

  const handleCreateToken = async () => {
    console.log('Starting token creation process...');
    console.log('Backend URL:', BACKEND_URL);
    
    if (!publicKey) {
      console.log('No wallet connected');
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    console.log('Wallet connected:', publicKey.toString());
    console.log('Token data being sent:', tokenData);

    setIsCreating(true);
    try {
      const requestBody = {
        walletPublicKey: publicKey.toString(),
        ...tokenData,
        addMetadata: true,
        mintAuthority: true
      };
      
      console.log('Sending request to:', `${BACKEND_URL}/api/create-token`);
      console.log('Request body:', requestBody);

      const response = await fetch(`${BACKEND_URL}/api/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create token: ${errorText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      toast({
        title: "Success",
        description: "Token created successfully!",
      });
      
      // Reset form
      setTokenData({
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
        creatorName: "",
        creatorWebsite: "",
        modifyCreator: true,
        revokeFreeze: true,
        revokeMint: true,
        revokeUpdate: true
      });
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error details:', error);
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
          tokenData={tokenData}
          onTokenDataChange={setTokenData}
          onNext={() => setCurrentStep(2)}
          handleFileChange={handleFileChange}
        />
      )}
      
      {currentStep === 2 && (
        <TokenSupplyDetails
          tokenData={tokenData}
          onTokenDataChange={setTokenData}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      )}
      
      {currentStep === 3 && (
        <TokenSocialDetails
          tokenData={tokenData}
          onTokenDataChange={setTokenData}
          onBack={() => setCurrentStep(2)}
        />
      )}
    </Card>
  );
};
