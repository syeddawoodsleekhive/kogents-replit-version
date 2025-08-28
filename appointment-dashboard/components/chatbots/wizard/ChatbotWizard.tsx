"use client"

import React from "react"
import { useOptimizedWizard } from "@/hooks/chatbots/useOptimizedWizard"
import { WizardProgress } from "./WizardProgress"
import { WizardNavigation } from "./WizardNavigation"
import {
  OptimizedBasicInfoStep,
  OptimizedKnowledgeSourcesStep,
  OptimizedAppearanceStep,
  OptimizedWelcomeSetupStep,
  OptimizedIntegrationStep,
} from "./optimized/LazyWizardSteps"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Sparkles } from 'lucide-react'
import { useRouter } from "next/navigation"

// Memoized step renderer to prevent unnecessary re-renders
const StepRenderer = React.memo<{
  currentStep: number
  data: any
  onUpdate: any
  currentStepErrors: string[]
}>(({ currentStep, data, onUpdate, currentStepErrors }) => {
  switch (currentStep) {
    case 0:
      return <OptimizedBasicInfoStep data={data} onUpdate={onUpdate} errors={currentStepErrors} />
    case 1:
      return <OptimizedKnowledgeSourcesStep data={data} onUpdate={onUpdate} errors={currentStepErrors} />
    case 2:
      return <OptimizedAppearanceStep data={data} onUpdate={onUpdate} errors={currentStepErrors} />
    case 3:
      return <OptimizedWelcomeSetupStep data={data} onUpdate={onUpdate} errors={currentStepErrors} />
    case 4:
      return <OptimizedIntegrationStep data={data} onUpdate={onUpdate} errors={currentStepErrors} />
    default:
      return null
  }
})

StepRenderer.displayName = "StepRenderer"

// Memoized success state component
const SuccessState = React.memo<{
  isVisible: boolean
  botName: string
}>(({ isVisible, botName }) => {
  if (!isVisible) return null

  return (
    <Card className="mt-8 border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <div>
            <div className="font-medium">Ready to Deploy!</div>
            <div className="text-sm text-green-700">
              Your chatbot "{botName}" is configured and ready to be created.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

SuccessState.displayName = "SuccessState"

// Main ChatbotWizard component
function ChatbotWizard() {
  const router = useRouter()
  const {
    currentStep,
    data,
    steps,
    canGoNext,
    canGoPrev,
    isLastStep,
    isDraft,
    currentStepErrors,
    updateData,
    goToStep,
    nextStep,
    prevStep,
    saveDraft,
    clearDraft,
  } = useOptimizedWizard()

  const handleComplete = React.useCallback(async () => {
    try {
      // Here you would typically send the data to your API
      console.log("Creating chatbot with data:", data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear draft and redirect
      clearDraft()
      router.push("/chatbots?created=true")
    } catch (error) {
      console.error("Failed to create chatbot:", error)
    }
  }, [data, clearDraft, router])

  return (
    <div className="min-h-screen bg-background">
      <WizardProgress steps={steps} currentStep={currentStep} onStepClick={goToStep} />

      <div className="max-w-4xl mx-auto px-6 py-8 pb-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Chatbot</h1>
          </div>
          <p className="text-muted-foreground">Follow these steps to create and deploy your AI-powered chatbot.</p>
        </div>

        <div className="transition-all duration-300 ease-in-out">
          <StepRenderer
            currentStep={currentStep}
            data={data}
            onUpdate={updateData}
            currentStepErrors={currentStepErrors}
          />
        </div>

        <SuccessState isVisible={isLastStep && canGoNext} botName={data.name || "Untitled Bot"} />
      </div>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        isLastStep={isLastStep}
        isDraft={isDraft}
        onPrevious={prevStep}
        onNext={nextStep}
        onSaveDraft={saveDraft}
        onComplete={handleComplete}
      />
    </div>
  )
}

// Memoize the main component
const MemoizedChatbotWizard = React.memo(ChatbotWizard)
MemoizedChatbotWizard.displayName = "ChatbotWizard"

// Export both named and default exports for compatibility
export { MemoizedChatbotWizard as ChatbotWizard }
export default MemoizedChatbotWizard
