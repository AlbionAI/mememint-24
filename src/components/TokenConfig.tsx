
import { useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { StepTracker } from "./token/StepTracker";
import { BACKEND_URL } from "@/config/env";
import { supabase } from "@/integrations/supabase/client";

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
  const [session, setSession] = useState(null);
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Current session:', currentSession);
        setSession(currentSession);
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('token_logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('token_logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTokenData({ ...tokenData, logo: e.target.files[0] });
    }
  };

  const handleCreateToken = async () => {
    console.log('Starting token creation process...');
    
    if (!publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    // Check session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    console.log('Checking current session before request:', currentSession);

    if (!currentSession) {
      toast({
        title: "Error",
        description: "Please sign in to create a token. Your session may have expired.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      let logoUrl = null;
      if (tokenData.logo) {
        logoUrl = await uploadLogo(tokenData.logo);
        if (!logoUrl) {
          throw new Error('Failed to upload logo');
        }
      }

      const requestBody = {
        walletPublicKey: publicKey.toString(),
        ...tokenData,
        logoUrl,
        addMetadata: true,
        mintAuthority: true
      };
      
      const response = await fetch(`${BACKEND_URL}/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
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
          handleCreateToken={handleCreateToken}
          isCreating={isCreating}
        />
      )}
    </Card>
  );
};
