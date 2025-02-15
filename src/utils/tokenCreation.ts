import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
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
import { Buffer } from 'buffer';

// Ensure Buffer is available globally
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

export interface TokenCreationParams {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  disableMint?: boolean;
  disableFreeze?: boolean;
}

export async function createToken(
  connection: Connection,
  wallet: { publicKey: PublicKey | null },
  params: TokenCreationParams
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
    const supply = parseFloat(params.totalSupply.replace(/,/g, ''));
    const adjustedSupply = supply * Math.pow(10, params.decimals);

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
        params.decimals,
        params.disableMint ? null : wallet.publicKey,
        params.disableFreeze ? null : wallet.publicKey,
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
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      throw new Error('Error confirming transaction');
    }

    return {
      mintAddress: mintAccount.publicKey.toString(),
      signature,
      tokenAccount: associatedTokenAccount.toString(),
      explorerUrl: `https://solscan.io/token/${mintAccount.publicKey.toString()}`,
      raydiumUrl: `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${mintAccount.publicKey.toString()}`,
    };

  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}
