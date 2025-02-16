
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const allowedOrigins = [
  'https://mememint.co',
  'https://www.mememint.co',
  'https://mememintco.netlify.app'
];

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
});

interface CreateTokenRequest {
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  initialSupply: number;
  ownerAddress: string;
  blockhash: string;
  fees: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  description?: string;
  revokeFreeze?: boolean;
  revokeMint?: boolean;
  revokeUpdate?: boolean;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || allowedOrigins[0];
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders(origin)
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    const requestData: CreateTokenRequest = await req.json();
    console.log('Received request data:', requestData);

    // Validate required fields
    if (!requestData.tokenName || !requestData.tokenSymbol || 
        !requestData.decimals || !requestData.initialSupply || 
        !requestData.ownerAddress || !requestData.blockhash) {
      throw new Error('Missing required fields');
    }

    // For now, just return success with the validated data
    // We'll add the actual token creation logic in the next step
    return new Response(
      JSON.stringify({
        success: true,
        message: "Validation successful",
        data: requestData
      }),
      { 
        headers: { 
          ...corsHeaders(origin), 
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: error instanceof Error && error.message === 'Method not allowed' ? 405 : 500,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
