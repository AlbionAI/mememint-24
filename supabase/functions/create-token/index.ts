
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from 'https://esm.sh/@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } from 'https://esm.sh/@solana/spl-token'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOKEN_CREATOR_PRIVATE_KEY = "5yYmEJJPBJ6rnvfvrqu67Dz3o5gYwLR3MUoaXkQ89tQq1wkanZKJoXEudh2mTMivD1fjB3BdguEWXyTm7ve4BWmP";

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
    
    console.log('Parsed token params:', {
      tokenName,
      tokenSymbol,
      decimals,
      initialSupply,
      ownerAddress,
      modifyCreator,
      revokeFreeze,
      revokeMint,
      revokeUpdate
    });

    if (!tokenName || !tokenSymbol || decimals === undefined || !initialSupply || !ownerAddress) {
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
    console.log('Owner address:', ownerAddress);
    const owner = new PublicKey(ownerAddress);
    
    // Create Token Creator keypair from private key
    try {
      const tokenCreatorPrivateKeyBytes = base58decode(TOKEN_CREATOR_PRIVATE_KEY);
      const tokenCreatorKeypair = Keypair.fromSecretKey(tokenCreatorPrivateKeyBytes);
      const tokenCreator = tokenCreatorKeypair.publicKey;
      console.log('Token Creator public key:', tokenCreator.toBase58());

      // Calculate rent for mint
      const rentExemptMint = await getMinimumBalanceForRentExemptMint(connection);
      
      // Generate a new mint keypair
      const mintKeypair = Keypair.generate();
      
      // Create two separate transactions
      
      // 1. Fee payment transaction (to be signed by owner)
      const feeTransaction = new Transaction();
      feeTransaction.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: tokenCreator,
          lamports: totalFee * 1e9 // Convert SOL to lamports
        })
      );
      
      // 2. Token creation transaction (to be signed by token creator)
      const tokenTransaction = new Transaction();
      
      // Add create account instruction
      tokenTransaction.add(
        SystemProgram.createAccount({
          fromPubkey: tokenCreator,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rentExemptMint,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      
      // Add initialize mint instruction
      tokenTransaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          Number(decimals),
          owner, // Set owner as mint authority
          modifyCreator ? owner : null, // Set freeze authority if modifyCreator is true
          TOKEN_PROGRAM_ID
        )
      );
      
      // Get the token account for the owner
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        tokenCreatorKeypair, // Use token creator to create the account
        mintKeypair.publicKey,
        owner,
        true
      );
      
      // Add mint to instruction
      tokenTransaction.add(
        mintTo({
          mint: mintKeypair.publicKey,
          destination: tokenAccount.address,
          authority: tokenCreator,
          amount: BigInt(initialSupply) * BigInt(Math.pow(10, Number(decimals)))
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
      }

      // Sign the token transaction with token creator
      tokenTransaction.sign(tokenCreatorKeypair, mintKeypair);
      
      // Serialize both transactions
      const serializedFeeTransaction = Buffer.from(feeTransaction.serialize()).toString('base64');
      const serializedTokenTransaction = Buffer.from(tokenTransaction.serialize()).toString('base64');
      
      return new Response(
        JSON.stringify({
          success: true,
          feeTransaction: serializedFeeTransaction,
          tokenTransaction: serializedTokenTransaction,
          mintAddress: mintKeypair.publicKey.toBase58(),
          totalFee
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Error in transaction creation:', error);
      throw error;
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
