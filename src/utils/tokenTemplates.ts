
import { 
  Connection, 
  PublicKey, 
  Transaction,
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

export type TokenTemplate = {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;
}

export const createTokenFromTemplate = async (
  connection: Connection,
  payer: PublicKey,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  template: TokenTemplate
) => {
  // Generate new mint keypair
  const mintKeypair = Keypair.generate();
  
  // Get minimum balance for rent exemption
  const rent = await getMinimumBalanceForRentExemptMint(connection);
  
  // Create transaction
  const transaction = new Transaction();
  
  // Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: rent,
      programId: TOKEN_PROGRAM_ID
    })
  );
  
  // Initialize mint
  transaction.add(
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      template.decimals,
      template.mintAuthority,
      template.freezeAuthority,
      TOKEN_PROGRAM_ID
    )
  );
  
  // Create associated token account for initial holder
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    template.mintAuthority
  );
  
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAccount,
      template.mintAuthority,
      mintKeypair.publicKey
    )
  );
  
  // Mint initial supply
  transaction.add(
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAccount,
      template.mintAuthority,
      template.initialSupply * Math.pow(10, template.decimals)
    )
  );
  
  // Set recent blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer;
  
  // Partial sign with mint keypair
  transaction.partialSign(mintKeypair);
  
  // Get user signature
  const signedTx = await signTransaction(transaction);
  
  // Send and confirm
  const txid = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txid);
  
  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    tokenAccount: associatedTokenAccount.toBase58(),
    signature: txid
  };
};

// Predefined templates
export const standardTokenTemplate: TokenTemplate = {
  name: "Standard Token",
  symbol: "STD",
  decimals: 9,
  initialSupply: 1_000_000_000,
  mintAuthority: null!, // Will be set to creator's pubkey
  freezeAuthority: null
};

export const memeCoinTemplate: TokenTemplate = {
  name: "Meme Coin",
  symbol: "MEME",
  decimals: 9,
  initialSupply: 1_000_000_000_000,
  mintAuthority: null!, // Will be set to creator's pubkey
  freezeAuthority: null
};

export const stablecoinTemplate: TokenTemplate = {
  name: "Stablecoin",
  symbol: "USDC",
  decimals: 6,
  initialSupply: 1_000_000,
  mintAuthority: null!, // Will be set to creator's pubkey
  freezeAuthority: null
};
