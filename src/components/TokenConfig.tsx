
import { useState } from "react";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { WalletCard } from "./token/WalletCard";
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepTracker } from "./token/StepTracker";

export const TokenConfig = () => {
  const { publicKey } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  const [tokenData, setTokenData] = useState({
    // Basic Details
    name: "",
    symbol: "",
    logo: null as File | null,
    
    // Supply Details
    decimals: "9",
    totalSupply: "1000000000",
    description: "",
    
    // Social Details
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setTokenData(prev => ({ ...prev, logo: file }));
    }
  };

  const handleCreateToken = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    try {
      // Upload logo if exists
      let logoUrl = null;
      if (tokenData.logo) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('token-logos')
          .upload(`${Date.now()}-${tokenData.logo.name}`, tokenData.logo);

        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('token-logos')
          .getPublicUrl(uploadData.path);
          
        logoUrl = publicUrl;
      }

      // Create token
      const { data: tokenResponse, error } = await supabase.functions.invoke('create-token', {
        body: {
          tokenName: tokenData.name,
          tokenSymbol: tokenData.symbol,
          decimals: parseInt(tokenData.decimals),
          initialSupply: parseInt(tokenData.totalSupply.replace(/,/g, '')),
          ownerAddress: publicKey.toString()
        }
      });

      if (error) throw error;

      if (!tokenResponse.success) {
        throw new Error(tokenResponse.error || 'Failed to create token');
      }

      // Update token details in database
      const { error: dbError } = await supabase
        .from('tokens')
        .update({
          description: tokenData.description,
          website: tokenData.website,
          twitter: tokenData.twitter,
          telegram: tokenData.telegram,
          discord: tokenData.discord,
          logo_url: logoUrl
        })
        .eq('mint_address', tokenResponse.mintAddress);

      if (dbError) throw dbError;

      toast.success('Token created successfully!', {
        description: `Mint address: ${tokenResponse.mintAddress}`
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

    } catch (err) {
      console.error('Error creating token:', err);
      toast.error('Failed to create token', {
        description: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
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
            onCreateToken={handleCreateToken}
            isCreating={isCreating}
          />
        )}
      </div>
      
      <div className="md:col-span-1">
        <WalletCard />
      </div>
    </div>
  );
};
