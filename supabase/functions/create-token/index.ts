
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair,
  LAMPORTS_PER_SOL
} from 'https://esm.sh/@solana/web3.js@1.77.0?target=es2022'
import { 
  TOKEN_PROGRAM_ID, 
  MINT_SIZE, 
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from 'https://esm.sh/@solana/spl-token@0.3.8?target=es2022'
import { decode as base58decode } from "https://deno.land/std@0.178.0/encoding/base58.ts";
import { encode as base64encode } from "https://deno.land/std@0.178.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting request processing...');
    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress, blockhash } = await req.json();
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL is not set');
    }

    console.log('Creating connection to Solana...');
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    try {
      // Validate owner address
      let ownerPublicKey;
      try {
        ownerPublicKey = new PublicKey(ownerAddress);
        console.log('Validated owner address:', ownerPublicKey.toString());
      } catch (error) {
        console.error('Invalid owner address:', error);
        throw new Error('Invalid owner wallet address provided');
      }
      
      // Generate new mint account
      const mintKeypair = Keypair.generate();
      console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

      // Calculate rent for mint account
      const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      console.log('Mint rent required:', mintRent);

      // Get the associated token account address for the owner
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        ownerPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log('Associated token account address:', associatedTokenAddress.toString());

      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;

      // Add create mint account instruction
      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID
      });
      
      // Add initialize mint instruction
      const initializeMintIx = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        ownerPublicKey,
        ownerPublicKey,
        TOKEN_PROGRAM_ID
      );

      // Add create associated token account instruction
      const createATAIx = createAssociatedTokenAccountInstruction(
        ownerPublicKey,
        associatedTokenAddress,
        ownerPublicKey,
        mintKeypair.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Calculate initial supply with decimals
      const adjustedSupply = initialSupply * Math.pow(10, decimals);

      // Add mint to instruction
      const mintToIx = createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAddress,
        ownerPublicKey,
        adjustedSupply,
        [],
        TOKEN_PROGRAM_ID
      );

      // Add all instructions to transaction
      transaction.add(
        createMintAccountIx,
        initializeMintIx,
        createATAIx,
        mintToIx
      );

      // Partially sign with mint account
      transaction.partialSign(mintKeypair);

      // Calculate fees for better UX
      const fees = await connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      
      console.log('Estimated fees:', fees.value / LAMPORTS_PER_SOL, 'SOL');

      // Serialize the transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base64Transaction = base64encode(serializedTransaction);
      console.log('Transaction created successfully');

      return new Response(
        JSON.stringify({
          success: true,
          mintAddress: mintKeypair.publicKey.toString(),
          transaction: base64Transaction,
          estimatedFees: fees.value / LAMPORTS_PER_SOL
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('Transaction creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown transaction creation error';
      throw new Error(`Failed to create token transaction: ${errorMessage}`);
    }

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
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
