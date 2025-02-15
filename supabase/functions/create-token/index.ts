
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js'
import { createMint, mintTo, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from 'https://esm.sh/@solana/spl-token'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";
import { encode as base58encode } from "https://deno.land/std@0.178.0/encoding/base58.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tokenName, tokenSymbol, decimals, initialSupply } = await req.json();
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const feeCollectorPrivateKey = Deno.env.get('FEE_COLLECTOR_PRIVATE_KEY');
    
    console.log('Starting token creation process...');
    console.log('Token params:', { tokenName, tokenSymbol, decimals, initialSupply });
    
    // Validate token creator key
    if (!tokenCreatorPrivateKey) {
      throw new Error('SOLANA_PRIVATE_KEY is not set');
    }

    // Validate fee collector key
    if (!feeCollectorPrivateKey) {
      throw new Error('FEE_COLLECTOR_PRIVATE_KEY is not set');
    }

    // Create token creator keypair
    let tokenCreatorKeypair: Keypair;
    try {
      const decodedCreatorKey = base58decode(tokenCreatorPrivateKey);
      tokenCreatorKeypair = Keypair.fromSecretKey(decodedCreatorKey);
      console.log('Token creator public key:', tokenCreatorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error creating token creator keypair:', error);
      throw new Error(`Failed to create token creator keypair: ${error.message}`);
    }

    // Create fee collector keypair
    let feeCollectorKeypair: Keypair;
    try {
      const decodedCollectorKey = base58decode(feeCollectorPrivateKey);
      feeCollectorKeypair = Keypair.fromSecretKey(decodedCollectorKey);
      console.log('Fee collector public key:', feeCollectorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error creating fee collector keypair:', error);
      throw new Error(`Failed to create fee collector keypair: ${error.message}`);
    }

    // Initialize connection to Solana
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    
    // Create new token mint
    try {
      console.log('Creating new token mint...');
      const mintKeypair = Keypair.generate();
      console.log('Mint public key:', mintKeypair.publicKey.toBase58());

      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      console.log('Required lamports:', lamports);

      // Check if token creator has enough SOL
      const balance = await connection.getBalance(tokenCreatorKeypair.publicKey);
      console.log('Token creator balance:', balance / LAMPORTS_PER_SOL, 'SOL');
      
      if (balance < lamports) {
        throw new Error(`Insufficient funds. Need at least ${lamports / LAMPORTS_PER_SOL} SOL`);
      }

      const transaction = new Transaction();

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = tokenCreatorKeypair.publicKey;

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: tokenCreatorKeypair.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          tokenCreatorKeypair.publicKey,
          null,
          TOKEN_PROGRAM_ID
        )
      );

      // Sign transaction with both keypairs
      transaction.sign(tokenCreatorKeypair, mintKeypair);

      // Send the transaction
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log('Token created successfully. Signature:', signature);

      return new Response(
        JSON.stringify({
          success: true,
          mintAddress: mintKeypair.publicKey.toBase58(),
          tokenCreatorPublicKey: tokenCreatorKeypair.publicKey.toBase58(),
          feeCollectorPublicKey: feeCollectorKeypair.publicKey.toBase58(),
          signature
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
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
