import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { Coins } from "lucide-react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createMint, getAssociatedTokenAddress, createAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { toast } from "sonner";

interface TokenSocialDetailsProps {
  tokenData: {
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
    creatorName: string;
    creatorWebsite: string;
    modifyCreator: boolean;
    revokeFreeze: boolean;
    revokeMint: boolean;
    revokeUpdate: boolean;
    decimals: number;
  };
  onTokenDataChange: (data: any) => void;
  onBack: () => void;
}

export const TokenSocialDetails = ({
  tokenData,
  onTokenDataChange,
  onBack
}: TokenSocialDetailsProps) => {
  // Enable all switches by default when component mounts
  useEffect(() => {
    onTokenDataChange({
      ...tokenData,
      modifyCreator: true,
      revokeFreeze: true,
      revokeMint: true,
      revokeUpdate: true
    });
  }, []); // Empty dependency array means this runs once on mount

  // Calculate total cost based on enabled switches
  const calculateTotalCost = () => {
    let cost = 0.1; // Base cost
    if (tokenData.modifyCreator) cost += 0.1;
    if (tokenData.revokeFreeze) cost += 0.1;
    if (tokenData.revokeMint) cost += 0.1;
    if (tokenData.revokeUpdate) cost += 0.1;
    return cost.toFixed(1);
  };

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const createToken = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      toast.loading("Creating your token...");

      // Create new mint
      const mintKeypair = Keypair.generate();
      const decimals = Number(tokenData.decimals);

      const lamports = await connection.getMinimumBalanceForRentExemption(82);
      
      const createMintTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: 82,
          lamports,
          programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        }),
        createMint(
          connection,
          publicKey,
          publicKey,
          publicKey,
          decimals
        )
      );

      const signature = await sendTransaction(createMintTransaction, connection, {
        signers: [mintKeypair]
      });

      await connection.confirmTransaction(signature);

      toast.success("Token created successfully!");
      console.log("Mint address:", mintKeypair.publicKey.toString());

      // Here we would continue with:
      // 1. Setting metadata (name, symbol, image)
      // 2. Creating Raydium liquidity pool
      // 3. Adding initial liquidity
      // But these require additional setup and dependencies

    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to create token");
    }
  };

  return (
    <Card className="p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Website</label>
            <Input 
              placeholder="https://yourmemecoin.co"
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.website}
              onChange={(e) => onTokenDataChange({ ...tokenData, website: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Twitter</label>
            <Input 
              placeholder="https://twitter.com/yourmemecoin"
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.twitter}
              onChange={(e) => onTokenDataChange({ ...tokenData, twitter: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Telegram</label>
            <Input 
              placeholder="https://t.me/yourchannel"
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.telegram}
              onChange={(e) => onTokenDataChange({ ...tokenData, telegram: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Discord</label>
            <Input 
              placeholder="https://discord.gg/your-server"
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.discord}
              onChange={(e) => onTokenDataChange({ ...tokenData, discord: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Modify Creator Information</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">(+0.1 SOL)</span>
              <Switch 
                checked={tokenData.modifyCreator}
                onCheckedChange={(checked) => onTokenDataChange({ ...tokenData, modifyCreator: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Change the information of the creator in the metadata. By default, it is MemeMint.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Creator Name</label>
              <Input 
                placeholder="MemeMint"
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                value={tokenData.creatorName}
                onChange={(e) => onTokenDataChange({ ...tokenData, creatorName: e.target.value })}
                disabled={!tokenData.modifyCreator}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Creator Website</label>
              <Input 
                placeholder="https://mememint.co"
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                value={tokenData.creatorWebsite}
                onChange={(e) => onTokenDataChange({ ...tokenData, creatorWebsite: e.target.value })}
                disabled={!tokenData.modifyCreator}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Revoke Authorities</h3>
            <p className="text-sm text-slate-400">
              Enhance trust and decentralization by revoking token authorities. This prevents future changes to your token's supply, transfers, and metadata - making it more appealing to investors who value security and immutability.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Revoke Freeze</span>
                    <span className="text-xs text-emerald-400">+0.1 SOL</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Freeze Authority allows you to freeze token accounts of your holders.
                  </p>
                  <Switch 
                    checked={tokenData.revokeFreeze}
                    onCheckedChange={(checked) => onTokenDataChange({ ...tokenData, revokeFreeze: checked })}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </Card>
              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Revoke Mint</span>
                    <span className="text-xs text-emerald-400">+0.1 SOL</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mint Authority allows you to mint more supply of your token.
                  </p>
                  <Switch 
                    checked={tokenData.revokeMint}
                    onCheckedChange={(checked) => onTokenDataChange({ ...tokenData, revokeMint: checked })}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </Card>
              <Card className="p-4 bg-slate-900/50 border-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Revoke Update</span>
                    <span className="text-xs text-emerald-400">+0.1 SOL</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Update Authority allows you to update the token metadata.
                  </p>
                  <Switch 
                    checked={tokenData.revokeUpdate}
                    onCheckedChange={(checked) => onTokenDataChange({ ...tokenData, revokeUpdate: checked })}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-white">
          <span className="text-lg">Total Cost:</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-emerald-400">{calculateTotalCost()}</span>
            <Coins className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline"
            className="px-8"
            onClick={onBack}
          >
            Back
          </Button>
          <Button 
            className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            onClick={createToken}
          >
            Create Token
          </Button>
        </div>
      </div>
    </Card>
  );
};
