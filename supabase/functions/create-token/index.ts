
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Use pure JavaScript implementation by adding ?target=es2022&deno-std=0.177.0
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from 'https://esm.sh/@solana/web3.js@1.87.6?target=es2022&deno-std=0.177.0'
import { TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction } from 'https://esm.sh/@solana/spl-token@0.3.11?target=es2022&deno-std=0.177.0'
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
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      fetch: (url, options) => {
        console.log('Making RPC request to:', url);
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          }
        });
      }
    });

    try {
      const ownerPublicKey = new PublicKey(ownerAddress);
      
      // Generate new mint account
      const mintKeypair = Keypair.generate();
      console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

      // Calculate minimum rent with retries
      let rentRequired;
      try {
        rentRequired = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        console.log('Minimum rent required:', rentRequired);
      } catch (error) {
        console.error('Failed to get rent:', error);
        throw new Error('Failed to calculate rent requirement');
      }

      // Create transaction
      const transaction = new Transaction();
      
      // Get latest blockhash with retries
      let blockhash;
      try {
        const { blockhash: latestBlockhash } = await connection.getLatestBlockhash('confirmed');
        blockhash = latestBlockhash;
        console.log('Got blockhash:', blockhash);
      } catch (error) {
        console.error('Failed to get blockhash:', error);
        throw new Error('Failed to get latest blockhash');
      }
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;
      
      // Add create account instruction
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: ownerPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: Number(rentRequired), // Ensure rentRequired is converted to Number
          programId: TOKEN_PROGRAM_ID
        })
      );

      // Add initialize mint instruction
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,    // mint pubkey
          decimals,                 // decimals
          ownerPublicKey,          // mint authority
          ownerPublicKey,          // freeze authority (same as mint authority)
          TOKEN_PROGRAM_ID
        )
      );

      // Sign with mint account
      transaction.partialSign(mintKeypair); // Use partialSign instead of sign

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
      if (error instanceof Error) {
        if (error.message.includes('MethodNotFound')) {
          throw new Error('RPC method not supported. Please check your RPC endpoint configuration.');
        } else if (error.message.includes('bigint')) {
          throw new Error('Numeric conversion error. Please check the transaction amounts.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred during transaction creation');
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
