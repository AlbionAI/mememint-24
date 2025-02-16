
/// <reference types="vite/client" />

interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: string }>;
    disconnect: () => Promise<void>;
  }
  solflare?: {
    isSolflare?: boolean;
  }
  Buffer?: any;
}
