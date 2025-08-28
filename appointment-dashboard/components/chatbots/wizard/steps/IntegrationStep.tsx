"use client"

import React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Globe, MessageCircle, Slack, Code, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatbotWizardData } from "@/types/chatbots/wizard"

interface IntegrationStepProps {
  data: ChatbotWizardData
  onUpdate: (updates: Partial<ChatbotWizardData>) => void
  errors: string[]
}

const INTEGRATION_TYPES = [
  {
    id: "website",
    name: "Website Widget",
    description: "Embed a chat widget on your website",
    icon: Globe,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    popular: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Connect to WhatsApp Business API",
    icon: MessageCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    popular: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Add as a Slack bot to your workspace",
    icon: Slack,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    popular: false,
  },
  {
    id: "api",
    name: "API Integration",
    description: "Use REST API for custom integrations",
    icon: Code,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    popular: false,
  },
]

export function IntegrationStep({ data, onUpdate, errors }: IntegrationStepProps) {
  const [copiedCode, setCopiedCode] = useState(false)

  const updateIntegration = (updates: Partial<ChatbotWizardData["integration"]>) => {
    onUpdate({
      integration: {
        ...data.integration,
        ...updates,
      },
    })
  }

  const generateEmbedCode = () => {
    const botId = "cb_" + Math.random().toString(36).substr(2, 9)
    return `<script>
  (function() {
    var chatbot = document.createElement('script');
    chatbot.src = 'https://widget.chatbuilder.com/embed.js';
    chatbot.setAttribute('data-bot-id', '${botId}');
    chatbot.setAttribute('data-primary-color', '${data.appearance.primaryColor}');
    document.head.appendChild(chatbot);
  })();
</script>`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const renderIntegrationSettings = () => {
    switch (data.integration.type) {
      case "website":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Website Widget Settings</CardTitle>
              <CardDescription>Configure how the chat widget appears on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Widget Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={data.integration.settings.position === "bottom-right" ? "default" : "outline"}
                    onClick={() =>
                      updateIntegration({
                        settings: { ...data.integration.settings, position: "bottom-right" },
                      })
                    }
                  >
                    Bottom Right
                  </Button>
                  <Button
                    variant={data.integration.settings.position === "bottom-left" ? "default" : "outline"}
                    onClick={() =>
                      updateIntegration({
                        settings: { ...data.integration.settings, position: "bottom-left" },
                      })
                    }
                  >
                    Bottom Left
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  placeholder="https://yourwebsite.com"
                  value={data.integration.settings.websiteUrl || ""}
                  onChange={(e) =>
                    updateIntegration({
                      settings: { ...data.integration.settings, websiteUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="relative">
                  <Textarea value={generateEmbedCode()} readOnly className="font-mono text-xs min-h-[120px]" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateEmbedCode())}
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy this code and paste it before the closing &lt;/body&gt; tag on your website
                </p>
              </div>
            </CardContent>
          </Card>
        )

      case "whatsapp":
        return (
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Integration</CardTitle>
              <CardDescription>Connect your chatbot to WhatsApp Business API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Business Number</Label>
                <Input
                  id="whatsapp-number"
                  placeholder="+1234567890"
                  value={data.integration.settings.phoneNumber || ""}
                  onChange={(e) =>
                    updateIntegration({
                      settings: { ...data.integration.settings, phoneNumber: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-token">Access Token</Label>
                <Input
                  id="whatsapp-token"
                  type="password"
                  placeholder="Your WhatsApp Business API token"
                  value={data.integration.settings.accessToken || ""}
                  onChange={(e) =>
                    updateIntegration({
                      settings: { ...data.integration.settings, accessToken: e.target.value },
                    })
                  }
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Create a WhatsApp Business account</li>
                  <li>Apply for WhatsApp Business API access</li>
                  <li>Get your access token from Meta Business</li>
                  <li>Configure webhook URL in your WhatsApp settings</li>
                  <li>Test the integration with a test message</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )

      case "slack":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>Add your chatbot to your Slack workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slack-workspace">Slack Workspace URL</Label>
                <Input
                  id="slack-workspace"
                  placeholder="yourworkspace.slack.com"
                  value={data.integration.settings.workspaceUrl || ""}
                  onChange={(e) =>
                    updateIntegration({
                      settings: { ...data.integration.settings, workspaceUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slack-token">Bot User OAuth Token</Label>
                <Input
                  id="slack-token"
                  type="password"
                  placeholder="xoxb-your-token-here"
                  value={data.integration.settings.botToken || ""}
                  onChange={(e) =>
                    updateIntegration({
                      settings: { ...data.integration.settings, botToken: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slack-channel">Default Channel</Label>
                <Input
                  id="slack-channel"
                  placeholder="#general"
                  value={data.integration.settings.defaultChannel || ""}
                  onChange={(e) =>
                    updateIntegration({
                      settings: { ...data.integration.settings, defaultChannel: e.target.value },
                    })
                  }
                />
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                  <li>Go to api.slack.com and create a new app</li>
                  <li>Enable Bot Token Scopes: chat:write, channels:read</li>
                  <li>Install the app to your workspace</li>
                  <li>Copy the Bot User OAuth Token</li>
                  <li>Invite the bot to your desired channels</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )

      case "api":
        return (
          <Card>
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>Use our REST API for custom integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <div className="relative">
                  <Input value="https://api.chatbuilder.com/v1/chat" readOnly className="font-mono" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-1 right-1"
                    onClick={() => copyToClipboard("https://api.chatbuilder.com/v1/chat")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input value={`cb_api_${Math.random().toString(36).substr(2, 20)}`} readOnly className="font-mono" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-1 right-1"
                    onClick={() => copyToClipboard(`cb_api_${Math.random().toString(36).substr(2, 20)}`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Example Request</Label>
                <Textarea
                  value={`curl -X POST https://api.chatbuilder.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me?",
    "session_id": "user_123"
  }'`}
                  readOnly
                  className="font-mono text-xs min-h-[120px]"
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">API Documentation</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Complete API documentation with examples and SDKs available at:
                </p>
                <Button variant="outline" size="sm">
                  View API Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integration</h2>
        <p className="text-muted-foreground">Choose how you want to deploy and use your chatbot.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Type</CardTitle>
              <CardDescription>Select where you want to deploy your chatbot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {INTEGRATION_TYPES.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => updateIntegration({ type: integration.id as any, settings: {} })}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left",
                      data.integration.type === integration.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50",
                    )}
                  >
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", integration.color)}>
                      {integration.icon && <integration.icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{integration.name}</div>
                        {integration.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{integration.description}</div>
                    </div>
                    {data.integration.type === integration.id && (
                      <Badge variant="default" className="ml-2">
                        Selected
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {data.integration.type && renderIntegrationSettings()}
        </div>

        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Preview</CardTitle>
              <CardDescription>How your chatbot will appear in the selected platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-background min-h-[300px] flex items-center justify-center">
                {data.integration.type ? (
                  <div className="text-center space-y-4">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full mx-auto flex items-center justify-center",
                        INTEGRATION_TYPES.find((t) => t.id === data.integration.type)?.color,
                      )}
                    >
                      {INTEGRATION_TYPES.find((t) => t.id === data.integration.type)?.icon &&
                        React.createElement(INTEGRATION_TYPES.find((t) => t.id === data.integration.type)!.icon, {
                          className: "w-8 h-8",
                        })}
                    </div>
                    <div>
                      <div className="font-medium">
                        {INTEGRATION_TYPES.find((t) => t.id === data.integration.type)?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ready to deploy "{data.name || "Your Chatbot"}"
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Configuration Complete
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an integration type to see preview</p>
                  </div>
                )}
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
