
import { useState } from "react";
import { toast } from "sonner";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { StepTracker } from "./token/StepTracker";
import { WalletCard } from "./token/WalletCard";
import { TokenBasicDetails } from "./token/TokenBasicDetails";
import { TokenSupplyDetails } from "./token/TokenSupplyDetails";
import { TokenSocialDetails } from "./token/TokenSocialDetails";
import { createToken } from "@/utils/tokenCreation";
import { QRCodeCanvas } from "qrcode.react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Copy, ExternalLink } from "lucide-react";

interface TokenResult {
  mintAddress: string;
  signature: string;
  tokenAccount: string;
  explorerUrl: string;
  raydiumUrl: string;
}

export const TokenConfig = () => {
  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    logo: null as File | null,
    decimals: "9",
    totalSupply: "1000000000",
    description: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    creatorName: "MemeMint",
    creatorWebsite: "https://mememint.co",
    modifyCreator: false,
    revokeFreeze: false,
    revokeMint: false,
    revokeUpdate: false
  });

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(img.src);
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, 500, 500);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(img.src);
            reject(new Error('Could not convert canvas to blob'));
            return;
          }
          
          const resizedFile = new File([blob], file.name, {
            type: 'image/png',
            lastModified: Date.now(),
          });
          
          URL.revokeObjectURL(img.src);
          resolve(resizedFile);
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Error loading image'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("File must be an image");
      return;
    }

    try {
      const resizedFile = await resizeImage(file);
      setTokenData(prev => ({ ...prev, logo: resizedFile }));
      toast.success("Logo uploaded and resized successfully!");
    } catch (error) {
      toast.error("Error processing image");
      console.error(error);
    }
  };

  const handleNext = () => {
    if (!tokenData.name || !tokenData.symbol || !tokenData.logo) {
      toast.error("Please fill in all fields and upload a logo");
      return;
    }
    setStep(2);
  };

  const handleCreateToken = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsDeploying(true);
    try {
      const result = await createToken(connection, wallet, {
        name: tokenData.name,
        symbol: tokenData.symbol,
        totalSupply: tokenData.totalSupply,
        decimals: parseInt(tokenData.decimals),
        disableMint: tokenData.revokeMint,
        disableFreeze: tokenData.revokeFreeze,
      });

      setTokenResult(result);
      toast.success("Token created successfully!", {
        description: `Your token ${tokenData.name} (${tokenData.symbol}) has been created!`,
      });

    } catch (error) {
      console.error('Token creation error:', error);
      toast.error("Failed to create token", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <div className="space-y-8">
      <StepTracker currentStep={step} />

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {step === 1 && (
            <TokenBasicDetails 
              tokenData={tokenData}
              onTokenDataChange={setTokenData}
              onNext={handleNext}
              handleFileChange={handleFileChange}
            />
          )}

          {step === 2 && (
            <TokenSupplyDetails 
              tokenData={tokenData}
              onTokenDataChange={setTokenData}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <TokenSocialDetails 
              tokenData={tokenData}
              onTokenDataChange={setTokenData}
              onBack={() => setStep(2)}
              onCreateToken={handleCreateToken}
              isDeploying={isDeploying}
            />
          )}

          {tokenResult && (
            <Card className="p-6 mt-6 space-y-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700">
              <h3 className="text-lg font-semibold text-white">Token Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <QRCodeCanvas 
                    value={tokenResult.explorerUrl}
                    size={200}
                    level="H"
                    includeMargin
                    className="bg-white p-2 rounded"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Mint Address</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => copyToClipboard(tokenResult.mintAddress, "Mint address copied!")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block p-2 bg-slate-900/50 rounded text-xs text-slate-300 font-mono break-all">
                    {tokenResult.mintAddress}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => window.open(tokenResult.explorerUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Solscan
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => window.open(tokenResult.raydiumUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Trade on Raydium
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <WalletCard />
      </div>
    </div>
  );
};
