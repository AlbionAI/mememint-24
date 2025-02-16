
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from 'https://esm.sh/@solana/web3.js@1.87.6?target=es2022'
import { TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction } from 'https://esm.sh/@solana/spl-token@0.3.11?target=es2022'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";
import { encode as base64encode } from "https://deno.land/std@0.178.0/encoding/base64.ts";
import { decode as base64decode } from "https://deno.land/std@0.178.0/encoding/base64.ts";

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
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL is not set');
    }

    console.log('Creating connection to Solana...');
    const connection = new Connection(rpcUrl, 'confirmed');

    try {
      const ownerPublicKey = new PublicKey(ownerAddress);
      
      // Generate new mint account
      const mintKeypair = Keypair.generate();
      console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

      // Calculate minimum rent
      const rentRequired = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      console.log('Minimum rent required:', rentRequired);

      // Create transaction
      const transaction = new Transaction();
      
      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log('Got blockhash:', blockhash);
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;
      
      // Add create account instruction
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: ownerPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rentRequired,
          programId: TOKEN_PROGRAM_ID
        })
      );

      // Add initialize mint instruction
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          ownerPublicKey,
          ownerPublicKey,
          TOKEN_PROGRAM_ID
        )
      );

      // Sign with mint account
      transaction.partialSign(mintKeypair);

      // Serialize the transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base64Transaction = base64encode(serializedTransaction);
      console.log('Transaction created successfully');

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
      throw error;
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
