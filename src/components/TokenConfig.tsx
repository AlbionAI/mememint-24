
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
  SystemProgram, 
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
  createMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction
} from '@solana/spl-token';

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
  const { publicKey, signTransaction } = useWallet();
  
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

      // Create transaction for token mint
      const transaction = new Transaction();
      
      // Add create account instruction
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rent,
          programId: TOKEN_PROGRAM_ID
        })
      );

      // Add initialize mint instruction
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          parseInt(tokenData.decimals),
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        )
      );

      // Get the associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );

      // Add create associated token account instruction
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAccount,
          publicKey,
          mintKeypair.publicKey
        )
      );

      // Add mint to instruction
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAccount,
          publicKey,
          parseInt(tokenData.totalSupply) * Math.pow(10, parseInt(tokenData.decimals))
        )
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Partial sign with the mint account
      transaction.partialSign(mintKeypair);

      // Request wallet signature
      const signedTx = await signTransaction(transaction);
      
      // Send and confirm transaction
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid);

      toast.success('Token created successfully!');
      console.log('Token mint address:', mintKeypair.publicKey.toBase58());
      console.log('Associated token account:', associatedTokenAccount.toBase58());
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
      <StepTracker currentStep={currentStep} />
      
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
