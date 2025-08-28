import React from "react";
import { Card, CardFooter } from "@/components/ui/card";
import StepIndicator from "@/components/onboarding/StepIndicator";

interface OnboardingContainerProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

const OnboardingContainer = ({
  currentStep,
  totalSteps,
  children,
}: OnboardingContainerProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        <Card className="border shadow-lg p-6">{children}</Card>
      </div>
    </div>
  );
};

export default OnboardingContainer;
