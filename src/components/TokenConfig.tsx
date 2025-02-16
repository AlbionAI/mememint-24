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

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 500;
        canvas.height = 500;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, 500, 500);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/png',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            }
          }, 'image/png', 1);
        }
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      try {
        const resizedFile = await resizeImage(file);
        setTokenData(prev => ({ ...prev, logo: resizedFile }));
        toast.success('Image uploaded and resized to 500x500!');
      } catch (error) {
        toast.error('Failed to process image');
        console.error('Image processing error:', error);
      }
    }
  };

  const calculateFees = () => {
    let fees = 0.05;
    if (tokenData.modifyCreator) fees += 0.1;
    if (tokenData.revokeFreeze) fees += 0.1;
    if (tokenData.revokeMint) fees += 0.1;
    if (tokenData.revokeUpdate) fees += 0.1;
    return fees;
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
    let creationToast;

    try {
      creationToast = toast.loading('Preparing token creation...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      let logoUrl = null;
      if (tokenData.logo) {
        toast.loading('Uploading logo...', { id: creationToast });
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

      toast.loading('Connecting to Solana...', { id: creationToast });
      const connection = new Connection('https://api.devnet.solana.com');
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log('Initial blockhash:', blockhash);

      const fees = calculateFees();
      console.log('Calculated fees:', fees);

      toast.loading('Creating token transaction...', { id: creationToast });
      const { data: tokenResponse, error: functionError } = await supabase.functions.invoke('create-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: {
          tokenName: tokenData.name,
          tokenSymbol: tokenData.symbol,
          decimals: Number(tokenData.decimals),
          initialSupply: Number(tokenData.totalSupply.replace(/,/g, '')),
          ownerAddress: publicKey.toString(),
          blockhash,
          fees,
          website: tokenData.website,
          twitter: tokenData.twitter,
          telegram: tokenData.telegram,
          discord: tokenData.discord,
          description: tokenData.description,
          revokeFreeze: tokenData.revokeFreeze,
          revokeMint: tokenData.revokeMint,
          revokeUpdate: tokenData.revokeUpdate
        }
      });

      if (functionError || !tokenResponse?.success) {
        console.error('Token creation function error:', functionError || tokenResponse?.error);
        throw new Error(functionError?.message || tokenResponse?.error || 'Failed to create token');
      }

      console.log('Token creation response:', tokenResponse);

      try {
        toast.loading(`Please approve the transaction (${fees} SOL)...`, { id: creationToast });
        
        const transactionBuffer = Uint8Array.from(atob(tokenResponse.transaction), c => c.charCodeAt(0));
        const transaction = Transaction.from(transactionBuffer);
        
        console.log('Transaction details:', {
          feePayer: transaction.feePayer?.toString(),
          recentBlockhash: transaction.recentBlockhash,
          instructions: transaction.instructions.length,
          totalFees: fees
        });

        const signedTransaction = await signTransaction(transaction);
        console.log('Transaction signed successfully');

        toast.loading('Sending transaction...', { id: creationToast });
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 5
        });
        console.log('Transaction sent:', signature);

        toast.loading('Waiting for confirmation...', { id: creationToast });
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          console.error('Transaction error:', confirmation.value.err);
          throw new Error('Transaction failed on chain');
        }

        const { mintAddress } = tokenResponse;
        const metadata = {
          mint_address: mintAddress,
          token_name: tokenData.name,
          token_symbol: tokenData.symbol,
          decimals: Number(tokenData.decimals),
          description: tokenData.description || null,
          website: tokenData.website || null,
          twitter: tokenData.twitter || null,
          telegram: tokenData.telegram || null,
          discord: tokenData.discord || null,
          logo_url: logoUrl,
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
          id: creationToast,
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
        if (error.name === 'WalletSignTransactionError') {
          if (error.message.includes('User rejected')) {
            toast.error('Transaction cancelled', {
              id: creationToast,
              description: 'You declined the transaction in your wallet'
            });
          } else {
            toast.error('Failed to sign transaction', {
              id: creationToast,
              description: 'Please try again or use a different wallet'
            });
          }
        } else {
          toast.error('Transaction failed', {
            id: creationToast,
            description: error.message || 'Failed to process transaction'
          });
        }
        throw error;
      }

    } catch (error: any) {
      console.error('Token creation error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      if (!errorMessage.includes('Transaction cancelled')) {
        toast.error('Failed to create token', {
          id: creationToast,
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
