
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";

interface NetworkErrorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
}

export const NetworkErrorDialog = ({
  isOpen,
  onOpenChange,
  onRetry
}: NetworkErrorDialogProps) => {
  const isOnline = navigator.onLine;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-amber-500" /> : <WifiOff className="h-5 w-5 text-destructive" />}
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isOnline 
              ? "We're having trouble connecting to the server. Your internet connection appears to be working, but the server might be unavailable."
              : "Your device appears to be offline. Please check your internet connection and try again."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRetry} className="flex items-center gap-1">
            <Wifi className="h-4 w-4" />
            Try Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
