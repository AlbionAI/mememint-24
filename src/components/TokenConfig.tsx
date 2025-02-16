
import { useState } from "react";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from "sonner";
import { StepTracker } from "./token/StepTracker";
import { 
  Connection, 
  PublicKey, 
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction
} from '@solana/spl-token';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const { publicKey, signTransaction, disconnect } = useWallet();
  
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

  const handleCreateToken = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    try {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      
      // Generate a new keypair for the mint
      const mintKeypair = Keypair.generate();
      
      // Calculate rent-exempt balance
      const rent = await getMinimumBalanceForRentExemptMint(connection);

      // Create two separate transactions: one for the fee and one for token creation
      const feeTransaction = new Transaction();
      const tokenTransaction = new Transaction();

      // Add instructions to the token transaction
      tokenTransaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rent,
          programId: TOKEN_PROGRAM_ID
        })
      );

      tokenTransaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          parseInt(tokenData.decimals),
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        )
      );

      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );

      tokenTransaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAccount,
          publicKey,
          mintKeypair.publicKey
        )
      );

      tokenTransaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAccount,
          publicKey,
          parseInt(tokenData.totalSupply) * Math.pow(10, parseInt(tokenData.decimals))
        )
      );

      // Get recent blockhash for both transactions
      const { blockhash } = await connection.getLatestBlockhash();
      feeTransaction.recentBlockhash = blockhash;
      tokenTransaction.recentBlockhash = blockhash;
      feeTransaction.feePayer = publicKey;
      tokenTransaction.feePayer = publicKey;

      // Partial sign the token transaction with the mint keypair
      tokenTransaction.partialSign(mintKeypair);

      // Request wallet signature for both transactions
      const signedFeeTransaction = await signTransaction(feeTransaction);
      const signedTokenTransaction = await signTransaction(tokenTransaction);

      // Call the Supabase Edge Function to execute the transactions
      const { data, error } = await supabase.functions.invoke('execute-transactions', {
        body: {
          feeTransaction: Buffer.from(signedFeeTransaction.serialize()).toString('base64'),
          tokenTransaction: Buffer.from(signedTokenTransaction.serialize()).toString('base64'),
          mintAddress: mintKeypair.publicKey.toBase58()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Token created successfully!');
        console.log('Token mint address:', data.mintAddress);
        console.log('Fee transaction:', data.feeSignature);
        console.log('Token transaction:', data.tokenSignature);
      } else {
        throw new Error(data.error || 'Failed to create token');
      }
    } catch (error) {
      console.error('Token creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTokenData(prev => ({
        ...prev,
        logo: e.target.files![0]
      }));
    }
  };

  const onTokenDataChange = (newData: TokenData) => {
    setTokenData(newData);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <StepTracker currentStep={currentStep} />
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-all duration-200"
        >
          Disconnect Wallet
        </button>
      </div>
      
      <div className="grid gap-8">
        {currentStep === 1 && (
          <TokenBasicDetails
            tokenData={tokenData}
            onTokenDataChange={onTokenDataChange}
            onNext={() => setCurrentStep(2)}
            handleFileChange={handleFileChange}
          />
        )}
        
        {currentStep === 2 && (
          <TokenSupplyDetails
            tokenData={tokenData}
            onTokenDataChange={onTokenDataChange}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}
        
        {currentStep === 3 && (
          <TokenSocialDetails
            tokenData={tokenData}
            onTokenDataChange={onTokenDataChange}
            onBack={() => setCurrentStep(2)}
            isCreating={isCreating}
            onCreateToken={handleCreateToken}
          />
        )}
      </div>
    </div>
  );
};
