
import { useState } from "react";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { WalletCard } from "./token/WalletCard";
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepTracker } from "./token/StepTracker";
import { Transaction, Connection } from '@solana/web3.js';

export const TokenConfig = () => {
  const { publicKey, signTransaction } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
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
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setTokenData(prev => ({ ...prev, logo: file }));
    }
  };

  const handleCreateToken = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!tokenData.name || !tokenData.symbol) {
      toast.error('Token name and symbol are required');
      return;
    }

    setIsCreating(true);
    try {
      let logoUrl = null;
      if (tokenData.logo) {
        console.log('Starting logo upload process...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('token-logos')
          .upload(`${Date.now()}-${tokenData.logo.name}`, tokenData.logo);

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          throw new Error(`Failed to upload logo: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('token-logos')
          .getPublicUrl(uploadData.path);
          
        logoUrl = publicUrl;
        console.log('Logo uploaded successfully:', logoUrl);
      }

      const createTokenParams = {
        tokenName: tokenData.name,
        tokenSymbol: tokenData.symbol,
        decimals: parseInt(tokenData.decimals),
        initialSupply: parseInt(tokenData.totalSupply.replace(/,/g, '')),
        ownerAddress: publicKey.toString()
      };

      console.log('Attempting to create token with params:', createTokenParams);

      const { data: tokenResponse, error: functionError } = await supabase.functions.invoke('create-token', {
        body: JSON.stringify(createTokenParams)
      });

      console.log('Raw token creation response:', tokenResponse);
      
      if (functionError || !tokenResponse.success) {
        throw new Error(functionError?.message || tokenResponse?.error || 'Failed to create token');
      }

      // Get the RPC URL through the edge function
      const { data: { rpcUrl }, error: rpcError } = await supabase.functions.invoke('get-rpc-url');
      
      if (rpcError) {
        throw new Error('Failed to get RPC URL');
      }

      // Create connection to Solana using the provided RPC URL
      const connection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 120000 // Increased timeout
      });

      try {
        // Decode base64 transaction
        const transactionBuffer = Uint8Array.from(atob(tokenResponse.transaction), c => c.charCodeAt(0));
        
        // Create transaction from buffer and prepare it
        const transaction = Transaction.from(transactionBuffer);
        console.log('Transaction decoded:', transaction);

        // Get fresh blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        
        console.log('Requesting transaction signature...');
        const signedTransaction = await signTransaction(transaction);
        console.log('Transaction signed successfully');

        console.log('Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: true,
          maxRetries: 5,
          preflightCommitment: 'finalized'
        });
        console.log('Transaction sent:', signature);

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'finalized');

        console.log('Confirmation received:', confirmation);

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        // Store token details in Supabase
        const { mintAddress } = tokenResponse;
        const optionalFields = {
          ...(tokenData.description ? { description: tokenData.description } : {}),
          ...(tokenData.website ? { website: tokenData.website } : {}),
          ...(tokenData.twitter ? { twitter: tokenData.twitter } : {}),
          ...(tokenData.telegram ? { telegram: tokenData.telegram } : {}),
          ...(tokenData.discord ? { discord: tokenData.discord } : {}),
          ...(logoUrl ? { logo_url: logoUrl } : {})
        };

        if (Object.keys(optionalFields).length > 0) {
          const { error: dbError } = await supabase
            .from('tokens')
            .update(optionalFields)
            .eq('mint_address', mintAddress);

          if (dbError) {
            console.warn('Warning: Failed to update optional token details:', dbError);
            toast.warning('Token created, but failed to save additional details');
          }
        }

        toast.success('Token created successfully!', {
          description: `Mint address: ${mintAddress}`
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
        console.error('Transaction processing error:', error);
        throw new Error(`Failed to process transaction: ${error.message}`);
      }

    } catch (err) {
      console.error('Full error details:', err);
      
      let errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance to create token. Please make sure you have enough SOL to cover the transaction fees.';
      }
      
      toast.error('Failed to create token', {
        description: errorMessage
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
