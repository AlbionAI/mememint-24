
import { useState } from "react";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { WalletCard } from "./token/WalletCard";
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from "sonner";
import { StepTracker } from "./token/StepTracker";
import { 
  Transaction, 
  Connection, 
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

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

      // Connect to Solana devnet
      const connection = new Connection('https://api.devnet.solana.com', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
      });

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log('Initial blockhash:', blockhash);

      // Calculate fees
      const fees = calculateFees();
      console.log('Calculated fees:', fees);

      // Create a new transaction
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash: blockhash,
        lastValidBlockHeight: 100000000
      });

      // Add transfer instruction for fees
      const FEE_COLLECTOR_ADDRESS = new PublicKey('YourFeeCollectorAddressHere');
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: FEE_COLLECTOR_ADDRESS,
          lamports: fees * LAMPORTS_PER_SOL
        })
      );

      // Sign and send transaction
      try {
        toast.loading('Please approve the transaction in your wallet...', { id: creationToast });
        
        // Sign with the user's wallet
        const signedTransaction = await signTransaction(transaction);
        console.log('Transaction signed successfully');

        // Send transaction
        toast.loading('Sending transaction...', { id: creationToast });
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Confirm transaction
        toast.loading('Confirming transaction...', { id: creationToast });
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          throw new Error('Transaction failed on chain');
        }

        // Success!
        toast.success('Token created successfully!', {
          id: creationToast,
          description: `Transaction signature: ${signature}`
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
