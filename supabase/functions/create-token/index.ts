
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Test edge function's access to secrets
    const tokenCreatorPrivateKey = Deno.env.get('SOLANA_PRIVATE_KEY');
    const feeCollectorPrivateKey = Deno.env.get('FEE_COLLECTOR_PRIVATE_KEY');
    
    console.log('Checking environment variables:');
    console.log('SOLANA_PRIVATE_KEY exists:', !!tokenCreatorPrivateKey);
    console.log('FEE_COLLECTOR_PRIVATE_KEY exists:', !!feeCollectorPrivateKey);
    
    if (tokenCreatorPrivateKey) {
      console.log('SOLANA_PRIVATE_KEY length:', tokenCreatorPrivateKey.length);
    }
    if (feeCollectorPrivateKey) {
      console.log('FEE_COLLECTOR_PRIVATE_KEY length:', feeCollectorPrivateKey.length);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        hasTokenCreatorKey: !!tokenCreatorPrivateKey,
        hasFeeCollectorKey: !!feeCollectorPrivateKey,
        tokenCreatorKeyLength: tokenCreatorPrivateKey?.length,
        feeCollectorKeyLength: feeCollectorPrivateKey?.length
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
