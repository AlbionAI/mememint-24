
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "https://esm.sh/@solana/web3.js"
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "https://esm.sh/@solana/spl-token"
import { bundlrStorage, Metaplex, keypairIdentity, toMetaplexFile } from "https://esm.sh/@metaplex-foundation/js"

serve(async (req) => {
  try {
    const { walletPublicKey, name, symbol, description, imagePath, addMetadata, mintAuthority } = await req.json()
    
    // Initialize Supabase client
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
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      },
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      },
    )
  }
})
