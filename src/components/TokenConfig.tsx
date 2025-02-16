
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
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import {
  DataV2,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { Metaplex } from "@metaplex-foundation/js";
import Arweave from 'arweave';

// Polyfill Buffer
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

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

  const uploadToArweave = async (file: File): Promise<string> => {
    try {
      const reader = new FileReader();
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const transaction = await arweave.createTransaction({ data: buffer });
      transaction.addTag('Content-Type', file.type);

      const wallet = await arweave.wallets.generate();
      await arweave.transactions.sign(transaction, wallet);
      
      const response = await arweave.transactions.post(transaction);
      if (response.status !== 200) throw new Error('Failed to upload to Arweave');

      return `https://arweave.net/${transaction.id}`;
    } catch (error) {
      console.error('Arweave upload error:', error);
      throw new Error('Failed to upload image to Arweave');
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
    let creationToast = toast.loading('Preparing token creation...');

    try {
      // Connect to Solana devnet
      const connection = new Connection('https://api.devnet.solana.com', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
      });

      // Upload logo to Arweave if provided
      let logoUrl = null;
      if (tokenData.logo) {
        toast.loading('Uploading logo to Arweave...', { id: creationToast });
        logoUrl = await uploadToArweave(tokenData.logo);
      }

      // Create mint account
      toast.loading('Creating mint account...', { id: creationToast });
      const mintKeypair = Keypair.generate();
      const decimals = Number(tokenData.decimals);
      
      const lamports = await connection.getMinimumBalanceForRentExemption(82);
      
      // Create mint account
      await createMint(
        connection,
        mintKeypair,
        publicKey,
        publicKey,
        decimals
      );

      // Get the token ATA for the user
      const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mintKeypair,
        mintKeypair.publicKey,
        publicKey
      );

      // Mint initial supply
      const initialSupply = Number(tokenData.totalSupply.replace(/,/g, ''));
      await mintTo(
        connection,
        mintKeypair,
        mintKeypair.publicKey,
        associatedTokenAccount.address,
        publicKey,
        initialSupply * (10 ** decimals)
      );

      // Create metadata
      const metaplex = new Metaplex(connection);
      
      const metadataData: DataV2 = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: logoUrl || '',
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
      };

      const metadataPda = metaplex.nfts().pdas().metadata({ mint: mintKeypair.publicKey });

      const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPda,
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey,
          payer: publicKey,
          updateAuthority: publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: metadataData,
            isMutable: !tokenData.revokeUpdate,
            collectionDetails: null
          }
        }
      );

      // Create transaction for metadata
      const transaction = new Transaction().add(createMetadataInstruction);

      // If requested, revoke authorities
      if (tokenData.revokeFreeze) {
        transaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.FreezeAccount,
            null
          )
        );
      }

      if (tokenData.revokeMint) {
        transaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.MintTokens,
            null
          )
        );
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      toast.loading('Please approve the transaction...', { id: creationToast });
      const signedTransaction = await signTransaction(transaction);
      
      toast.loading('Confirming transaction...', { id: creationToast });
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      // Success!
      toast.success('Token created successfully!', {
        id: creationToast,
        description: `Mint address: ${mintKeypair.publicKey.toString()}`
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
      console.error('Token creation error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error('Failed to create token', {
        id: creationToast,
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
