
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

serve(async (req) => {
  const origin = req.headers.get('origin') || allowedOrigins[0];
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders(origin)
    });
  }

  try {
    // Simple test response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Function is working"
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
        status: 500,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
