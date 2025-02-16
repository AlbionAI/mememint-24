
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const allowedOrigins = [
  'https://mememint.co',
  'https://www.mememint.co',
  'https://mememintco.netlify.app',
  'http://localhost:5173'
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Temporarily allow all origins for debugging
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

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
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Content-Length': '0'
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
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

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Validation successful",
        data: requestData
      }),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
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
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
