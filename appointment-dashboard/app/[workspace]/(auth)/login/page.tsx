"use client";

import { useState, useEffect } from "react";
import { LoginForm, LoginFormValues } from "@/components/auth/LoginForm";
import { LoadingScreen } from "@/components/auth/LoadingScreen";
import { NetworkErrorDialog } from "@/components/auth/NetworkErrorDialog";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthError } from "@/types/auth";
import Axios from "@/lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/api/v2/user";

const Login = () => {
  const [isAttemptingLogin, setIsAttemptingLogin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showNetworkErrorDialog, setShowNetworkErrorDialog] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screenType, setScreenType] = useState("login");

  const navigate = useRouter();
  const dispatch: AppReducerDispatch = useDispatch();
  const { workspace: workspaceArr } = useParams();
  const {
    token,
    user,
    workspace: userWorkspace,
  } = useSelector((state: RootReducerState) => state.user);

  const workspace = workspaceArr?.toString();

  const verifyWorkspace = async () => {
    try {
      Axios.get(`/workspace/slug/${workspace}`)
        .then((res) => {
          const response = res.data;
          if (response) {
            setScreenType("login");
          }
        })
        .catch((err) => {
          setScreenType("not-found");
        });
    } catch (error) {
      console.error("verifyWorkspace error:", error);
    }
  };

  // Simulate checking existing auth status
  useEffect(() => {
    verifyWorkspace();
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (token && user && userWorkspace && workspace) {
      // Check if user is in the correct workspace
      if (userWorkspace.slug === workspace) {
        navigate.replace(`/${workspace}`);
      }
    }
  }, [token, user, userWorkspace, navigate, workspace]);

  const clearAuthError = () => setAuthError(null);

  const login = async (email: string, password: string, workspace: string) => {
    try {
      dispatch(loginUser({ email, password }));
    } catch (error) {
      console.error("login error:", error);
      setAuthError({
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      });
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    if (isAttemptingLogin) return;
    setIsAttemptingLogin(true);
    try {
      clearAuthError();
      if (!workspace) throw new Error("Workspace is required");
      await login(values.email, values.password, workspace);
      toast.success("Login successful", {
        description: "Welcome back to your dashboard!",
      });
    } catch (error: any) {
      if (
        !navigator.onLine ||
        error.message?.includes("fetch") ||
        error.message?.includes("network") ||
        error.message?.includes("Failed to fetch")
      ) {
        setConnectionError(
          "Network connection issue. Please check your internet connection."
        );
        setShowNetworkErrorDialog(true);
      } else {
        toast.error("Login failed", {
          description:
            error.message || "Please check your credentials and try again",
        });
        setAuthError(error.message || "Unknown error");
      }
    } finally {
      setIsAttemptingLogin(false);
    }
  };

  const retryConnection = () => {
    try {
      setShowNetworkErrorDialog(false);
      setConnectionError(null);
    } catch (error) {
      console.error("retryConnection error:", error);
    }
  };

  if (isLoading && !isAttemptingLogin) {
    return <LoadingScreen workspace={workspace} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {screenType === "login" && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sign in to {workspace}</h1>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg p-8 border">
            <LoginForm
              onSubmit={onSubmit}
              authError={authError}
              connectionError={connectionError}
              isAttemptingLogin={isAttemptingLogin}
            />
          </div>
        </div>
      )}
      {screenType === "not-found" && (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Workspace not found</h1>
            <p className="text-muted-foreground mt-2">
              The workspace you are trying to access does not exist.
            </p>
          </div>
          <div className="flex justify-center">
            <Link href="/onboarding">
              <button className="bg-primary text-white px-2 py-1 rounded-md">
                Create Workspace
              </button>
            </Link>
          </div>
        </div>
      )}

      <NetworkErrorDialog
        isOpen={showNetworkErrorDialog}
        onOpenChange={setShowNetworkErrorDialog}
        onRetry={retryConnection}
      />
    </div>
  );
};

export default Login;
