import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from 'https://esm.sh/@solana/spl-token'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";
import { encode as base58encode } from "https://deno.land/std@0.178.0/encoding/base58.ts";

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

    // Validate all required parameters
    if (!tokenName || typeof tokenName !== 'string' || tokenName.trim() === '') {
      throw new Error('Invalid token name');
    }
    if (!tokenSymbol || typeof tokenSymbol !== 'string' || tokenSymbol.trim() === '') {
      throw new Error('Invalid token symbol');
    }
    if (typeof decimals !== 'number' || decimals < 0 || decimals > 9) {
      throw new Error('Invalid decimals value. Must be between 0 and 9');
    }
    if (!initialSupply || Number(initialSupply) <= 0) {
      throw new Error('Initial supply must be greater than 0');
    }
    if (!ownerAddress || typeof ownerAddress !== 'string' || !ownerAddress.trim()) {
      throw new Error('Invalid owner address');
    }

    try {
      new PublicKey(ownerAddress);
    } catch (e) {
      throw new Error('Invalid Solana address format for owner');
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

    // Get and validate private keys
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const feeCollectorPrivateKey = Deno.env.get('FEE_COLLECTOR_PRIVATE_KEY');
    
    console.log('Checking private keys...');
    if (!tokenCreatorPrivateKey) {
      throw new Error('SOLANA_PRIVATE_KEY is not set in environment');
    }
    if (!feeCollectorPrivateKey) {
      throw new Error('FEE_COLLECTOR_PRIVATE_KEY is not set in environment');
    }

    // Validate private key format (base58 characters only)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(tokenCreatorPrivateKey)) {
      throw new Error('SOLANA_PRIVATE_KEY is not in valid base58 format');
    }
    if (!base58Regex.test(feeCollectorPrivateKey)) {
      throw new Error('FEE_COLLECTOR_PRIVATE_KEY is not in valid base58 format');
    }

    let tokenCreatorKeypair: Keypair;
    try {
      // First decode from base58
      const decodedBytes = base58decode(tokenCreatorPrivateKey);
      // Then encode back to base58 to ensure proper format
      const encodedKey = base58encode(decodedBytes);
      console.log('Token creator key validation:');
      console.log('Original length:', tokenCreatorPrivateKey.length);
      console.log('Decoded length:', decodedBytes.length);
      console.log('Re-encoded length:', encodedKey.length);
      
      // Create keypair using decoded bytes
      const secretKey = new Uint8Array(decodedBytes);
      tokenCreatorKeypair = Keypair.fromSecretKey(secretKey);
      console.log('Successfully created token creator keypair');
      console.log('Token Creator public key:', tokenCreatorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error processing token creator private key:', error);
      console.error('Key details:', {
        originalLength: tokenCreatorPrivateKey.length,
        isBase58: /^[1-9A-HJ-NP-Za-km-z]+$/.test(tokenCreatorPrivateKey)
      });
      throw new Error('Invalid token creator private key format');
    }

    let feeCollectorKeypair: Keypair;
    try {
      // First decode from base58
      const decodedBytes = base58decode(feeCollectorPrivateKey);
      // Then encode back to base58 to ensure proper format
      const encodedKey = base58encode(decodedBytes);
      console.log('Fee collector key validation:');
      console.log('Original length:', feeCollectorPrivateKey.length);
      console.log('Decoded length:', decodedBytes.length);
      console.log('Re-encoded length:', encodedKey.length);
      
      // Create keypair using decoded bytes
      const secretKey = new Uint8Array(decodedBytes);
      feeCollectorKeypair = Keypair.fromSecretKey(secretKey);
      console.log('Successfully created fee collector keypair');
      console.log('Fee Collector public key:', feeCollectorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error processing fee collector private key:', error);
      console.error('Key details:', {
        originalLength: feeCollectorPrivateKey.length,
        isBase58: /^[1-9A-HJ-NP-Za-km-z]+$/.test(feeCollectorPrivateKey)
      });
      throw new Error('Invalid fee collector private key format');
    }

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
    console.log('Raw initial supply:', initialSupply);
    const supplyString = String(initialSupply).replace(/[^0-9]/g, ''); // Remove all non-numeric characters
    const numericSupply = parseInt(supplyString, 10);
    
    if (isNaN(numericSupply) || numericSupply <= 0) {
      throw new Error('Initial supply must be a positive number');
    }
    
    const decimalMultiplier = Math.pow(10, decimals);
    const finalAmount = numericSupply * decimalMultiplier;
    
    console.log('Initial supply:', numericSupply);
    console.log('Decimal multiplier:', decimalMultiplier);
    console.log('Final amount:', finalAmount);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      throw new Error('Error calculating final token amount');
    }

    // Generate mint keypair early
    const mintKeypair = Keypair.generate();
    console.log('Generated mint keypair');
    console.log('Mint address:', mintKeypair.publicKey.toBase58());

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
    
    // Initialize mint with explicit null checks
    const freezeAuthority = modifyCreator ? owner : null;
    
    tokenTransaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        tokenCreatorKeypair.publicKey,
        freezeAuthority,
        TOKEN_PROGRAM_ID
      )
    );
    
    // Create associated token account
    const [associatedTokenAddress] = await PublicKey.findProgramAddress(
      [
        owner.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    if (!associatedTokenAddress) {
      throw new Error('Failed to create associated token account address');
    }

    console.log('Associated token account address:', associatedTokenAddress.toBase58());
    
    tokenTransaction.add(
      createAssociatedTokenAccountInstruction(
        tokenCreatorKeypair.publicKey,
        associatedTokenAddress,
        owner,
        mintKeypair.publicKey
      )
    );
    
    // Mint tokens using the calculated final amount
    tokenTransaction.add(
      mintTo({
        mint: mintKeypair.publicKey,
        destination: associatedTokenAddress,
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
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
