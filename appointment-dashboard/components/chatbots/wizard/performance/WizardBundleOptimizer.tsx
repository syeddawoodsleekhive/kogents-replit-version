"use client"

import React from "react"

// Bundle optimization utilities specifically for wizard components
export class WizardBundleOptimizer {
  private static preloadedSteps = new Set<string>()
  private static loadingPromises = new Map<string, Promise<any>>()

  // Preload wizard steps based on user behavior
  static async preloadNextStep(currentStep: number) {
    const stepMap = ["BasicInfoStep", "KnowledgeSourcesStep", "AppearanceStep", "WelcomeSetupStep", "IntegrationStep"]

    const nextStepName = stepMap[currentStep + 1]
    if (nextStepName && !this.preloadedSteps.has(nextStepName)) {
      this.preloadedSteps.add(nextStepName)

      // Preload during idle time
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          this.loadStep(nextStepName)
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.loadStep(nextStepName)
        }, 100)
      }
    }
  }

  // Preload all remaining steps when user reaches step 3
  static async preloadRemainingSteps(currentStep: number) {
    if (currentStep >= 2) {
      const remainingSteps = ["WelcomeSetupStep", "IntegrationStep"]
      remainingSteps.forEach((step) => {
        if (!this.preloadedSteps.has(step)) {
          this.preloadedSteps.add(step)
          this.loadStep(step)
        }
      })
    }
  }

  private static async loadStep(stepName: string) {
    if (this.loadingPromises.has(stepName)) {
      return this.loadingPromises.get(stepName)
    }

    let loadPromise: Promise<any>

    switch (stepName) {
      case "BasicInfoStep":
        loadPromise = import("../steps/BasicInfoStep")
        break
      case "KnowledgeSourcesStep":
        loadPromise = import("../steps/KnowledgeSourcesStep")
        break
      case "AppearanceStep":
        loadPromise = import("../steps/AppearanceStep")
        break
      case "WelcomeSetupStep":
        loadPromise = import("../steps/WelcomeSetupStep")
        break
      case "IntegrationStep":
        loadPromise = import("../steps/IntegrationStep")
        break
      default:
        return Promise.resolve()
    }

    this.loadingPromises.set(stepName, loadPromise)
    return loadPromise
  }

  // Get bundle size information for monitoring
  static getBundleInfo() {
    return {
      preloadedSteps: Array.from(this.preloadedSteps),
      loadingPromises: this.loadingPromises.size,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  private static estimateMemoryUsage() {
    // Rough estimation of memory usage
    return {
      preloadedComponents: this.preloadedSteps.size * 50, // ~50KB per step
      activePromises: this.loadingPromises.size * 10, // ~10KB per promise
    }
  }
}

// Hook for wizard-specific performance optimization
export function useWizardPerformance(currentStep: number) {
  React.useEffect(() => {
    // Preload next step when current step changes
    WizardBundleOptimizer.preloadNextStep(currentStep)

    // Preload remaining steps when user is halfway through
    WizardBundleOptimizer.preloadRemainingSteps(currentStep)
  }, [currentStep])

  const [info, setInfo] = React.useState(() => WizardBundleOptimizer.getBundleInfo())

  React.useEffect(() => {
    // Performance monitoring in development
    if (process.env.NODE_ENV === "development") {
      const interval = setInterval(() => {
        setInfo(WizardBundleOptimizer.getBundleInfo())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentStep])

  return {
    getBundleInfo: WizardBundleOptimizer.getBundleInfo,
  }
}

// Performance monitoring component for development
export const WizardPerformanceMonitor = React.memo<{ currentStep: number }>(({ currentStep }) => {
  const { getBundleInfo } = useWizardPerformance(currentStep)

  const [info, setInfo] = React.useState(getBundleInfo())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setInfo(getBundleInfo())
    }, 1000)

    return () => clearInterval(interval)
  }, [getBundleInfo])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Step: {currentStep + 1}</div>
      <div>Preloaded: {info.preloadedSteps.length}</div>
      <div>Loading: {info.loadingPromises}</div>
      <div>Memory: ~{info.memoryUsage.preloadedComponents + info.memoryUsage.activePromises}KB</div>
    </div>
  )
})

WizardPerformanceMonitor.displayName = "WizardPerformanceMonitor"
