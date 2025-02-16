
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js'
import { TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction } from 'https://esm.sh/@solana/spl-token'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";
import { encode as base64encode } from "https://deno.land/std@0.178.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress } = await req.json();
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL is not set');
    }
    
    console.log('Starting token creation process...');
    console.log('Token params:', { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress });
    
    if (!tokenCreatorPrivateKey) {
      throw new Error('SOLANA_PRIVATE_KEY is not set');
    }

    let tokenCreatorKeypair: Keypair;
    try {
      const decodedCreatorKey = base58decode(tokenCreatorPrivateKey);
      tokenCreatorKeypair = Keypair.fromSecretKey(decodedCreatorKey);
      console.log('Token creator public key:', tokenCreatorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error creating token creator keypair:', error);
      throw new Error(`Failed to create token creator keypair: ${error.message}`);
    }

    const connection = new Connection(rpcUrl, {
      commitment: 'finalized',
      confirmTransactionInitialTimeout: 120000
    });
    
    try {
      console.log('Creating new token mint...');
      const mintKeypair = Keypair.generate();
      console.log('Mint public key:', mintKeypair.publicKey.toBase58());

      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      console.log('Required lamports:', lamports);

      const balance = await connection.getBalance(tokenCreatorKeypair.publicKey);
      console.log('Token creator balance:', balance / LAMPORTS_PER_SOL, 'SOL');
      
      if (balance < lamports) {
        throw new Error(`Insufficient funds. Need at least ${lamports / LAMPORTS_PER_SOL} SOL`);
      }

      const transaction = new Transaction();

      // Get recent blockhash with finalized commitment
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(ownerAddress);

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: new PublicKey(ownerAddress),
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          new PublicKey(ownerAddress),
          new PublicKey(ownerAddress),
          TOKEN_PROGRAM_ID
        )
      );

      // Partial sign with mint keypair
      transaction.partialSign(mintKeypair);

      // Serialize with verification disabled
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      // Convert to base64
      const base64Transaction = base64encode(serializedTransaction);

      console.log('Transaction created successfully');

      return new Response(
        JSON.stringify({
          success: true,
          mintAddress: mintKeypair.publicKey.toBase58(),
          transaction: base64Transaction
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error creating token:', error);
      throw new Error(`Failed to create token: ${error.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
