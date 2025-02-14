
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { TokenData } from "@/types/token";

interface TokenDetailsStepProps {
  tokenData: TokenData;
  setTokenData: (data: TokenData) => void;
  onNext: () => void;
}

export const TokenDetailsStep = ({ tokenData, setTokenData, onNext }: TokenDetailsStepProps) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("File must be an image");
      return;
    }

    try {
      const resizedFile = await resizeImage(file);
      setTokenData({ ...tokenData, logo: resizedFile });
      toast.success("Logo uploaded and resized successfully!");
    } catch (error) {
      toast.error("Error processing image");
      console.error(error);
    }
  };

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

  const handleNext = () => {
    if (!tokenData.name || !tokenData.symbol || !tokenData.logo) {
      toast.error("Please fill in all fields and upload a logo");
      return;
    }
    onNext();
  };

  return (
    <Card className="p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl hover:shadow-slate-700/30 transition-all duration-300">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Name</label>
            <Input 
              placeholder="MemeMint" 
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.name}
              onChange={(e) => setTokenData({ ...tokenData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Token Symbol</label>
            <Input 
              placeholder="MM" 
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              value={tokenData.symbol}
              onChange={(e) => setTokenData({ ...tokenData, symbol: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Logo</label>
          <label className="border-2 border-dashed border-slate-700 rounded-lg p-8 hover:border-emerald-500/50 transition-colors cursor-pointer block">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center space-y-2">
              {tokenData.logo ? (
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={URL.createObjectURL(tokenData.logo)} 
                    alt="Token logo preview" 
                    className="w-16 h-16 rounded-full"
                  />
                  <p className="text-sm text-emerald-400">Logo uploaded and resized to 500x500!</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-sm text-slate-400">Drop your token logo here</p>
                  <p className="text-xs text-slate-500">Any size image will be resized to 500x500</p>
                </>
              )}
            </div>
          </label>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </Card>
  );
};
