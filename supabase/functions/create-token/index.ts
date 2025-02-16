
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "https://esm.sh/@solana/web3.js"
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "https://esm.sh/@solana/spl-token"
import { bundlrStorage, Metaplex, keypairIdentity, toMetaplexFile } from "https://esm.sh/@metaplex-foundation/js"

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // Initialize Supabase admin client to verify JWT
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid JWT token')
    }

    const { walletPublicKey, name, symbol, description, imagePath, addMetadata, mintAuthority } = await req.json()
    
    // Initialize Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Initialize Solana connection
    const connection = new Connection(Deno.env.get('RPC_URL'), "confirmed")
    
    // Create token function
    async function createToken() {
      const payer = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(Deno.env.get('PRIVATE_KEY') ?? '[]'))
      )
      const mint = Keypair.generate()
      
      // Initialize transaction
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: mint.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(82),
          space: 82,
          programId: PublicKey.default,
        })
      )
      
      // Add fee transfer
      const fee = 0.05 + (addMetadata ? 0.1 : 0) + (mintAuthority ? 0.1 : 0)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletPublicKey),
          toPubkey: new PublicKey(Deno.env.get('FEE_WALLET') ?? ''),
          lamports: fee * 10 ** 9,
        })
      )
      
      // Send transaction
      const txSignature = await connection.sendTransaction(transaction, [payer, mint])
      
      // Store token creation in database
      const { data, error } = await supabaseClient
        .from('token_creations')
        .insert({
          user_id: user.id, // Add user_id to the record
          wallet_address: walletPublicKey,
          mint_address: mint.publicKey.toBase58(),
          name,
          symbol,
          description,
          tx_signature: txSignature,
        })
      
      if (error) throw error
      
      return {
        txSignature,
        mintAddress: mint.publicKey.toBase58(),
      }
    }
    
    const result = await createToken()
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
    
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Invalid JWT') ? 401 : 500
      },
    )
  }
})
