
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const TokenCreation = () => {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<{name: string, symbol: string} | null>(null);

  const createToken = async () => {
    setLoading(true);

    try {
      const response = await fetch("https://your-backend-url.com/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Token",
          symbol: "MTK",
          totalSupply: 1000000,
          decimals: 18,
          description: "A new crypto token",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Token creation failed");
      }

      setToken(data.token);
      toast.success("Token created successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={createToken}
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
      >
        {loading ? "Creating..." : "Create Token"}
      </Button>
      
      {token && (
        <div className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg">
          <p className="text-white">
            Token Created: {token.name} ({token.symbol})
          </p>
        </div>
      )}
    </div>
  );
};
