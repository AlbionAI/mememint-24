
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from 'https://esm.sh/@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } from 'https://esm.sh/@solana/spl-token'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting token creation process...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress } = parsedBody;
    
    if (!tokenName || !tokenSymbol || !decimals || !initialSupply || !ownerAddress) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields",
          receivedFields: { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const owner = new PublicKey(ownerAddress);
    
    // Calculate rent for mint
    const rentExemptMint = await getMinimumBalanceForRentExemptMint(connection);
    
    // Generate a new mint address
    const mintKeypair = new PublicKey(ownerAddress);
    
    // Create transaction to create mint account
    const transaction = new Transaction();
    
    // Add create account instruction
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: mintKeypair,
        space: MINT_SIZE,
        lamports: rentExemptMint,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // Add initialize mint instruction
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair,
        decimals,
        owner,
        null,
        TOKEN_PROGRAM_ID
      )
    );
    
    // Get the token account for the owner
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      mintKeypair,
      owner,
      true
    );
    
    // Add mint to instruction
    transaction.add(
      mintTo({
        mint: mintKeypair,
        destination: tokenAccount.address,
        authority: owner,
        amount: initialSupply * Math.pow(10, decimals)
      })
    );

    // Return the serialized transaction for signing
    const serializedTransaction = transaction.serialize();
    
    return new Response(
      JSON.stringify({
        success: true,
        transaction: serializedTransaction,
        mintAddress: mintKeypair.toBase58()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

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
