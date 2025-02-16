
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Use a specific version that's known to work well with Phantom wallet
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from 'https://esm.sh/@solana/web3.js@1.77.0?target=es2022'
import { TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction } from 'https://esm.sh/@solana/spl-token@0.3.8?target=es2022'
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
    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress, blockhash } = await req.json();
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL is not set');
    }

    console.log('Creating connection to Solana...');
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    try {
      // Validate owner address
      let ownerPublicKey;
      try {
        ownerPublicKey = new PublicKey(ownerAddress);
        console.log('Validated owner address:', ownerPublicKey.toString());
      } catch (error) {
        console.error('Invalid owner address:', error);
        throw new Error('Invalid owner wallet address provided');
      }
      
      // Generate new mint account
      const mintKeypair = Keypair.generate();
      console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

      // Calculate minimum rent with retry logic
      let rentRequired;
      try {
        rentRequired = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        console.log('Minimum rent required:', rentRequired);
      } catch (error) {
        console.error('Failed to get rent requirement, retrying...', error);
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        rentRequired = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      }

      if (!rentRequired) {
        throw new Error('Failed to calculate rent requirement');
      }

      // Create transaction with versioned format for better compatibility
      const transaction = new Transaction();
      
      // Use provided blockhash from frontend
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;
      
      // Add create account instruction
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentRequired,
        programId: TOKEN_PROGRAM_ID
      });
      
      // Add initialize mint instruction
      const initializeMintIx = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        ownerPublicKey,
        ownerPublicKey,
        TOKEN_PROGRAM_ID
      );

      transaction.add(createAccountIx, initializeMintIx);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown transaction creation error';
      throw new Error(`Failed to create token transaction: ${errorMessage}`);
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
