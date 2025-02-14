
export interface TokenCreationResult {
  mintAddress: string;
  signature: string;
  tokenAccount: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}
