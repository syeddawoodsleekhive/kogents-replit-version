"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Bot, Briefcase, Heart, Code, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatbotWizardData } from "@/types/chatbots/wizard"

interface BasicInfoStepProps {
  data: ChatbotWizardData
  onUpdate: (updates: Partial<ChatbotWizardData>) => void
  errors: string[]
}

const PERSONALITIES = [
  {
    id: "professional" as const,
    name: "Professional",
    description: "Formal, business-focused communication",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "friendly" as const,
    name: "Friendly",
    description: "Warm, approachable, and helpful",
    icon: Heart,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    id: "casual" as const,
    name: "Casual",
    description: "Relaxed, conversational tone",
    icon: Bot,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "technical" as const,
    name: "Technical",
    description: "Precise, detailed, expert knowledge",
    icon: Code,
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    id: "creative" as const,
    name: "Creative",
    description: "Imaginative, inspiring, innovative",
    icon: Lightbulb,
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
]

// Memoized personality option component
const PersonalityOption = React.memo<{
  personality: (typeof PERSONALITIES)[0]
  isSelected: boolean
  onSelect: (id: string) => void
}>(({ personality, isSelected, onSelect }) => {
  const handleClick = React.useCallback(() => {
    onSelect(personality.id)
  }, [onSelect, personality.id])

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left",
        isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50",
      )}
    >
      <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", personality.color)}>
        <personality.icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{personality.name}</div>
        <div className="text-sm text-muted-foreground">{personality.description}</div>
      </div>
      {isSelected && (
        <Badge variant="default" className="ml-2">
          Selected
        </Badge>
      )}
    </button>
  )
})

PersonalityOption.displayName = "PersonalityOption"

// Memoized error display component
const ErrorDisplay = React.memo<{ errors: string[] }>(({ errors = [] }) => {
  if (!errors || errors.length === 0) return null

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-red-800">
          <div className="font-medium">Please fix the following issues:</div>
        </div>
        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
})

ErrorDisplay.displayName = "ErrorDisplay"

export const BasicInfoStep = React.memo<BasicInfoStepProps>(({ data, onUpdate, errors = [] }) => {
  // Ensure errors is always an array
  const safeErrors = errors || []

  const handleNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ name: e.target.value })
    },
    [onUpdate],
  )

  const handleDescriptionChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ description: e.target.value })
    },
    [onUpdate],
  )

  const handlePersonalitySelect = React.useCallback(
    (personalityId: string) => {
      onUpdate({ personality: personalityId as any })
    },
    [onUpdate],
  )

  const hasNameError = React.useMemo(() => safeErrors.some((e) => e.includes("name")), [safeErrors])

  const hasDescriptionError = React.useMemo(() => safeErrors.some((e) => e.includes("description")), [safeErrors])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Basic Information</h2>
        <p className="text-muted-foreground">Let's start by setting up your chatbot's identity and personality.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Details</CardTitle>
              <CardDescription>Give your chatbot a name and describe what it does</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Bot Name *</Label>
                <Input
                  id="bot-name"
                  placeholder="e.g., Customer Support Assistant"
                  value={data.name}
                  onChange={handleNameChange}
                  className={hasNameError ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-description">Description *</Label>
                <Textarea
                  id="bot-description"
                  placeholder="Describe what your chatbot will help users with..."
                  value={data.description}
                  onChange={handleDescriptionChange}
                  className={cn("min-h-[100px]", hasDescriptionError ? "border-red-500" : "")}
                />
                <p className="text-xs text-muted-foreground">This helps users understand what your bot can do</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personality</CardTitle>
              <CardDescription>Choose how your chatbot should communicate with users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {PERSONALITIES.map((personality) => (
                  <PersonalityOption
                    key={personality.id}
                    personality={personality}
                    isSelected={data.personality === personality.id}
                    onSelect={handlePersonalitySelect}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ErrorDisplay errors={safeErrors} />
    </div>
  )
})

BasicInfoStep.displayName = "BasicInfoStep"
