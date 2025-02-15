
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, Transaction, PublicKey, sendAndConfirmTransaction, Keypair } from 'https://esm.sh/@solana/web3.js'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { feeTransaction, tokenTransaction, mintAddress } = await req.json();

    if (!feeTransaction || !tokenTransaction || !mintAddress) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required transaction data' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const connection = new Connection("https://api.mainnet-beta.solana.com");

    // Get private keys
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const feeCollectorPrivateKey = Deno.env.get('FEE_COLLECTOR_PRIVATE_KEY');
    
    if (!tokenCreatorPrivateKey || !feeCollectorPrivateKey) {
      throw new Error('Required private keys not found in environment');
    }

    // Create keypairs
    const tokenCreatorPrivateKeyBytes = base58decode(tokenCreatorPrivateKey);
    const tokenCreatorKeypair = Keypair.fromSecretKey(tokenCreatorPrivateKeyBytes);
    
    console.log('Token Creator public key:', tokenCreatorKeypair.publicKey.toBase58());

    // Deserialize transactions
    const feeTransactionObj = Transaction.from(Buffer.from(feeTransaction, 'base64'));
    const tokenTransactionObj = Transaction.from(Buffer.from(tokenTransaction, 'base64'));

    try {
      // Send and confirm both transactions
      console.log('Sending fee transaction...');
      const feeSignature = await connection.sendRawTransaction(feeTransactionObj.serialize());
      await connection.confirmTransaction(feeSignature);
      console.log('Fee transaction confirmed:', feeSignature);

      console.log('Sending token creation transaction...');
      const tokenSignature = await connection.sendRawTransaction(tokenTransactionObj.serialize());
      await connection.confirmTransaction(tokenSignature);
      console.log('Token creation transaction confirmed:', tokenSignature);

      return new Response(
        JSON.stringify({
          success: true,
          feeSignature,
          tokenSignature,
          mintAddress
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Transaction execution error:', error);
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
