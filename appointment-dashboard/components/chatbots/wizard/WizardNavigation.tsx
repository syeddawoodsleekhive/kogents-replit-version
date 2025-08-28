"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Save, Rocket } from "lucide-react"

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  canGoNext: boolean
  canGoPrev: boolean
  isLastStep: boolean
  isDraft: boolean
  onPrevious: () => void
  onNext: () => void
  onSaveDraft: () => void
  onComplete: () => void
}

// Memoized step indicator
const StepIndicator = React.memo<{
  currentStep: number
  totalSteps: number
  isDraft: boolean
}>(({ currentStep, totalSteps, isDraft }) => (
  <div className="flex items-center gap-4">
    <div className="text-sm text-muted-foreground">
      Step {currentStep + 1} of {totalSteps}
    </div>
    {isDraft && (
      <Badge variant="secondary" className="text-xs">
        Draft Saved
      </Badge>
    )}
  </div>
))

StepIndicator.displayName = "StepIndicator"

// Memoized action buttons
const ActionButtons = React.memo<{
  canGoPrev: boolean
  canGoNext: boolean
  isLastStep: boolean
  onPrevious: () => void
  onNext: () => void
  onSaveDraft: () => void
  onComplete: () => void
}>(({ canGoPrev, canGoNext, isLastStep, onPrevious, onNext, onSaveDraft, onComplete }) => (
  <div className="flex items-center gap-3">
    <Button variant="outline" onClick={onSaveDraft} className="gap-2">
      <Save className="w-4 h-4" />
      Save Draft
    </Button>

    <Button variant="outline" onClick={onPrevious} disabled={!canGoPrev} className="gap-2">
      <ChevronLeft className="w-4 h-4" />
      Previous
    </Button>

    {isLastStep ? (
      <Button onClick={onComplete} disabled={!canGoNext} className="gap-2">
        <Rocket className="w-4 h-4" />
        Create Chatbot
      </Button>
    ) : (
      <Button onClick={onNext} disabled={!canGoNext} className="gap-2">
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    )}
  </div>
))

ActionButtons.displayName = "ActionButtons"

export const WizardNavigation = React.memo<WizardNavigationProps>(
  ({
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    isLastStep,
    isDraft,
    onPrevious,
    onNext,
    onSaveDraft,
    onComplete,
  }) => {
    return (
      <div className="sticky bottom-0 bg-background border-t">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} isDraft={isDraft} />

            <ActionButtons
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              isLastStep={isLastStep}
              onPrevious={onPrevious}
              onNext={onNext}
              onSaveDraft={onSaveDraft}
              onComplete={onComplete}
            />
          </div>
        </div>
      </div>
    )
  },
)

WizardNavigation.displayName = "WizardNavigation"
