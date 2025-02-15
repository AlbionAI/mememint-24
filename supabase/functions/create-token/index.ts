
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
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const feeCollectorPrivateKey = Deno.env.get('FEE_COLLECTOR_PRIVATE_KEY');
    
    console.log('Starting private key validation...');
    
    // Validate token creator key
    if (!tokenCreatorPrivateKey) {
      throw new Error('SOLANA_PRIVATE_KEY is not set');
    }
    console.log('SOLANA_PRIVATE_KEY exists:', true);
    console.log('SOLANA_PRIVATE_KEY length:', tokenCreatorPrivateKey.length);

    // Validate fee collector key
    if (!feeCollectorPrivateKey) {
      throw new Error('FEE_COLLECTOR_PRIVATE_KEY is not set');
    }
    console.log('FEE_COLLECTOR_PRIVATE_KEY exists:', true);
    console.log('FEE_COLLECTOR_PRIVATE_KEY length:', feeCollectorPrivateKey.length);

    // Create token creator keypair
    let tokenCreatorKeypair: Keypair;
    try {
      console.log('Creating token creator keypair...');
      const decodedCreatorKey = base58decode(tokenCreatorPrivateKey);
      console.log('Decoded token creator key length:', decodedCreatorKey.length);
      
      // Use Uint8Array directly
      tokenCreatorKeypair = Keypair.fromSecretKey(decodedCreatorKey);
      console.log('Token creator public key:', tokenCreatorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error creating token creator keypair:', error);
      throw new Error(`Failed to create token creator keypair: ${error.message}`);
    }

    // Create fee collector keypair
    let feeCollectorKeypair: Keypair;
    try {
      console.log('Creating fee collector keypair...');
      const decodedCollectorKey = base58decode(feeCollectorPrivateKey);
      console.log('Decoded fee collector key length:', decodedCollectorKey.length);
      
      // Use Uint8Array directly
      feeCollectorKeypair = Keypair.fromSecretKey(decodedCollectorKey);
      console.log('Fee collector public key:', feeCollectorKeypair.publicKey.toBase58());
    } catch (error) {
      console.error('Error creating fee collector keypair:', error);
      throw new Error(`Failed to create fee collector keypair: ${error.message}`);
    }

    // Test connection to make sure everything is working
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const balance = await connection.getBalance(tokenCreatorKeypair.publicKey);
    console.log('Token creator balance:', balance / LAMPORTS_PER_SOL, 'SOL');

    return new Response(
      JSON.stringify({ 
        success: true,
        tokenCreatorPublicKey: tokenCreatorKeypair.publicKey.toBase58(),
        feeCollectorPublicKey: feeCollectorKeypair.publicKey.toBase58(),
        tokenCreatorBalance: balance / LAMPORTS_PER_SOL
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
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
