
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from 'https://esm.sh/@solana/spl-token'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting token creation process...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get request body
    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress } = await req.json()
    console.log('Received parameters:', { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress });

    // Validate required fields
    if (!tokenName || !tokenSymbol || !decimals || !initialSupply || !ownerAddress) {
      console.error('Missing required fields:', { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields." 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Solana connection
    console.log('Initializing Solana connection...');
    const connection = new Connection("https://api.mainnet-beta.solana.com")
    
    // Get private key from environment
    const secretKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    if (!secretKey) {
      console.error('SOLANA_PRIVATE_KEY not found in environment variables');
      throw new Error('SOLANA_PRIVATE_KEY not configured');
    }

    console.log('Creating keypair from secret key...');
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKey)));

    // Create mint
    console.log('Creating mint...');
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      decimals
    )
    const mintAddress = mint.toBase58()
    console.log('Mint created:', mintAddress);

    // Create token account for owner
    console.log('Creating token account for owner:', ownerAddress);
    const ownerPublicKey = new PublicKey(ownerAddress)
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      ownerPublicKey
    )

    // Mint initial supply to owner
    console.log('Minting initial supply:', initialSupply);
    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      initialSupply * Math.pow(10, decimals)
    )

    // Store token details in Supabase
    console.log('Storing token details in Supabase...');
    const { data, error } = await supabaseClient
      .from('tokens')
      .insert([{
        token_name: tokenName,
        token_symbol: tokenSymbol,
        mint_address: mintAddress,
        owner_address: ownerAddress
      }])

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Token creation completed successfully');
    return new Response(
      JSON.stringify({ success: true, mintAddress }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-token function:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
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
