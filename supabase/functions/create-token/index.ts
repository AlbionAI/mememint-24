
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from 'https://esm.sh/@solana/spl-token'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define fee constants at the top level
const BASE_FEE = 0.1;
const OPTION_FEE = 0.1;

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
    let totalFee = BASE_FEE;
    if (modifyCreator) totalFee += OPTION_FEE;
    if (revokeFreeze) totalFee += OPTION_FEE;
    if (revokeMint) totalFee += OPTION_FEE;
    if (revokeUpdate) totalFee += OPTION_FEE;

    console.log('Calculated total fee:', totalFee, 'SOL');

    const connection = new Connection("https://api.mainnet-beta.solana.com");
    console.log('Owner address:', ownerAddress);
    const owner = new PublicKey(ownerAddress);

    // Get both private keys
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const feeCollectorPrivateKey = Deno.env.get('FEE_COLLECTOR_PRIVATE_KEY');
    
    if (!tokenCreatorPrivateKey || !feeCollectorPrivateKey) {
      throw new Error('Required private keys not found in environment');
    }
    
    // Create keypairs for both wallets
    const tokenCreatorPrivateKeyBytes = base58decode(tokenCreatorPrivateKey);
    const tokenCreatorKeypair = Keypair.fromSecretKey(tokenCreatorPrivateKeyBytes);
    
    const feeCollectorPrivateKeyBytes = base58decode(feeCollectorPrivateKey);
    const feeCollectorKeypair = Keypair.fromSecretKey(feeCollectorPrivateKeyBytes);
    
    console.log('Token Creator public key:', tokenCreatorKeypair.publicKey.toBase58());
    console.log('Fee Collector public key:', feeCollectorKeypair.publicKey.toBase58());

    // Generate mint keypair early
    const mintKeypair = Keypair.generate();
    console.log('Mint address:', mintKeypair.publicKey.toBase58());

    // Calculate rent and minimum balances
    const rentExemptMint = await getMinimumBalanceForRentExemptMint(connection);
    const minBalanceForTokenAcc = await connection.getMinimumBalanceForRentExemption(165);
    const requiredBalance = rentExemptMint + minBalanceForTokenAcc;
    
    // Check token creator balance
    const tokenCreatorBalance = await connection.getBalance(tokenCreatorKeypair.publicKey);
    console.log('Token creator balance:', tokenCreatorBalance / LAMPORTS_PER_SOL, 'SOL');
    console.log('Required balance:', requiredBalance / LAMPORTS_PER_SOL, 'SOL');
    
    if (tokenCreatorBalance < requiredBalance) {
      throw new Error(`Token creator wallet needs at least ${(requiredBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL for rent exemption`);
    }

    // Calculate initial supply with decimals
    const cleanSupply = initialSupply.replace(/,/g, ''); // Remove commas
    const decimalPower = "1" + "0".repeat(Number(decimals));
    const finalAmount = Number(cleanSupply) * Number(decimalPower);
    console.log('Initial supply:', cleanSupply);
    console.log('Decimal power:', decimalPower);
    console.log('Final amount:', finalAmount);

    // 1. Fee payment transaction
    const feeTransaction = new Transaction();
    feeTransaction.add(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: feeCollectorKeypair.publicKey,
        lamports: totalFee * LAMPORTS_PER_SOL
      })
    );
    
    // 2. Token creation transaction
    const tokenTransaction = new Transaction();
    
    // Create mint account
    tokenTransaction.add(
      SystemProgram.createAccount({
        fromPubkey: tokenCreatorKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentExemptMint,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // Initialize mint
    tokenTransaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        Number(decimals),
        tokenCreatorKeypair.publicKey,
        modifyCreator ? owner : null,
        TOKEN_PROGRAM_ID
      )
    );
    
    // Create associated token account
    const associatedTokenAddress = await PublicKey.findProgramAddress(
      [
        owner.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('Associated token account address:', associatedTokenAddress[0].toBase58());
    
    tokenTransaction.add(
      createAssociatedTokenAccountInstruction(
        tokenCreatorKeypair.publicKey,
        associatedTokenAddress[0],
        owner,
        mintKeypair.publicKey
      )
    );
    
    // Mint tokens using the calculated final amount
    tokenTransaction.add(
      mintTo({
        mint: mintKeypair.publicKey,
        destination: associatedTokenAddress[0],
        authority: tokenCreatorKeypair.publicKey,
        amount: finalAmount
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

    // Sign the token transaction
    tokenTransaction.sign(tokenCreatorKeypair, mintKeypair);
    
    // Serialize transactions
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
