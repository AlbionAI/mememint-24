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
      // Handle logo upload first if present
      let logoUrl = null;
      if (tokenData.logo) {
        console.log('Uploading logo...');
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

      // Create token parameters
      console.log('Creating token with parameters:', {
        tokenName: tokenData.name,
        tokenSymbol: tokenData.symbol,
        decimals: Number(tokenData.decimals),
        initialSupply: Number(tokenData.totalSupply.replace(/,/g, '')),
        ownerAddress: publicKey.toString()
      });

      const { data: tokenResponse, error: functionError } = await supabase.functions.invoke('create-token', {
        body: JSON.stringify({
          tokenName: tokenData.name,
          tokenSymbol: tokenData.symbol,
          decimals: Number(tokenData.decimals),
          initialSupply: Number(tokenData.totalSupply.replace(/,/g, '')),
          ownerAddress: publicKey.toString()
        })
      });

      if (functionError || !tokenResponse?.success) {
        console.error('Token creation function error:', functionError || tokenResponse?.error);
        throw new Error(functionError?.message || tokenResponse?.error || 'Failed to create token');
      }

      console.log('Token creation response:', tokenResponse);

      // Get RPC URL
      const { data: { rpcUrl }, error: rpcError } = await supabase.functions.invoke('get-rpc-url');
      if (rpcError) {
        console.error('RPC URL fetch error:', rpcError);
        throw new Error('Failed to get RPC URL');
      }

      const connection = new Connection(rpcUrl, 'confirmed');

      try {
        console.log('Processing transaction...');
        
        // Decode base64 transaction
        const transactionBuffer = Uint8Array.from(atob(tokenResponse.transaction), c => c.charCodeAt(0));
        const transaction = Transaction.from(transactionBuffer);
        
        console.log('Transaction details:', {
          feePayer: transaction.feePayer?.toString(),
          recentBlockhash: transaction.recentBlockhash,
          instructions: transaction.instructions.length
        });

        // Update blockhash
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        console.log('Updated blockhash:', blockhash);

        // Sign transaction
        console.log('Requesting wallet signature...');
        let signedTransaction;
        try {
          signedTransaction = await signTransaction(transaction);
          console.log('Transaction signed successfully');
        } catch (error: any) {
          console.error('Wallet signing error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          if (error.name === 'WalletSignTransactionError') {
            if (error.message.includes('User rejected')) {
              throw new Error('Transaction rejected by user');
            }
            throw new Error('Failed to sign transaction. Please try again');
          }
          throw error;
        }

        // Send transaction
        console.log('Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log('Transaction sent:', signature);

        // Wait for confirmation
        console.log('Awaiting confirmation...');
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          console.error('Transaction error:', confirmation.value.err);
          throw new Error('Transaction failed on chain');
        }

        // Save token metadata
        const { mintAddress } = tokenResponse;
        const metadata = {
          mint_address: mintAddress,
          token_name: tokenData.name,
          token_symbol: tokenData.symbol,
          decimals: Number(tokenData.decimals),
          ...(tokenData.description ? { description: tokenData.description } : {}),
          ...(tokenData.website ? { website: tokenData.website } : {}),
          ...(tokenData.twitter ? { twitter: tokenData.twitter } : {}),
          ...(tokenData.telegram ? { telegram: tokenData.telegram } : {}),
          ...(tokenData.discord ? { discord: tokenData.discord } : {}),
          ...(logoUrl ? { logo_url: logoUrl } : {}),
          owner_address: publicKey.toString(),
          created_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('tokens')
          .insert(metadata);

        if (dbError) {
          console.warn('Failed to save token metadata:', dbError);
          toast.warning('Token created, but failed to save additional details');
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

      } catch (error: any) {
        console.error('Transaction error:', error);
        if (error.name === 'WalletSignTransactionError') {
          if (error.message.includes('User rejected')) {
            toast.error('Please approve the transaction in your wallet');
          } else {
            toast.error('Failed to sign transaction', {
              description: 'Please try again or use a different wallet'
            });
          }
        } else {
          toast.error('Transaction failed', {
            description: error.message || 'Failed to process transaction'
          });
        }
        throw error;
      }

    } catch (error: any) {
      console.error('Token creation error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      if (!errorMessage.includes('Please approve')) {
        toast.error('Failed to create token', {
          description: errorMessage.includes('insufficient funds')
            ? 'Insufficient SOL balance for transaction fees'
            : errorMessage
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
