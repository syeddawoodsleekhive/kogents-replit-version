
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isSubmitting: boolean;
  isAttemptingLogin: boolean;
}

export const SubmitButton = ({ isSubmitting, isAttemptingLogin }: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={isSubmitting || isAttemptingLogin}
    >
      {(isSubmitting || isAttemptingLogin) ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  );
};
