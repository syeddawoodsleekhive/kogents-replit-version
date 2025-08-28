
import React from "react";

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingHeader = ({ currentStep, totalSteps }: OnboardingHeaderProps) => {
  return (
    <div className="text-center space-y-2 mt-8">
      <h1 className="text-3xl font-bold tracking-tight">Welcome to ZenChat</h1>
      <p className="text-muted-foreground">
        Set up your workspace in a few steps
      </p>
    </div>
  );
};

export default OnboardingHeader;
