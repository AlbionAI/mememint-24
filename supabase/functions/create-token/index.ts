
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram
} from "./deps.ts";
import { 
  TOKEN_PROGRAM_ID, 
  MINT_SIZE, 
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "./deps.ts";
import { 
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
  DataV2,
  createSetAuthorityInstruction,
  AuthorityType
} from "./deps.ts";
import { base64encode } from "./deps.ts";

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
    console.log('Starting request processing...');
    const { 
      tokenName, 
      tokenSymbol, 
      decimals, 
      initialSupply, 
      ownerAddress, 
      blockhash, 
      fees,
      // Add new parameters
      website,
      twitter,
      telegram,
      discord,
      description,
      revokeFreeze,
      revokeMint,
      revokeUpdate
    } = await req.json();
    
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL');
    const feeCollectorAddress = Deno.env.get('FEE_COLLECTOR_ADDRESS');
    
    if (!rpcUrl || !feeCollectorAddress) {
      throw new Error('Required environment variables are not set');
    }

    if (!tokenName || !tokenSymbol || !ownerAddress || !blockhash || fees === undefined) {
      throw new Error('Missing required parameters');
    }

    if (typeof fees !== 'number' || fees < 0.05) {
      throw new Error('Invalid fee amount. Minimum fee is 0.05 SOL');
    }

    console.log('Creating connection to Solana...');
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    try {
      let ownerPublicKey;
      try {
        ownerPublicKey = new PublicKey(ownerAddress);
        console.log('Validated owner address:', ownerPublicKey.toString());
      } catch (error) {
        console.error('Invalid owner address:', error);
        throw new Error('Invalid owner wallet address provided');
      }

      let feeCollectorPublicKey;
      try {
        feeCollectorPublicKey = new PublicKey(feeCollectorAddress);
        console.log('Validated fee collector address:', feeCollectorPublicKey.toString());
      } catch (error) {
        console.error('Invalid fee collector address:', error);
        throw new Error('Invalid fee collector configuration');
      }

      const balance = await connection.getBalance(ownerPublicKey);
      const requiredBalance = fees * LAMPORTS_PER_SOL;
      if (balance < requiredBalance) {
        throw new Error(`Insufficient balance. Required: ${fees} SOL`);
      }
      
      const mintKeypair = Keypair.generate();
      console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

      const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      console.log('Mint rent required:', mintRent);

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        ownerPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log('Associated token account address:', associatedTokenAddress.toString());

      // Create metadata for the token with social links
      const metadataData: DataV2 = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: "", // Will be updated later with logo URL
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
        // Additional metadata that will be stored in the URI JSON
        properties: {
          files: [],
          links: {
            website: website || "",
            twitter: twitter || "",
            telegram: telegram || "",
            discord: discord || "",
          },
          description: description || "",
        }
      };

      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      console.log('Metadata address:', metadataAddress.toString());

      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;

      // Add compute unit limit and priority fee instructions
      const computeUnitLimit = 300000; // 300k compute units
      const microLamports = 50; // Priority fee (0.00000005 SOL per CU, resulting in ~0.015 SOL total priority fee)
      
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeUnitLimit
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports
        })
      );

      // Create fee transfer instruction
      const feeLamports = fees * LAMPORTS_PER_SOL;
      console.log('Creating fee transfer instruction for', feeLamports, 'lamports');
      const feeTransferIx = SystemProgram.transfer({
        fromPubkey: ownerPublicKey,
        toPubkey: feeCollectorPublicKey,
        lamports: feeLamports
      });

      // Add fee transfer as the first instruction
      transaction.add(feeTransferIx);

      // Create mint account instruction
      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID
      });
      
      // Initialize mint instruction
      const initializeMintIx = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        ownerPublicKey,
        ownerPublicKey,
        TOKEN_PROGRAM_ID
      );

      // Create metadata account instruction
      const createMetadataIx = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataAddress,
          mint: mintKeypair.publicKey,
          mintAuthority: ownerPublicKey,
          payer: ownerPublicKey,
          updateAuthority: ownerPublicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: metadataData,
            isMutable: true,
            collectionDetails: null,
          },
        }
      );

      // Create associated token account instruction
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

      // Add all instructions
      transaction.add(
        createMintAccountIx,
        initializeMintIx,
        createMetadataIx,
        createATAIx,
        mintToIx
      );

      // Add authority revocation instructions if switches are DISABLED
      if (!revokeFreeze) {
        const revokeFreezeIx = createSetAuthorityInstruction(
          mintKeypair.publicKey,
          ownerPublicKey,
          AuthorityType.FreezeAccount,
          null
        );
        transaction.add(revokeFreezeIx);
      }

      if (!revokeMint) {
        const revokeMintIx = createSetAuthorityInstruction(
          mintKeypair.publicKey,
          ownerPublicKey,
          AuthorityType.MintTokens,
          null
        );
        transaction.add(revokeMintIx);
      }

      if (!revokeUpdate) {
        const revokeUpdateIx = createSetAuthorityInstruction(
          metadataAddress,
          ownerPublicKey,
          AuthorityType.UpdateMetadata,
          null
        );
        transaction.add(revokeUpdateIx);
      }

      // Partially sign with mint account
      transaction.partialSign(mintKeypair);

      const base64Transaction = base64encode(transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      }));
      
      console.log('Transaction created successfully with metadata');

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
