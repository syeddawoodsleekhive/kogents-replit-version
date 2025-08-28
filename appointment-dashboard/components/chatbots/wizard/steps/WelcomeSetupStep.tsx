"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Plus, X, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatbotWizardData } from "@/types/chatbots/wizard"

interface WelcomeSetupStepProps {
  data: ChatbotWizardData
  onUpdate: (updates: Partial<ChatbotWizardData>) => void
  errors: string[]
}

const SUGGESTED_PROMPTS = [
  "How can I get started?",
  "What services do you offer?",
  "I need help with...",
  "Tell me about pricing",
  "How do I contact support?",
  "What are your hours?",
  "Can you help me with my order?",
  "I have a technical question",
]

export function WelcomeSetupStep({ data, onUpdate, errors }: WelcomeSetupStepProps) {
  const [newPrompt, setNewPrompt] = useState("")

  const updateWelcome = (updates: Partial<ChatbotWizardData["welcome"]>) => {
    onUpdate({
      welcome: {
        ...data.welcome,
        ...updates,
      },
    })
  }

  const addPrompt = (prompt: string) => {
    if (prompt.trim() && !data.welcome.initialPrompts.includes(prompt.trim())) {
      updateWelcome({
        initialPrompts: [...data.welcome.initialPrompts, prompt.trim()],
      })
      setNewPrompt("")
    }
  }

  const removePrompt = (index: number) => {
    const newPrompts = data.welcome.initialPrompts.filter((_, i) => i !== index)
    updateWelcome({ initialPrompts: newPrompts })
  }

  const addSuggestedPrompt = (prompt: string) => {
    addPrompt(prompt)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome & Prompts</h2>
        <p className="text-muted-foreground">
          Set up the first impression and guide users on how to interact with your chatbot.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Welcome Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Welcome Message
              </CardTitle>
              <CardDescription>The first message users will see when they start a conversation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Message *</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Hello! I'm here to help you with any questions you might have. How can I assist you today?"
                  value={data.welcome.message}
                  onChange={(e) => updateWelcome({ message: e.target.value })}
                  className={cn(
                    "min-h-[100px]",
                    errors.some((e) => e.includes("welcome message")) ? "border-red-500" : "",
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Keep it friendly and let users know what your bot can help with
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Initial Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Initial Prompts</CardTitle>
              <CardDescription>Quick action buttons to help users get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add Custom Prompt</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., How do I reset my password?"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addPrompt(newPrompt)}
                  />
                  <Button onClick={() => addPrompt(newPrompt)} disabled={!newPrompt.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {data.welcome.initialPrompts.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Prompts</Label>
                  <div className="space-y-2">
                    {data.welcome.initialPrompts.map((prompt, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span className="text-sm flex-1">{prompt}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrompt(index)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Suggested Prompts
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.filter((prompt) => !data.welcome.initialPrompts.includes(prompt)).map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      onClick={() => addSuggestedPrompt(prompt)}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How the welcome experience will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-background min-h-[400px]">
                <div className="space-y-4">
                  {/* Chat Header */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: data.appearance.primaryColor + "10" }}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {data.appearance.avatar ? (
                        <img
                          src={data.appearance.avatar || "/placeholder.svg"}
                          alt="Bot"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{data.name || "Your Chatbot"}</div>
                      <div className="text-xs text-muted-foreground">Online</div>
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {data.appearance.avatar ? (
                        <img
                          src={data.appearance.avatar || "/placeholder.svg"}
                          alt="Bot"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className="px-3 py-2 rounded-2xl max-w-[90%] text-sm"
                      style={{ backgroundColor: data.appearance.secondaryColor }}
                    >
                      {data.welcome.message || "Hello! How can I help you today?"}
                    </div>
                  </div>

                  {/* Initial Prompts */}
                  {data.welcome.initialPrompts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground px-2">Quick actions:</div>
                      <div className="space-y-1">
                        {data.welcome.initialPrompts.slice(0, 4).map((prompt, index) => (
                          <button
                            key={index}
                            className="w-full text-left p-2 text-sm border rounded-lg hover:bg-muted/50 transition-colors"
                            style={{ borderColor: data.appearance.primaryColor + "30" }}
                          >
                            {prompt}
                          </button>
                        ))}
                        {data.welcome.initialPrompts.length > 4 && (
                          <div className="text-xs text-muted-foreground px-2">
                            +{data.welcome.initialPrompts.length - 4} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {errors.length > 0 && (
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
      )}
    </div>
  )
}
