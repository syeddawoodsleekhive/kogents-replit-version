
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  workspace?: string;
}

export const LoadingScreen = ({ workspace }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return prev;
        }
        return prev + 10;
      });
    }, 500);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Connecting to {workspace || "workspace"}
          </h2>
          <p className="text-muted-foreground">Please wait while we get things ready...</p>
          <div className="w-full max-w-xs mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
