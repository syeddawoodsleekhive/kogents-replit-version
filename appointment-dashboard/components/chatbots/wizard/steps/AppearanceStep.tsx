"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Palette, Type, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatbotWizardData } from "@/types/chatbots/wizard"

interface AppearanceStepProps {
  data: ChatbotWizardData
  onUpdate: (updates: Partial<ChatbotWizardData>) => void
  errors: string[]
}

const PRESET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

const CHAT_BUBBLE_STYLES = [
  { id: "rounded", name: "Rounded", preview: "rounded-2xl" },
  { id: "square", name: "Square", preview: "rounded-md" },
  { id: "minimal", name: "Minimal", preview: "rounded-sm" },
]

const FONT_FAMILIES = [
  { id: "system", name: "System Default", class: "font-sans" },
  { id: "modern", name: "Modern", class: "font-mono" },
  { id: "classic", name: "Classic", class: "font-serif" },
]

export function AppearanceStep({ data, onUpdate, errors }: AppearanceStepProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarPreview(result)
        onUpdate({
          appearance: {
            ...data.appearance,
            avatar: result,
          },
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const updateAppearance = (updates: Partial<ChatbotWizardData["appearance"]>) => {
    onUpdate({
      appearance: {
        ...data.appearance,
        ...updates,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground">Customize how your chatbot looks and feels to match your brand.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Avatar
              </CardTitle>
              <CardDescription>Upload an avatar image for your chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {avatarPreview || data.appearance.avatar ? (
                    <img
                      src={avatarPreview || data.appearance.avatar || ""}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>Upload Avatar</span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 64x64px, PNG or JPG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Colors
              </CardTitle>
              <CardDescription>Choose your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={data.appearance.primaryColor}
                      onChange={(e) => updateAppearance({ primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={data.appearance.primaryColor}
                      onChange={(e) => updateAppearance({ primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-1 mt-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateAppearance({ primaryColor: color })}
                        className="w-6 h-6 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={data.appearance.secondaryColor}
                      onChange={(e) => updateAppearance({ secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={data.appearance.secondaryColor}
                      onChange={(e) => updateAppearance({ secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Bubble Style */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Bubble Style</CardTitle>
              <CardDescription>Choose how chat messages should look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {CHAT_BUBBLE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateAppearance({ chatBubbleStyle: style.id as any })}
                    className={cn(
                      "flex items-center justify-between p-3 border-2 rounded-lg transition-all",
                      data.appearance.chatBubbleStyle === style.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50",
                    )}
                  >
                    <span className="font-medium">{style.name}</span>
                    <div className={cn("w-8 h-6 bg-primary", style.preview)} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Family */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography
              </CardTitle>
              <CardDescription>Select the font style for your chat interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => updateAppearance({ fontFamily: font.id as any })}
                    className={cn(
                      "flex items-center justify-between p-3 border-2 rounded-lg transition-all text-left",
                      data.appearance.fontFamily === font.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50",
                    )}
                  >
                    <div>
                      <div className="font-medium">{font.name}</div>
                      <div className={cn("text-sm text-muted-foreground", font.class)}>The quick brown fox jumps</div>
                    </div>
                    {data.appearance.fontFamily === font.id && <Badge variant="default">Selected</Badge>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your chatbot will look</CardDescription>
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

                  {/* Sample Messages */}
                  <div className="space-y-3">
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
                        className={cn(
                          "px-3 py-2 max-w-[80%] text-sm",
                          CHAT_BUBBLE_STYLES.find((s) => s.id === data.appearance.chatBubbleStyle)?.preview ||
                            "rounded-2xl",
                        )}
                        style={{
                          backgroundColor: data.appearance.secondaryColor,
                          fontFamily: FONT_FAMILIES.find((f) => f.id === data.appearance.fontFamily)?.class,
                        }}
                      >
                        Hello! How can I help you today?
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <div
                        className={cn(
                          "px-3 py-2 max-w-[80%] text-sm text-white",
                          CHAT_BUBBLE_STYLES.find((s) => s.id === data.appearance.chatBubbleStyle)?.preview ||
                            "rounded-2xl",
                        )}
                        style={{
                          backgroundColor: data.appearance.primaryColor,
                          fontFamily: FONT_FAMILIES.find((f) => f.id === data.appearance.fontFamily)?.class,
                        }}
                      >
                        I need help with my account
                      </div>
                    </div>

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
                        className={cn(
                          "px-3 py-2 max-w-[80%] text-sm",
                          CHAT_BUBBLE_STYLES.find((s) => s.id === data.appearance.chatBubbleStyle)?.preview ||
                            "rounded-2xl",
                        )}
                        style={{
                          backgroundColor: data.appearance.secondaryColor,
                          fontFamily: FONT_FAMILIES.find((f) => f.id === data.appearance.fontFamily)?.class,
                        }}
                      >
                        I'd be happy to help you with your account. What specific issue are you experiencing?
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
