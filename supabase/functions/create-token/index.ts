
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from 'https://esm.sh/@solana/spl-token'
import { decode } from "https://deno.land/std@0.177.0/encoding/base58.ts";

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

    // Get and log request body
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

    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress } = parsedBody;
    console.log('Parsed parameters:', { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress });

    // Validate required fields with detailed logging
    if (!tokenName) console.error('Missing tokenName');
    if (!tokenSymbol) console.error('Missing tokenSymbol');
    if (!decimals) console.error('Missing decimals');
    if (!initialSupply) console.error('Missing initialSupply');
    if (!ownerAddress) console.error('Missing ownerAddress');

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

    // Initialize Solana connection with better error handling
    console.log('Initializing Solana connection...');
    const connection = new Connection("https://api.mainnet-beta.solana.com")
    
    // Validate and get private key
    const secretKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    if (!secretKey) {
      console.error('SOLANA_PRIVATE_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SOLANA_PRIVATE_KEY not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating keypair from secret key...');
    let payer;
    try {
      // Convert base58 private key to Uint8Array
      const keyArray = decode(secretKey);
      payer = Keypair.fromSecretKey(keyArray);
      console.log('Payer public key:', payer.publicKey.toString());
    } catch (keypairError) {
      console.error('Error creating keypair:', keypairError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid SOLANA_PRIVATE_KEY format. The key should be in base58 format.' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create mint with detailed logging
    console.log('Creating mint...');
    let mint;
    try {
      mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        decimals
      );
      console.log('Mint created successfully:', mint.toBase58());
    } catch (mintError) {
      console.error('Error creating mint:', mintError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: mintError instanceof Error ? mintError.message : 'Failed to create mint' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const mintAddress = mint.toBase58();

    // Create token account for owner with detailed logging
    console.log('Creating token account for owner:', ownerAddress);
    let tokenAccount;
    try {
      const ownerPublicKey = new PublicKey(ownerAddress);
      tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        ownerPublicKey
      );
      console.log('Token account created:', tokenAccount.address.toBase58());
    } catch (tokenAccountError) {
      console.error('Error creating token account:', tokenAccountError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tokenAccountError instanceof Error ? tokenAccountError.message : 'Failed to create token account' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mint initial supply with detailed logging
    console.log('Minting initial supply:', initialSupply);
    try {
      await mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        initialSupply * Math.pow(10, decimals)
      );
      console.log('Initial supply minted successfully');
    } catch (mintToError) {
      console.error('Error minting initial supply:', mintToError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: mintToError instanceof Error ? mintToError.message : 'Failed to mint initial supply' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Store token details in Supabase with detailed logging
    console.log('Storing token details in Supabase...');
    const { data, error: dbError } = await supabaseClient
      .from('tokens')
      .insert([{
        token_name: tokenName,
        token_symbol: tokenSymbol,
        mint_address: mintAddress,
        owner_address: ownerAddress
      }]);

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store token details' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Token creation completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        mintAddress,
        message: 'Token created successfully'
      }),
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
