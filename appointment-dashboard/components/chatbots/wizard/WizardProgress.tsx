"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WizardStep } from "@/types/chatbots/wizard"

interface WizardProgressProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick: (stepIndex: number) => void
}

// Memoized step circle component
const StepCircle = React.memo<{
  step: WizardStep
  index: number
  currentStep: number
  onStepClick: (stepIndex: number) => void
}>(({ step, index, currentStep, onStepClick }) => {
  const handleClick = React.useCallback(() => {
    onStepClick(index)
  }, [onStepClick, index])

  const isCompleted = index < currentStep
  const isCurrent = index === currentStep
  const isDisabled = index > currentStep

  return (
    <div className="flex items-center">
      {/* Step Circle */}
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
          isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : isCurrent
              ? "border-primary text-primary bg-background"
              : "border-muted-foreground/30 text-muted-foreground bg-background hover:border-muted-foreground/50",
        )}
        disabled={isDisabled}
      >
        {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium">{index + 1}</span>}
      </button>

      {/* Step Label */}
      <div className="ml-3 hidden sm:block">
        <div className={cn("text-sm font-medium", index <= currentStep ? "text-foreground" : "text-muted-foreground")}>
          {step.title}
        </div>
        <div className="text-xs text-muted-foreground">{step.description}</div>
      </div>
    </div>
  )
})

StepCircle.displayName = "StepCircle"

// Memoized connector line component
const ConnectorLine = React.memo<{
  isCompleted: boolean
}>(({ isCompleted }) => (
  <div
    className={cn(
      "hidden sm:block w-12 h-0.5 mx-4 transition-colors duration-200",
      isCompleted ? "bg-primary" : "bg-muted-foreground/30",
    )}
  />
))

ConnectorLine.displayName = "ConnectorLine"

// Memoized mobile step info component
const MobileStepInfo = React.memo<{
  currentStep: WizardStep
}>(({ currentStep }) => (
  <div className="sm:hidden mt-3 text-center">
    <div className="text-sm font-medium">{currentStep.title}</div>
    <div className="text-xs text-muted-foreground">{currentStep.description}</div>
  </div>
))

MobileStepInfo.displayName = "MobileStepInfo"

export const WizardProgress = React.memo<WizardProgressProps>(({ steps, currentStep, onStepClick }) => {
  const currentStepData = React.useMemo(() => steps[currentStep], [steps, currentStep])

  return (
    <div className="w-full bg-background border-b">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepCircle step={step} index={index} currentStep={currentStep} onStepClick={onStepClick} />

              {/* Connector Line */}
              {index < steps.length - 1 && <ConnectorLine isCompleted={index < currentStep} />}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Step Info */}
        <MobileStepInfo currentStep={currentStepData} />
      </div>
    </div>
  )
})

WizardProgress.displayName = "WizardProgress"
