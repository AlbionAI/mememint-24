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
  Keypair,
  SystemProgram
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
      
      const balance = await connection.getBalance(publicKey);
      const minimumBalance = LAMPORTS_PER_SOL / 10; // Require at least 0.1 SOL
      
      if (balance < minimumBalance) {
        toast.error('Insufficient SOL balance. You need at least 0.1 SOL to create a token.');
        return;
      }
      
      const mintKeypair = Keypair.generate();
      
      const rent = await getMinimumBalanceForRentExemptMint(connection);

      const transaction = new Transaction();
      
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rent,
          programId: TOKEN_PROGRAM_ID
        })
      );

      transaction.add(
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

      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAccount,
          publicKey,
          mintKeypair.publicKey
        )
      );

      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAccount,
          publicKey,
          parseInt(tokenData.totalSupply) * Math.pow(10, parseInt(tokenData.decimals))
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.partialSign(mintKeypair);

      const signedTx = await signTransaction(transaction);
      
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      const confirmation = await connection.confirmTransaction(txid);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      toast.success('Token created successfully!');
      console.log('Token mint address:', mintKeypair.publicKey.toBase58());
      console.log('Transaction signature:', txid);
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
