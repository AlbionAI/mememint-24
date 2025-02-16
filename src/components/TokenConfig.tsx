
import { useState } from "react";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { WalletCard } from "./token/WalletCard";
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepTracker } from "./token/StepTracker";
import { Transaction, Connection, PublicKey } from '@solana/web3.js';

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
        console.log('Starting logo upload...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('token-logos')
          .upload(`${Date.now()}-${tokenData.logo.name}`, tokenData.logo);

        if (uploadError) throw new Error(`Failed to upload logo: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from('token-logos')
          .getPublicUrl(uploadData.path);
          
        logoUrl = publicUrl;
        console.log('Logo uploaded:', logoUrl);
      }

      const createTokenParams = {
        tokenName: tokenData.name,
        tokenSymbol: tokenData.symbol,
        decimals: Number(tokenData.decimals),
        initialSupply: Number(tokenData.totalSupply.replace(/,/g, '')),
        ownerAddress: publicKey.toString()
      };

      console.log('Creating token with params:', createTokenParams);

      const { data: tokenResponse, error: functionError } = await supabase.functions.invoke('create-token', {
        body: JSON.stringify(createTokenParams)
      });

      if (functionError || !tokenResponse?.success) {
        throw new Error(functionError?.message || tokenResponse?.error || 'Failed to create token');
      }

      const { data: { rpcUrl }, error: rpcError } = await supabase.functions.invoke('get-rpc-url');
      if (rpcError) throw new Error('Failed to get RPC URL');

      const connection = new Connection(rpcUrl, { commitment: 'confirmed' });

      try {
        console.log('Decoding transaction...');
        const transactionBytes = Uint8Array.from(atob(tokenResponse.transaction), c => c.charCodeAt(0));
        const transaction = Transaction.from(transactionBytes);
        console.log('Transaction decoded:', transaction);

        // Get fresh blockhash
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        console.log('Requesting signature...', {
          numInstructions: transaction.instructions.length,
          feePayer: transaction.feePayer?.toBase58(),
          recentBlockhash: transaction.recentBlockhash
        });

        // Sign and send transaction with retries
        let signedTransaction;
        try {
          signedTransaction = await signTransaction(transaction);
          console.log('Transaction signed successfully');
        } catch (error: any) {
          console.error('Signing error:', error);
          if (error?.name === 'WalletSignTransactionError') {
            throw new Error('Failed to sign transaction. Please try again and approve the transaction in your wallet.');
          }
          throw error;
        }

        console.log('Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 5
        });
        console.log('Transaction sent:', signature);

        console.log('Confirming transaction...');
        const { value: status } = await connection.confirmTransaction(signature, 'confirmed');
        
        if (status.err) {
          console.error('Transaction failed:', status.err);
          throw new Error('Transaction failed on chain. Please try again.');
        }

        console.log('Transaction confirmed successfully');

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
            console.warn('Failed to save token details:', dbError);
            toast.warning('Token created, but failed to save additional details');
          }
        }

        toast.success('Token created successfully!', {
          description: `Mint address: ${mintAddress}`
        });

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

      } catch (error: any) {
        console.error('Transaction error:', error);
        const errorMessage = error.message || 'Transaction failed';
        
        // Handle specific wallet errors
        if (error?.name === 'WalletSignTransactionError') {
          toast.error('Failed to sign transaction', {
            description: 'Please try again and approve the transaction in your wallet'
          });
        } else {
          toast.error('Transaction failed', { description: errorMessage });
        }
        throw error;
      }

    } catch (error: any) {
      console.error('Token creation error:', error);
      const message = error.message || 'Unknown error occurred';
      
      if (!message.includes('Failed to sign transaction')) {
        toast.error('Failed to create token', {
          description: message.includes('insufficient funds')
            ? 'Insufficient SOL balance. Please make sure you have enough SOL to cover the transaction fees.'
            : message
        });
      }
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
