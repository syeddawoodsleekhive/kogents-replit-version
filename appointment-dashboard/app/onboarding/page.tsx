"use client";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Components
import OnboardingHeader from "@/components/onboarding/OnboardingHeader";
import OnboardingContainer from "@/components/onboarding/OnboardingContainer";
import AdminInfoStep from "@/components/onboarding/AdminInfoStep";
import OrgInfoStep from "@/components/onboarding/OrgInfoStep";
import WorkspaceStep from "@/components/onboarding/WorkspaceStep";
import ConfirmationStep from "@/components/onboarding/ConfirmationStep";

// Hook
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEffect, useRef, useState } from "react";
import { getOnboardingTrackingData } from "@/lib/getOnboardingTrackingData";
import type { AdminSignupPayload } from "@/hooks/useOnboarding";
import Axios from "@/lib/axios";

// Add global declaration for window.getReferrerData
declare global {
  interface Window {
    getReferrerData?: () => any;
  }
}

// Utility to replace empty string values with null
function replaceEmptyWithNull<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ])
  ) as T;
}

// Type for /auth/signup API response
export type SignupResponse = {
  sessionId: string;
  step: string;
  email: string;
  expiresAt: string;
};

const Onboarding = () => {
  const {
    step,
    setStep,
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
  } = useOnboarding();

  // Store tracking data in a ref so it's available for payloads
  const trackingDataRef = useRef<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSessionId(localStorage.getItem("sessionId"));
    }
  }, []);

  useEffect(() => {
    getOnboardingTrackingData().then((data) => {
      trackingDataRef.current = data;
      if (typeof window !== "undefined" && window.getReferrerData) {
        const refData = window.getReferrerData();
        // console.log("getReferrerData:", refData);
      } else if (typeof window !== "undefined") {
        // Try to import and call getReferrerData from the tracking util
        import("@/lib/getOnboardingTrackingData").then((mod) => {
          // Removed getReferrerData access as it is not exported from the module
        });
      }
    });
  }, []);

  const handleSession = async () => {
    try {
      const res = await Axios.post("/auth/verify/send-otp", {
        sessionId: adminData.sessionId ? adminData.sessionId : sessionId,
      });
      console.log("Step 3", res);
    } catch (error) {
      console.log("error", error);
    }
  };
  useEffect(() => {
    if (adminData && adminData.email && step === "confirm") {
      handleSession();
    }
  }, [adminData, step]);

  


  return (
    <>
      <OnboardingHeader currentStep={getCurrentStepNumber()} totalSteps={4} />

      <OnboardingContainer currentStep={getCurrentStepNumber()} totalSteps={4}>
        {step === "admin-info" && (
          <>
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
              <CardDescription>
                Create an admin account to manage your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminInfoStep
                onSubmit={async (values: any) => {
                  // console.log("values", values);
                  // const tracking = trackingDataRef.current || {};
                  // Build the payload as required by the API
                  const payload = {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    // countryCode: tracking.countryCode || "",
                    // latitude: +tracking.latitude || -1,
                    // longitude: +tracking.longitude || -1,
                    // timezone: tracking.timezone || "",
                    // referrerUrl: tracking.referrerUrl || "",
                    // landingPage: tracking.landingPage || "",
                    // utmSource: tracking.utmSource || "",
                    // utmMedium: tracking.utmMedium || "",
                    // utmCampaign: tracking.utmCampaign || "",
                    // utmTerm: tracking.utmTerm || "",
                    // utmContent: tracking.utmContent || "",
                  };
                  // let cleanedPayload = replaceEmptyWithNull(payload) as AdminSignupPayload;
                  // if (cleanedPayload.landingPage && typeof cleanedPayload.landingPage === 'string' && cleanedPayload.landingPage.includes('localhost')) {
                  //   cleanedPayload.landingPage = 'www.example.com';
                  // }
                  // if (cleanedPayload.referrerUrl && typeof cleanedPayload.referrerUrl === 'string' && cleanedPayload.referrerUrl.includes('localhost')) {
                  //   cleanedPayload.referrerUrl = 'www.example.com';
                  // }
                  // Await the signup and store response in setAdminData
                  await onAdminInfoSubmit(payload);
                }}
                defaultValues={
                  adminData || {
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  }
                }
              />
            </CardContent>
          </>
        )}

        {step === "org-info" && (
          <>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Tell us about your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <OrgInfoStep
                onSubmit={async (values: any) => {
                  await onOrgInfoSubmit(values);
                }}
                onBack={() => setStep("admin-info")}
                defaultValues={
                  orgData || {
                    companyName: "",
                    industry: "",
                    size: "",
                    country: "",
                  }
                }
              />
            </CardContent>
          </>
        )}

        {step === "workspace" && (
          <>
            <CardHeader>
              <CardTitle>Workspace Registration</CardTitle>
              <CardDescription>Set up your workspace access</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceStep
                onSubmit={async (values: any) => {
                  await onWorkspaceSubmit(values);
                }}
                onBack={() => setStep("org-info")}
                defaultValues={
                  workspaceData || {
                    workspaceEmail: adminData?.email || "",
                    workspaceSlug: "",
                    terms: false,
                  }
                }
              />
            </CardContent>
          </>
        )}

        {step === "confirm" && (
          <>
            <CardHeader>
              <CardTitle>Email Confirmation</CardTitle>
              <CardDescription>
                Enter the verification code sent to{" "}
                {workspaceData && workspaceData.workspaceEmail}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfirmationStep
                onSubmit={async (values: any) => {
                  await onConfirmationSubmit(values);
                }}
                onBack={() => setStep("workspace")}
                onResendCode={handleResendCode}
                onChangeEmail={() => setStep("workspace")}
                email={workspaceData?.workspaceEmail ?? ""}
                isSubmitting={isSubmitting}
                defaultValues={{
                  code: "",
                }}
              />
            </CardContent>
          </>
        )}
      </OnboardingContainer>
    </>
  );
};

export default Onboarding;
