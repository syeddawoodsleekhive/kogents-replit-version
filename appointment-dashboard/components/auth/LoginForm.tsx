import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { AuthError } from "@/types/auth";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { SubmitButton } from "./SubmitButton";
import { FormError } from "./FormError";
import Link from "next/link";

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  authError: AuthError | null;
  connectionError: string | null;
  isAttemptingLogin: boolean;
}

export const LoginForm = ({
  onSubmit,
  authError,
  connectionError,
  isAttemptingLogin,
}: LoginFormProps) => {
  const [submitAttempts, setSubmitAttempts] = useState(0);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Reset form errors when authError changes
  useEffect(() => {
    if (authError) {
      // If password is incorrect, just highlight the password field
      if (
        authError.code === "invalid_credentials" ||
        authError.message.toLowerCase().includes("invalid login")
      ) {
        form.setError("password", {
          type: "manual",
          message: "Password incorrect",
        });

        // Also highlight email field in case the email is wrong
        form.setError("email", {
          type: "manual",
          message: "Email might be incorrect",
        });

        console.log("Login form showing errors due to invalid credentials");
      }
    }
  }, [authError, form]);

  const handleSubmit = async (values: LoginFormValues) => {
    if (isAttemptingLogin) return;

    setSubmitAttempts((prev) => prev + 1);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
      // Error handling is done at the parent component level
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {authError && (
          <FormError title="Authentication Error" message={authError.message} />
        )}

        {connectionError && (
          <FormError title="Connection Error" message={connectionError} />
        )}

        <EmailField control={form.control} disabled={isAttemptingLogin} />

        <PasswordField control={form.control} disabled={isAttemptingLogin} />

        <div className="flex items-center justify-between">
          <Link
            href="/orbittech/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <SubmitButton
          isSubmitting={isSubmitting}
          isAttemptingLogin={isAttemptingLogin}
        />
      </form>
    </Form>
  );
};
