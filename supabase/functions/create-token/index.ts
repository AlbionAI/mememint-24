
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
    const { tokenName, tokenSymbol, decimals, initialSupply, ownerAddress, blockhash, fees } = await req.json();
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    const feeCollectorAddress = Deno.env.get('FEE_COLLECTOR_ADDRESS');
    
    if (!rpcUrl || !feeCollectorAddress) {
      throw new Error('Required environment variables are not set');
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

      // Validate fee collector address
      let feeCollectorPublicKey;
      try {
        feeCollectorPublicKey = new PublicKey(feeCollectorAddress);
        console.log('Validated fee collector address:', feeCollectorPublicKey.toString());
      } catch (error) {
        console.error('Invalid fee collector address:', error);
        throw new Error('Invalid fee collector configuration');
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

      // Create fee transfer instruction
      const feeLamports = fees * LAMPORTS_PER_SOL;
      const feeTransferIx = SystemProgram.transfer({
        fromPubkey: ownerPublicKey,
        toPubkey: feeCollectorPublicKey,
        lamports: feeLamports
      });

      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;

      // Add fee transfer as the first instruction
      transaction.add(feeTransferIx);

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

      // Add remaining instructions
      transaction.add(
        createMintAccountIx,
        initializeMintIx,
        createATAIx,
        mintToIx
      );

      // Partially sign with mint account
      transaction.partialSign(mintKeypair);

      const base64Transaction = base64encode(transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      }));
      
      console.log('Transaction created successfully with fee collection');

      return new Response(
        JSON.stringify({
          success: true,
          mintAddress: mintKeypair.publicKey.toString(),
          transaction: base64Transaction,
          totalFees: fees
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
