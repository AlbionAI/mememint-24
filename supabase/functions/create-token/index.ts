
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from 'https://esm.sh/@solana/web3.js'
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

    const { 
      tokenName, 
      tokenSymbol, 
      decimals, 
      initialSupply, 
      ownerAddress,
      modifyCreator,
      revokeFreeze,
      revokeMint,
      revokeUpdate
    } = parsedBody;
    
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

    // Calculate total fee based on selected options
    const BASE_FEE = 0.1;
    const OPTION_FEE = 0.1;
    
    let totalFee = BASE_FEE;
    if (modifyCreator) totalFee += OPTION_FEE;
    if (revokeFreeze) totalFee += OPTION_FEE;
    if (revokeMint) totalFee += OPTION_FEE;
    if (revokeUpdate) totalFee += OPTION_FEE;

    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const owner = new PublicKey(ownerAddress);
    
    // Create a new keypair from the fee collector's private key
    const feeCollectorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    if (!feeCollectorPrivateKey) {
      throw new Error('Fee collector private key not found');
    }
    
    // Convert the base58 private key to Uint8Array
    const feeCollectorPrivateKeyBytes = base58.decode(feeCollectorPrivateKey);
    const feeCollectorKeypair = Keypair.fromSecretKey(feeCollectorPrivateKeyBytes);
    const feeCollector = feeCollectorKeypair.publicKey;
    
    // Calculate rent for mint
    const rentExemptMint = await getMinimumBalanceForRentExemptMint(connection);
    
    // Generate a new mint keypair
    const mintKeypair = Keypair.generate();
    
    // Create transaction
    const transaction = new Transaction();
    
    // Add fee transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: feeCollector,
        lamports: totalFee * 1e9 // Convert SOL to lamports
      })
    );
    
    // Add create account instruction
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentExemptMint,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // Add initialize mint instruction
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        owner,
        modifyCreator ? owner : null,
        TOKEN_PROGRAM_ID
      )
    );
    
    // Get the token account for the owner
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      mintKeypair.publicKey,
      owner,
      true
    );
    
    // Add mint to instruction
    transaction.add(
      mintTo({
        mint: mintKeypair.publicKey,
        destination: tokenAccount.address,
        authority: owner,
        amount: initialSupply * Math.pow(10, decimals)
      })
    );

    // Record fee in database
    const { error: dbError } = await supabaseClient
      .from('token_fees')
      .insert({
        token_mint_address: mintKeypair.publicKey.toBase58(),
        base_fee: BASE_FEE,
        modify_creator_fee: modifyCreator ? OPTION_FEE : 0,
        revoke_freeze_fee: revokeFreeze ? OPTION_FEE : 0,
        revoke_mint_fee: revokeMint ? OPTION_FEE : 0,
        revoke_update_fee: revokeUpdate ? OPTION_FEE : 0,
        total_fee: totalFee
      });

    if (dbError) {
      console.error('Error recording fee:', dbError);
      // Continue with transaction even if fee recording fails
    }

    // Return the serialized transaction for signing
    const serializedTransaction = transaction.serialize();
    
    return new Response(
      JSON.stringify({
        success: true,
        transaction: serializedTransaction,
        mintAddress: mintKeypair.publicKey.toBase58(),
        totalFee
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
