"use client"

import React, { Suspense } from "react"
import type { ChatbotWizardData } from "@/types/chatbots/wizard"

// Lazy load wizard steps
const LazyBasicInfoStep = React.lazy(() =>
  import("../steps/BasicInfoStep").then((module) => ({
    default: module.BasicInfoStep,
  })),
)

const LazyKnowledgeSourcesStep = React.lazy(() =>
  import("../steps/KnowledgeSourcesStep").then((module) => ({
    default: module.KnowledgeSourcesStep,
  })),
)

const LazyAppearanceStep = React.lazy(() =>
  import("../steps/AppearanceStep").then((module) => ({
    default: module.AppearanceStep,
  })),
)

const LazyWelcomeSetupStep = React.lazy(() =>
  import("../steps/WelcomeSetupStep").then((module) => ({
    default: module.WelcomeSetupStep,
  })),
)

const LazyIntegrationStep = React.lazy(() =>
  import("../steps/IntegrationStep").then((module) => ({
    default: module.IntegrationStep,
  })),
)

// Optimized loading skeletons for each step
const BasicInfoSkeleton = React.memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-96 bg-muted rounded animate-pulse" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-80 bg-muted rounded animate-pulse" />
    </div>
  </div>
))

const KnowledgeSourcesSkeleton = React.memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-96 bg-muted rounded animate-pulse" />
    </div>
    <div className="h-12 bg-muted rounded animate-pulse" />
    <div className="h-64 bg-muted rounded animate-pulse" />
  </div>
))

const AppearanceSkeleton = React.memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-96 bg-muted rounded animate-pulse" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  </div>
))

const WelcomeSetupSkeleton = React.memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-96 bg-muted rounded animate-pulse" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="h-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-96 bg-muted rounded animate-pulse" />
    </div>
  </div>
))

const IntegrationSkeleton = React.memo(() => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-4 w-96 bg-muted rounded animate-pulse" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="h-64 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-80 bg-muted rounded animate-pulse" />
    </div>
  </div>
))

// Skeleton components with display names
BasicInfoSkeleton.displayName = "BasicInfoSkeleton"
KnowledgeSourcesSkeleton.displayName = "KnowledgeSourcesSkeleton"
AppearanceSkeleton.displayName = "AppearanceSkeleton"
WelcomeSetupSkeleton.displayName = "WelcomeSetupSkeleton"
IntegrationSkeleton.displayName = "IntegrationSkeleton"

// Wrapper components with error boundaries
interface StepWrapperProps {
  data: ChatbotWizardData
  onUpdate: (updates: Partial<ChatbotWizardData>) => void
  errors: string[]
}

export const OptimizedBasicInfoStep = React.memo<StepWrapperProps>((props) => (
  <Suspense fallback={<BasicInfoSkeleton />}>
    <LazyBasicInfoStep {...props} />
  </Suspense>
))

export const OptimizedKnowledgeSourcesStep = React.memo<StepWrapperProps>((props) => (
  <Suspense fallback={<KnowledgeSourcesSkeleton />}>
    <LazyKnowledgeSourcesStep {...props} />
  </Suspense>
))

export const OptimizedAppearanceStep = React.memo<StepWrapperProps>((props) => (
  <Suspense fallback={<AppearanceSkeleton />}>
    <LazyAppearanceStep {...props} />
  </Suspense>
))

export const OptimizedWelcomeSetupStep = React.memo<StepWrapperProps>((props) => (
  <Suspense fallback={<WelcomeSetupSkeleton />}>
    <LazyWelcomeSetupStep {...props} />
  </Suspense>
))

export const OptimizedIntegrationStep = React.memo<StepWrapperProps>((props) => (
  <Suspense fallback={<IntegrationSkeleton />}>
    <LazyIntegrationStep {...props} />
  </Suspense>
))

// Display names for debugging
OptimizedBasicInfoStep.displayName = "OptimizedBasicInfoStep"
OptimizedKnowledgeSourcesStep.displayName = "OptimizedKnowledgeSourcesStep"
OptimizedAppearanceStep.displayName = "OptimizedAppearanceStep"
OptimizedWelcomeSetupStep.displayName = "OptimizedWelcomeSetupStep"
OptimizedIntegrationStep.displayName = "OptimizedIntegrationStep"
