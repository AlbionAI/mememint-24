
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from "sonner";

export interface TokenCreationData {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  decimals: string;
  logo: File | null;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  revokeFreeze: boolean;
  revokeMint: boolean;
  revokeUpdate: boolean;
}

export async function createToken(
  connection: Connection,
  wallet: { publicKey: PublicKey | null },
  tokenData: TokenCreationData
) {
  try {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Create mint account
    const mintAccount = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    
    // Create associated token account for the mint owner
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintAccount.publicKey,
      wallet.publicKey
    );

    // Calculate total supply with decimals
    const decimals = parseInt(tokenData.decimals);
    const supply = parseFloat(tokenData.totalSupply.replace(/,/g, ''));
    const adjustedSupply = supply * Math.pow(10, decimals);

    const transaction = new Transaction().add(
      // Create mint account
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintAccount.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      // Initialize mint
      createInitializeMintInstruction(
        mintAccount.publicKey,
        decimals,
        wallet.publicKey,
        tokenData.revokeFreeze ? null : wallet.publicKey,
        TOKEN_PROGRAM_ID
      ),
      // Create associated token account
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAccount,
        wallet.publicKey,
        mintAccount.publicKey
      ),
      // Mint tokens to associated token account
      createMintToInstruction(
        mintAccount.publicKey,
        associatedTokenAccount,
        wallet.publicKey,
        adjustedSupply,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [mintAccount]);
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      throw new Error('Error confirming transaction');
    }

    // Return the mint address and other relevant data
    return {
      mintAddress: mintAccount.publicKey.toString(),
      signature,
      tokenAccount: associatedTokenAccount.toString(),
    };

  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}
