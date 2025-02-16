
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js@1.87.6'
import { TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction } from 'https://esm.sh/@solana/spl-token@0.3.11'
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
    console.log('Starting request processing...');
    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress } = await req.json();
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL is not set');
    }
    
    if (!tokenCreatorPrivateKey) {
      throw new Error('SOLANA_PRIVATE_KEY is not set');
    }

    let tokenCreatorKeypair: Keypair;
    try {
      const privateKeyBytes = base58decode(tokenCreatorPrivateKey);
      tokenCreatorKeypair = Keypair.fromSecretKey(privateKeyBytes);
      console.log('Token creator public key:', tokenCreatorKeypair.publicKey.toString());
    } catch (error) {
      console.error('Keypair creation error:', error);
      throw new Error('Failed to create token creator keypair');
    }

    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed'
    });

    try {
      const mintKeypair = Keypair.generate();
      console.log('Generated mint address:', mintKeypair.publicKey.toString());

      // Get minimum balance without using bigint
      const rentExemptBalance = await getMinimumBalanceForRentExemptMint(connection);
      console.log('Rent exempt balance required:', rentExemptBalance / LAMPORTS_PER_SOL, 'SOL');

      const creatorBalance = await connection.getBalance(tokenCreatorKeypair.publicKey);
      console.log('Creator balance:', creatorBalance / LAMPORTS_PER_SOL, 'SOL');

      if (creatorBalance < rentExemptBalance) {
        throw new Error(`Insufficient balance. Required: ${rentExemptBalance / LAMPORTS_PER_SOL} SOL`);
      }

      const transaction = new Transaction();
      
      // Get fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(ownerAddress);

      // Create account instruction
      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: new PublicKey(ownerAddress),
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentExemptBalance,
        programId: TOKEN_PROGRAM_ID
      });

      // Initialize mint instruction
      const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        new PublicKey(ownerAddress),
        new PublicKey(ownerAddress),
        TOKEN_PROGRAM_ID
      );

      // Add instructions to transaction
      transaction.add(createAccountInstruction);
      transaction.add(initializeMintInstruction);

      // Sign with mint keypair
      transaction.partialSign(mintKeypair);

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      // Convert to base64 safely
      const base64Transaction = base64encode(serializedTransaction);
      console.log('Transaction created and serialized successfully');

      return new Response(
        JSON.stringify({
          success: true,
          mintAddress: mintKeypair.publicKey.toString(),
          transaction: base64Transaction
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('Transaction creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create transaction');
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
