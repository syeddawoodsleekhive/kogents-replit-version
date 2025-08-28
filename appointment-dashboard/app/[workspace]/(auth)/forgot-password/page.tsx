"use client";

import { useToast } from "@/hooks/use-toast";
import Axios from "@/lib/axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Step = "request" | "check-email" | "reset";

export default function ForgotPasswordPage() {
  // Simulate step: "request" (email input), "check-email" (info), "reset" (change password)
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  //  fetch token from query params
  const token = useSearchParams().get("token") || "";

  // fetch workspace from url
  const workspace = pathname.split("/")[1] || "orbittech";

  const { toast } = useToast();

  const handleRequest = async () => {
    try {
      const res = await Axios.post("/auth/verify/request-password-reset", {
        email: email,
      });
      if (res) {
        setStep("check-email");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetPassword = async () => {
    const payload = {
      newPassword: password,
      token: token,
    };
    try {
      const res = await Axios.post(
        "/auth/verify/confirm-password-reset",
        payload
      );
      if (res) {
        router.push(`/${workspace}/login`);
        setStep("request");
        setPassword("");
        setConfirmPassword("");
        setPasswordError("");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to reset password",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {step === "request" && (
          <div className="bg-card rounded-lg shadow-lg p-8 border">
            <h2 className="text-sm text-muted-foreground text-center mb-4">
              Please set me up with a new password
            </h2>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              To reset your password, enter your email address and we&apos;ll
              send you an email with instructions.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRequest();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="email"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary/90 transition"
              >
                Submit
              </button>
              <div className="text-center mt-2">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}

        {step === "check-email" && (
          <div className="bg-card rounded-lg shadow-lg p-8 border text-center">
            <h2 className="text-2xl font-bold mb-2">
              Check your email for a reset link
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              If you don&apos;t find the email in your inbox, check your spam
              folder.
            </p>
            <ul className="text-left text-sm text-muted-foreground mb-6 list-disc list-inside space-y-1">
              <li>
                If an account with this email exists, a password reset link has
                been sent.
              </li>
              <li>
                Only users already registered can apply for a new password.
              </li>
              <li>
                This app does not offer self-registration. Please contact your
                company representative for further information.
              </li>
            </ul>
            <button
              className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary/90 transition"
              onClick={() => router.push(`/${workspace}/login`)}
            >
              Close
            </button>
          </div>
        )}

        {step === "reset" && (
          <div className="bg-card rounded-lg shadow-lg p-8 border">
            <h2 className="text-2xl font-bold text-center mb-2">
              Change password
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password !== confirmPassword) {
                  setPasswordError("Passwords do not match");
                  return;
                }
                handleResetPassword();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="password"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={5}
                    maxLength={72}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="confirm-password"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={5}
                    maxLength={72}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <div className="text-red-500 text-sm mb-2">{passwordError}</div>
              )}
              <div className="text-sm text-muted-foreground mb-2">
                <div className="mb-1 font-medium">Password requirements:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>must be at least 5 characters</li>
                  <li>must be fewer than 72 characters</li>
                  <li>must be different from email address</li>
                </ul>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary/90 transition"
              >
                Change password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
