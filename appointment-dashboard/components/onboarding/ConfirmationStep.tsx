
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfirmationData, confirmationSchema } from "@/types/onboarding";
import { Loader2 } from "lucide-react";

interface ConfirmationStepProps {
  onSubmit: (data: ConfirmationData) => void;
  onBack: () => void;
  onResendCode: () => void;
  onChangeEmail: () => void;
  email: string;
  isSubmitting: boolean;
  defaultValues: ConfirmationData;
}

const ConfirmationStep = ({
  onSubmit,
  onBack,
  onResendCode,
  onChangeEmail,
  email,
  isSubmitting,
  defaultValues,
}: ConfirmationStepProps) => {
  const form = useForm<ConfirmationData>({
    resolver: zodResolver(confirmationSchema),
    defaultValues,
  });

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123456" 
                    {...field} 
                    maxLength={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center space-x-4 text-sm">
            <button
              type="button"
              onClick={onResendCode}
              className="text-primary hover:underline"
            >
              Resend Code
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              type="button"
              onClick={onChangeEmail}
              className="text-primary hover:underline"
            >
              Change Email
            </button>
          </div>
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={onBack}
              type="button"
            >
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default ConfirmationStep;
