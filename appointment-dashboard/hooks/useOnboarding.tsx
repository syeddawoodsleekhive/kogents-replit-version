import { setToken, setUserData } from "@/functions";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import {
  adminInfoSubmit,
  orgInfoSubmit,
  workspaceSubmit,
  confirmationSubmit,
  resendCode,
  signupResume,
  setStep,
} from "@/api/v2/onboarding";
import { ConfirmationData } from "@/types/onboarding";

interface AdminInfoDataType {
  id?: string;
  name: string;
  email: string;
  password: string;
  sessionId?: string;
}

export enum SignupStep {
  SIGNUP = "signup",
  WORKSPACE_CREATED = "workspace_created",
  EMAIL_SENT = "email_sent",
  PENDING_VERIFICATION = "pending_verification",
}

// Add type for admin signup payload
export type AdminSignupPayload = {
  name: string;
  email: string;
  password: string;
  // countryCode: string;
  // latitude: number
  // longitude: number
  // timezone: string;
  // referrerUrl: string;
  // landingPage: string;
  // utmSource: string;
  // utmMedium: string;
  // utmCampaign: string;
  // utmTerm: string;
  // utmContent: string;
};

export const useOnboarding = () => {
  const dispatch = useDispatch();
  const navigate = useRouter();

  // Get state from Redux
  const {
    step,
    adminData,
    orgData,
    workspaceData,
    loading: isSubmitting,
    sessionId,
  } = useSelector((state: any) => state.onboarding);

  const sessionRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSessionId = localStorage.getItem("sessionId");
      if (storedSessionId && !sessionRef.current) {
        dispatch(signupResume(storedSessionId) as any);
        sessionRef.current = true;
      }
    }
  }, [dispatch]);

  // Dummy createWorkspace that always returns success
  const createWorkspaceIfNeeded = async (slug: string) => {
    // Simulate workspace creation delay
    await new Promise((res) => setTimeout(res, 800));
    return { id: `dummy-${slug}` };
  };

  const getCurrentStepNumber = () => {
    switch (step) {
      case "admin-info":
        return 1;
      case "org-info":
        return 2;
      case "workspace":
        return 3;
      case "confirm":
        return 4;
      default:
        return 1;
    }
  };

  const getCurrentStep = (value: string) => {
    switch (value) {
      case SignupStep.SIGNUP:
        return dispatch(setStep("org-info"));
      case SignupStep.WORKSPACE_CREATED:
        return dispatch(setStep("confirm"));
      case SignupStep.EMAIL_SENT:
        return dispatch(setStep("confirm"));
    }
  };

  const onAdminInfoSubmit = async (payload: AdminSignupPayload) => {
    try {
      const result = await dispatch(adminInfoSubmit(payload) as any);
      if (result.success) {
        sessionRef.current = true;
        getCurrentStep(result.data.step);
      } else {
        toast.error("Signup error", {
          description: result.error || "An error occurred during signup.",
        });
      }
    } catch (error: any) {
      toast.error("Signup error", {
        description: error?.message || "An error occurred during signup.",
      });
    }
  };

  const onOrgInfoSubmit = async (data: any) => {
    try {
      const result = await dispatch(orgInfoSubmit(data) as any);
      if (!result.success) {
        toast.error("Org Info error", {
          description:
            result.error || "An error occurred while saving organization info.",
        });
      }
    } catch (error: any) {
      toast.error("Org Info error", {
        description:
          error?.message || "An error occurred while saving organization info.",
      });
    }
  };

  const onWorkspaceSubmit = (data: any) => {
    try {
      dispatch(workspaceSubmit(data) as any)
        .then((result: any) => {
          if (result.success) {
            getCurrentStep(result.data.step);
            toast.success("Verification Code Sent", {
              description: `A verification code has been sent to ${data.workspaceEmail}`,
            });
          } else {
            toast.error("Workspace creation failed", {
              description:
                result.error || "An error occurred during workspace creation.",
            });
          }
        })
        .catch((error: any) => {
          toast.error("Workspace creation error", {
            description:
              error?.message || "An error occurred during workspace creation.",
          });
        });
    } catch (error: any) {
      toast.error("Workspace creation error", {
        description:
          error?.message || "An error occurred during workspace creation.",
      });
    }
  };

  const onConfirmationSubmit = async (data: ConfirmationData) => {
    try {
      if (!workspaceData || !adminData)
        throw new Error("Missing required data");

      const workspace = await createWorkspaceIfNeeded(
        workspaceData.workspaceSlug
      );
      if (!workspace) throw new Error("Failed to create workspace");

      const result = await dispatch(confirmationSubmit(data) as any);

      if (result.success) {
        toast.success("Workspace Created Successfully!", {
          description: "You can now sign in to your workspace",
        });
        navigate.replace(`/${result.data.workspace.slug}`);
      } else {
        toast.error("Workspace creation failed", {
          description:
            result.error || "An error occurred during workspace creation.",
        });
      }
    } catch (error: any) {
      toast.error("Error", {
        description:
          error.message || "Failed to create workspace. Please try again.",
      });
    }
  };

  const handleResendCode = async () => {
    try {
      const result = await dispatch(resendCode() as any);
      if (result.success) {
        toast.success("Verification Code Resent", {
          description: `A new code has been sent to ${workspaceData?.workspaceEmail}`,
        });
      } else {
        toast.error("Resend code error", {
          description:
            result.error || "An error occurred while resending the code.",
        });
      }
    } catch (error: any) {
      toast.error("Resend code error", {
        description:
          error?.message || "An error occurred while resending the code.",
      });
    }
  };

  return {
    step,
    setStep: (step: any) => dispatch(setStep(step)),
    adminData,
    orgData,
    workspaceData,
    isSubmitting,
    getCurrentStepNumber,
    onAdminInfoSubmit,
    onOrgInfoSubmit,
    onWorkspaceSubmit,
    onConfirmationSubmit,
    handleResendCode,
  };
};
